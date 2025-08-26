import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1';

// Forzamos a la IA a buscar los modelos en el sitio correcto, SIEMPRE.
env.allowLocalModels = false;

document.addEventListener('DOMContentLoaded', () => {
    // --- Referencias a nodos del DOM ---
    const inputText = document.getElementById('input-text');
    const analyzeBtn = document.getElementById('analyze-btn');
    const resultsContainer = document.getElementById('results-container');
    const verdictBox = document.getElementById('verdict-box');
    const verdictText = document.getElementById('verdict-text');
    const adviceBox = document.getElementById('advice-box');
    const nerBox = document.getElementById('ner-box');
    const nerText = document.getElementById('ner-text');
    const status = document.getElementById('status').querySelector('p');
    const historyBtn = document.getElementById('history-btn');
    const historyModal = document.getElementById('history-modal');
    const closeModalBtn = document.querySelector('.close-button');
    const historyList = document.getElementById('history-list');
    const copyBtn = document.getElementById('copy-btn');
    const clearBtn = document.getElementById('clear-btn');

    // --- Estado del Kernel ---
    let classifier = null;
    let ner = null;

    // --- Base de Conocimiento de Amenazas ---
    const threatLabels = [ 'phishing', 'estafa de soporte técnico', 'oferta engañosa', 'estafa', 'sextorsión', 'fraude de caridad', 'notificación de entrega falsa', 'falsa urgencia', 'spam', 'legítimo' ];
    const threatExplanations = {
        'phishing': 'El texto suplanta la identidad de una entidad de confianza (banco, red social) para robar tus credenciales.',
        'estafa de soporte técnico': 'Finge ser un soporte técnico (Microsoft, Apple) para que les des acceso a tu equipo o les pagues por un falso problema.',
        'oferta engañosa': 'Una propuesta (trabajo, premio, inversión) que parece demasiado buena para ser verdad, probablemente lo sea.',
        'estafa': 'Un término general para cualquier intento de engañarte para obtener dinero o información valiosa.',
        'sextorsión': 'Amenaza con publicar supuesto material íntimo tuyo si no realizas un pago.',
        'fraude de caridad': 'Pide donaciones para una causa falsa o se hace pasar por una ONG conocida.',
        'notificación de entrega falsa': 'Simula ser una empresa de paquetería (Correos, Amazon) diciendo que tienes un paquete retenido por una pequeña tasa.',
        'falsa urgencia': 'Táctica usada en muchas estafas para que actúes con pánico y sin pensar.',
        'spam': 'Correo o mensaje no solicitado, generalmente publicitario y enviado de forma masiva.',
        'legítimo': 'El texto no presenta indicadores claros de amenaza y parece ser genuino.',
    };
    const threatAdvice = {
        'phishing': ['NUNCA hagas clic en enlaces de correos o SMS de este tipo.','Verifica la dirección del remitente. A menudo contiene errores sutiles.','Accede siempre a tu cuenta escribiendo la URL oficial en el navegador, no desde el enlace.'],
        'estafa de soporte técnico': ['Cuelga el teléfono o cierra el chat. Microsoft/Apple NUNCA te contactarán de esta forma.','No instales ningún software que te pidan (AnyDesk, TeamViewer).','Nunca les des el control de tu ordenador.'],
        'oferta engañosa': ['Desconfía de ofertas que no has solicitado y que prometen mucho por poco esfuerzo.','Nunca pagues por adelantado para un trabajo o para recibir un premio.','Investiga a la empresa o persona que te contacta.'],
        'sextorsión': ['NO PAGUES. Pagar no garantiza que borren nada y te pedirán más dinero.','Denuncia el caso a la policía y guarda todas las pruebas.','Bloquea al remitente y no respondas a sus mensajes.'],
        'notificación de entrega falsa': ['No pagues ninguna tasa aduanera desde un enlace de SMS/email.','Copia el número de seguimiento y búscalo en la web OFICIAL de la empresa de paquetería.','Elimina el mensaje.'],
        'estafa': ['Si suena demasiado bueno para ser verdad, casi seguro que no lo es.','Nunca envíes dinero a alguien que no conoces en persona.','No compartas información personal o financiera con desconocidos.'],
        'falsa urgencia': ['Tómate un respiro. Las estafas buscan que actúes con pánico.','Contacta con la supuesta entidad a través de un canal oficial que tú conozcas.','Cuestiona por qué necesitan que actúes AHORA MISMO.'],
        'spam': ['No respondas al mensaje.','Marca el mensaje como Correo no deseado o Spam.','No hagas clic en ningún enlace.']
    };
    const threatKeywords = {
        'urgente': 15, 'inmediato': 15, 'inmediata': 15, 'ahora mismo': 15, 'última oportunidad': 15, 'dispone de 24 horas': 15, '48 horas': 15, 'tiempo limitado': 10,
        'cuenta bancaria': 20, 'datos bancarios': 20, 'transferencia': 15, 'iban': 20, 'tarjeta de crédito': 15, 'pago': 10,
        'contraseña': 15, 'credenciales': 15, 'verificar tu cuenta': 20, 'actividad sospechosa': 15, 'cuenta suspendida': 15,
        'no puedo atender llamadas': 25, 'móvil apagado': 25, 'solo por email': 20, 'directora financiera': 10,
        'ha ganado un premio': 20, 'lotería': 20, 'herencia': 20, 'oferta de trabajo': 10,
        'haga clic': 10, 'en el siguiente enlace': 10,
        'paquete': 15, 'entrega': 15, 'envío': 15, 'tasas de aduana': 25, 'no ha podido ser entregado': 20,
        'soporte técnico': 25, 'virus detectado': 30, 'troyano': 30, 'software espía': 30, 'licencia ha sido suspendida': 25, 'llame inmediatamente': 20, 'microsoft': 10, 'windows': 10,
        'bitcoin': 30, 'btc': 30, 'crypto': 25, 'monedero': 25, 'webcam': 30, 'video sexual': 35, 'grabado': 25, 'humillación': 20, 'secreto': 20, 'malware': 20
    };

    // --- Inicialización del Kernel de IA ---
    async function initializeKernel() {
        status.textContent = '> STATUS: LOADING NEURAL CLASSIFIER...';
        classifier = await pipeline('zero-shot-classification', 'Xenova/bart-large-mnli');
        status.textContent = '> STATUS: LOADING NER PAYLOAD EXTRACTOR...';
        ner = await pipeline('token-classification', 'Xenova/bert-base-multilingual-cased-ner-hrl');
        status.textContent = '> STATUS: KERNEL ONLINE. AWAITING INPUT.';
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = '[ ANALYZE THREAT ]';
    }
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = '[ KERNEL OFFLINE... ]';
    initializeKernel();

    // --- Bucle Principal de Ejecución ---
    analyzeBtn.addEventListener('click', async () => {
        const textToAnalyze = inputText.value;
        if (textToAnalyze.trim().length < 20) {
            status.textContent = '> ERROR: INPUT STREAM TOO SHORT.'; return;
        }
        analyzeBtn.disabled = true;
        status.textContent = '> EXECUTING THREAT ANALYSIS... PLEASE WAIT.';
        resultsContainer.classList.remove('hidden');
        try {
            const classificationResult = await classifier(textToAnalyze, threatLabels);
            const nerResult = await ner(textToAnalyze, { group_entities: true });
            renderVerdict(classificationResult, textToAnalyze);
            renderNer(textToAnalyze, nerResult);
            status.textContent = '> ANALYSIS COMPLETE. STANDING BY.';
        } catch (error) {
            console.error("Analysis Error:", error);
            status.textContent = `> KERNEL PANIC: ${error.message}`;
        } finally {
            analyzeBtn.disabled = false;
        }
    });

    // --- Motor Híbrido y Renderizado ---
    function calculateHeuristicScore(text) {
        let score = 0;
        const lowerCaseText = text.toLowerCase();
        for (const keyword in threatKeywords) {
            if (lowerCaseText.includes(keyword.toLowerCase())) { score += threatKeywords[keyword]; }
        }
        return score;
    }

    function renderVerdict(aiResult, originalText) {
        const heuristicScore = calculateHeuristicScore(originalText);
        const maxScore = Math.max(...aiResult.scores);
        const maxIndex = aiResult.scores.indexOf(maxScore);
        let bestLabel = aiResult.labels[maxIndex];
        const bestScore = aiResult.scores[maxIndex];
        if (heuristicScore > 20 && bestLabel === 'legítimo') {
            const possibleScams = ['phishing', 'notificación de entrega falsa', 'estafa', 'estafa de soporte técnico'];
            const scamScores = aiResult.labels.map((label, index) => ({label, score: aiResult.scores[index]})).filter(item => possibleScams.includes(item.label));
            if (scamScores.length > 0) {
                bestLabel = scamScores.reduce((prev, current) => (prev.score > current.score) ? prev : current).label;
            }
        }
        const scorePercent = (bestScore * 100).toFixed(1);
        const explanation = threatExplanations[bestLabel];
        let verdictClass, verdictTitle;
        if (heuristicScore >= 40 || (bestLabel !== 'legítimo' && bestScore > 0.7)) {
             verdictClass = 'alert-red';
             verdictTitle = `[ALERTA MÁXIMA: ${bestLabel.toUpperCase()} (Riesgo Heurístico: ${heuristicScore}pts)]`;
        } else if (heuristicScore >= 20 || (bestLabel !== 'legítimo')) {
             verdictClass = 'alert-orange';
             verdictTitle = `[SOSPECHOSO: ${bestLabel.toUpperCase()} (Confianza IA: ${scorePercent}% / Riesgo: ${heuristicScore}pts)]`;
        } else {
             verdictClass = 'alert-green';
             verdictTitle = `[LEGÍTIMO (Confianza IA: ${scorePercent}%)]`;
        }
        verdictBox.className = 'verdict-box';
        verdictBox.classList.add(verdictClass);
        typewriterEffect(verdictText, `${verdictTitle}\n> ${explanation}`);
        renderAdvice(bestLabel);
        saveToHistory(originalText, `${verdictTitle}\n> ${explanation}`, bestLabel);
    }
    
    function renderAdvice(threat) {
        adviceBox.innerHTML = '';
        const adviceList = threatAdvice[threat];
        if (adviceList && adviceList.length > 0) {
            const title = document.createElement('h3');
            title.textContent = 'Protocolo de Actuación Recomendado:';
            const list = document.createElement('ul');
            adviceList.forEach(tip => {
                const item = document.createElement('li');
                item.textContent = tip;
                list.appendChild(item);
            });
            adviceBox.appendChild(title);
            adviceBox.appendChild(list);
        }
    }

    function renderNer(originalText, entities) {
        let highlightedText = originalText;
        entities.sort((a, b) => b.start - a.start);
        entities.forEach(entity => {
            if (['URL', 'PER', 'LOC', 'ORG'].includes(entity.entity_group)) {
                 const tag = `<span class="ner-text-highlight" title="Entidad: ${entity.entity_group}">${entity.word}</span>`;
                 highlightedText = highlightedText.substring(0, entity.start) + tag + highlightedText.substring(entity.end);
            }
        });
        nerText.innerHTML = highlightedText.replace(/\n/g, '<br>');
    }

    function typewriterEffect(element, text) {
        element.innerHTML = ""; let i = 0; const speed = 10;
        function type() { if (i < text.length) { element.innerHTML += text.charAt(i) === '\n' ? '<br>' : text.charAt(i); i++; setTimeout(type, speed); } }
        type();
    }

    // --- Lógica del Historial ---
    function saveToHistory(text, verdict, label) {
        const history = JSON.parse(localStorage.getItem('escudoDigitalHistory')) || [];
        const newEntry = { id: Date.now(), date: new Date().toLocaleString('es-ES'), text: text, verdict: verdict, label: label };
        history.unshift(newEntry);
        localStorage.setItem('escudoDigitalHistory', JSON.stringify(history));
    }
    function loadHistory() { renderHistory(); }
    function deleteFromHistory(id) {
        let history = JSON.parse(localStorage.getItem('escudoDigitalHistory')) || [];
        history = history.filter(entry => entry.id !== id);
        localStorage.setItem('escudoDigitalHistory', JSON.stringify(history));
        renderHistory();
    }
    function renderHistory() {
        const history = JSON.parse(localStorage.getItem('escudoDigitalHistory')) || [];
        historyList.innerHTML = '';
        if (history.length === 0) { historyList.innerHTML = '<p>No hay análisis guardados.</p>'; return; }
        history.forEach(entry => {
            const item = document.createElement('div');
            item.className = 'history-item';
            item.innerHTML = `<div class="history-item-date">${entry.date}</div><p class="history-item-preview">${entry.text}</p><button class="delete-btn" title="Eliminar entrada"><svg viewBox="0 0 448 512" fill="currentColor" width="16" height="16"><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"/></svg></button>`;
            item.addEventListener('click', () => {
                inputText.value = entry.text;
                verdictBox.className = 'verdict-box';
                typewriterEffect(verdictText, entry.verdict);
                renderAdvice(entry.label);
                renderNer(entry.text, []);
                resultsContainer.classList.remove('hidden');
                historyModal.classList.add('hidden');
            });
            const deleteBtn = item.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                deleteFromHistory(entry.id);
            });
            historyList.appendChild(item);
        });
    }

    // --- Lógica de la Ventana Modal y Utilidades ---
    historyBtn.addEventListener('click', () => { loadHistory(); historyModal.classList.remove('hidden'); });
    closeModalBtn.addEventListener('click', () => historyModal.classList.add('hidden'));
    window.addEventListener('click', (event) => { if (event.target === historyModal) { historyModal.classList.add('hidden'); } });
    
    copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(inputText.value).then(() => {
            status.textContent = '> INPUT STREAM COPIED TO CLIPBOARD.';
        });
    });
    clearBtn.addEventListener('click', () => {
        inputText.value = '';
        resultsContainer.classList.add('hidden');
        status.textContent = '> INPUT STREAM CLEARED. AWAITING INPUT.';
    });

    // --- LÓGICA PARA EL FONDO DE MATRIX ---
    const canvas = document.getElementById('matrix-background');
    const ctx = canvas.getContext('2d');
    let w = canvas.width = window.innerWidth;
    let h = canvas.height = window.innerHeight;
    let cols = Math.floor(w / 20) + 1;
    let ypos = Array(cols).fill(0);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    function matrix() {
        ctx.fillStyle = 'rgba(0,0,0,.05)';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = 'rgba(240, 240, 240, 0.9)';
        ctx.font = '15pt ' + getComputedStyle(document.body).fontFamily;
        ypos.forEach((y, ind) => {
            const text = String.fromCharCode(Math.random() * 128);
            const x = ind * 20;
            ctx.fillText(text, x, y);
            if (y > 100 + Math.random() * 10000) { ypos[ind] = 0; }
            else { ypos[ind] = y + 20; }
        });
    }
    setInterval(matrix, 50);
    window.addEventListener('resize', () => {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
        cols = Math.floor(w / 20) + 1;
        ypos = Array(cols).fill(0);
    });
});
