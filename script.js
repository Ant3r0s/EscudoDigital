document.addEventListener('DOMContentLoaded', () => {
    // --- Referencias a nodos del DOM ---
    const inputText = document.getElementById('input-text');
    const analyzeBtn = document.getElementById('analyze-btn');
    const resultsContainer = document.getElementById('results-container');
    const verdictBox = document.getElementById('verdict-box');
    const verdictText = document.getElementById('verdict-text');
    const nerBox = document.getElementById('ner-box');
    const nerText = document.getElementById('ner-text');
    const status = document.getElementById('status').querySelector('p');

    // --- Estado del Kernel ---
    let classifier = null;
    let ner = null;

    // --- Directivas de Análisis ---
    const threatLabels = ['phishing', 'estafa', 'spam', 'oferta engañosa', 'falsa urgencia', 'legítimo'];
    const threatExplanations = {
        'phishing': 'El texto contiene elementos comunes de phishing, como la solicitud de credenciales o clics en enlaces sospechosos para "verificar" una cuenta.',
        'estafa': 'El texto presenta patrones de estafa, prometiendo ganancias irreales o solicitando pagos por adelantado.',
        'oferta engañosa': 'La propuesta (trabajo, premio, etc.) contiene señales de ser fraudulenta o engañosa.',
        'spam': 'El contenido es genérico, no solicitado y probablemente enviado de forma masiva.',
        'falsa urgencia': 'El mensaje intenta crear pánico o urgencia para forzar una acción rápida sin pensar.',
        'legítimo': 'El texto no presenta indicadores claros de amenaza y parece ser genuino.',
    };

    // --- Inicialización del Kernel de IA ---
    async function initializeKernel() {
        status.textContent = '> STATUS: LOADING NEURAL CLASSIFIER...';
        classifier = await window.pipeline('zero-shot-classification', 'Xenova/mobilebert-uncased-mnli');
        
        status.textContent = '> STATUS: LOADING NER PAYLOAD EXTRACTOR...';
        ner = await window.pipeline('token-classification', 'Xenova/bert-base-multilingual-cased-ner-hrl');

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
            status.textContent = '> ERROR: INPUT STREAM TOO SHORT. MINIMUM 20 CHARACTERS.';
            return;
        }

        analyzeBtn.disabled = true;
        status.textContent = '> EXECUTING THREAT ANALYSIS... PLEASE WAIT.';
        resultsContainer.classList.remove('hidden');

        try {
            const classificationResult = await classifier(textToAnalyze, threatLabels);
            renderVerdict(classificationResult);

            const nerResult = await ner(textToAnalyze, {group_entities: true});
            renderNer(textToAnalyze, nerResult);

            status.textContent = '> ANALYSIS COMPLETE. STANDING BY.';
        } catch (error) {
            console.error("Analysis Error:", error);
            status.textContent = `> KERNEL PANIC: ${error.message}`;
        } finally {
            analyzeBtn.disabled = false;
        }
    });

    // --- Renderizado de Salida ---
    function renderVerdict(result) {
        // 1. Encontrar la puntuación más alta en el array de 'scores'.
        const maxScore = Math.max(...result.scores);
        // 2. Encontrar el índice (la posición) de esa puntuación.
        const maxIndex = result.scores.indexOf(maxScore);
        // 3. Usar ese índice para obtener la etiqueta y la puntuación correctas.
        const bestLabel = result.labels[maxIndex];
        const bestScore = result.scores[maxIndex];

        const scorePercent = (bestScore * 100).toFixed(1);
        let verdictClass, verdictTitle;

        if (bestLabel === 'legítimo' && bestScore > 0.6) {
            verdictClass = 'alert-green';
            verdictTitle = `[LEGÍTIMO (${scorePercent}%)]`;
        } else if (bestLabel === 'legítimo') {
             verdictClass = 'alert-orange';
             verdictTitle = `[SOSPECHOSO - BAJA CONFIANZA (${scorePercent}%)]`;
        } else if (bestScore < 0.5) {
            verdictClass = 'alert-orange';
            verdictTitle = `[AMENAZA INDETERMINADA, POSIBLE ${bestLabel.toUpperCase()} (${scorePercent}%)]`;
        } else {
            verdictClass = 'alert-red';
            verdictTitle = `[ALERTA: ${bestLabel.toUpperCase()} (${scorePercent}%)]`;
        }
        
        verdictBox.className = 'verdict-box'; // Reset
        verdictBox.classList.add(verdictClass);
        
        const explanation = threatExplanations[bestLabel];
        typewriterEffect(verdictText, `${verdictTitle}\n> ${explanation}`);
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
        element.innerHTML = "";
        let i = 0;
        const speed = 10;
        function type() {
            if (i < text.length) {
                element.innerHTML += text.charAt(i) === '\n' ? '<br>' : text.charAt(i);
                i++;
                setTimeout(type, speed);
            }
        }
        type();
    }

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
            if (y > 100 + Math.random() * 10000) {
                ypos[ind] = 0;
            } else {
                ypos[ind] = y + 20;
            }
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
