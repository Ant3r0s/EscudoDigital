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
        analyzeBtn.textContent = '[ ANALIZAR AMENAZA ]';
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
            // 1. Análisis de Intención
            const classificationResult = await classifier(textToAnalyze, threatLabels);
            renderVerdict(classificationResult);

            // 2. Extracción de Payloads
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
        const bestMatch = result.labels.reduce((prev, current) => (prev.score > current.score) ? prev : current);
        const scorePercent = (bestMatch.score * 100).toFixed(1);
        let verdictClass, verdictTitle;

        if (bestMatch.label === 'legítimo' && bestMatch.score > 0.6) {
            verdictClass = 'alert-green';
            verdictTitle = `[LEGÍTIMO (${scorePercent}%)]`;
        } else if (bestMatch.label === 'legítimo') {
             verdictClass = 'alert-orange';
             verdictTitle = `[SOSPECHOSO - BAJA CONFIANZA (${scorePercent}%)]`;
        } else if (bestMatch.score < 0.5) {
            verdictClass = 'alert-orange';
            verdictTitle = `[AMENAZA INDETERMINADA, POSIBLE ${bestMatch.label.toUpperCase()} (${scorePercent}%)]`;
        } else {
            verdictClass = 'alert-red';
            verdictTitle = `[ALERTA: ${bestMatch.label.toUpperCase()} (${scorePercent}%)]`;
        }
        
        verdictBox.className = 'verdict-box'; // Reset
        verdictBox.classList.add(verdictClass);
        
        const explanation = threatExplanations[bestMatch.label];
        typewriterEffect(verdictText, `${verdictTitle}\n> ${explanation}`);
    }

    function renderNer(originalText, entities) {
        let highlightedText = originalText;
        // Procesamos las entidades en orden inverso para no alterar los índices
        entities.sort((a, b) => b.start - a.start); 
        entities.forEach(entity => {
            if (entity.entity_group === 'URL' || entity.entity_group === 'PER' || entity.entity_group === 'LOC' || entity.entity_group === 'ORG') {
                 const tag = `<span class="ner-text-highlight" title="Entidad: ${entity.entity_group}">${entity.word}</span>`;
                 highlightedText = highlightedText.substring(0, entity.start) + tag + highlightedText.substring(entity.end);
            }
        });
        nerText.innerHTML = highlightedText.replace(/\n/g, '<br>');
    }

    function typewriterEffect(element, text) {
        element.innerHTML = "";
        let i = 0;
        const speed = 10; // ms
        function type() {
            if (i < text.length) {
                element.innerHTML += text.charAt(i) === '\n' ? '<br>' : text.charAt(i);
                i++;
                setTimeout(type, speed);
            }
        }
        type();
    }
});
