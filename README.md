# 🛡️ Escudo Digital v3.2

// CLIENT-SIDE HYBRID KERNEL FOR ADVANCED THREAT ANALYSIS //

---

## // Directiva Principal

**Escudo Digital** es una herramienta de ciberseguridad y educación diseñada para operar enteramente en el navegador del usuario. Utiliza un avanzado **motor híbrido de IA** para analizar textos (emails, SMS, mensajes) en busca de posibles estafas, phishing y otros vectores de ataque basados en ingeniería social.

Su principal ventaja es la **privacidad total**: ningún dato analizado abandona jamás el ordenador del usuario, ya que todo el procesamiento se realiza de forma local.

## // Capacidades del Kernel

* **Motor Híbrido de Análisis:** La herramienta combina dos motores para una máxima precisión:
    1.  **IA Semántica (`zero-shot`):** Un modelo de lenguaje avanzado (`bart-large-mnli`) que entiende el contexto y la intención general del mensaje.
    2.  **Motor Heurístico (de Reglas):** Un sistema de puntuación basado en una lista curada de palabras y patrones clave de alto riesgo, aportando la "experiencia de la calle" que a una IA generalista le podría faltar.

* **Amplio Espectro de Amenazas:** El Kernel está preparado para identificar un rango extendido de amenazas modernas, incluyendo:
    * Phishing
    * Estafas de Soporte Técnico
    * Sextorsión
    * Notificaciones de Entrega Falsas
    * Ofertas Engañosas
    * Fraude de Caridad
    * Spam y Falsa Urgencia

* **Protocolo de Defensa Activa:** Por cada amenaza detectada, el sistema no solo emite una alerta, sino que también proporciona:
    * Una **explicación clara** de en qué consiste el timo.
    * Una **lista de consejos prácticos** sobre cómo actuar y protegerse.

* **Extracción de Payloads (NER):** Utiliza Reconocimiento de Entidades Nombradas para identificar y resaltar automáticamente "payloads" peligrosos o de interés, como URLs, nombres de personas u organizaciones.

* **Historial de Análisis Local:** Todos los análisis se guardan en el `localStorage` del navegador, permitiendo al usuario revisar casos pasados con total privacidad. Las entradas del historial se pueden eliminar individualmente.

## // Protocolo de Uso

1.  **Input:** Pegue el texto sospechoso en el área de análisis.
2.  **Execute:** Active el botón `[ ANALYZE THREAT ]`.
3.  **Output:** Reciba un veredicto instantáneo codificado por colores, una explicación de la amenaza, un protocolo de defensa y los payloads extraídos.

## // Tech Stack

* **Motor de IA:** `Transformers.js` (Xenova Port)
* **Modelos:**
    * `Xenova/bart-large-mnli` (Zero-Shot Classification)
    * `Xenova/bert-base-multilingual-cased-ner-hrl` (Token Classification / NER)
* **Interfaz:** `HTML5`, `CSS3` (Glassmorphism), `JavaScript (ESM)`
* **Fondo:** `HTML Canvas` para animación generativa.

---
// STATUS: KERNEL v3.2 STABLE. READY FOR DEPLOYMENT.
