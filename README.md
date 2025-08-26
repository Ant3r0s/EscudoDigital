______  _____  _   _  _____  ____   _      ____    ____  _   _  _____  ____    _    _   _
 |  ____|| ____|| | | || ____||  _ \ | |    / __ \  / __ \| | | || ____||  _ \  | |  | | | |
 | |__   | |__  | | | || |__  | | | || |   | |  | || |  | | | | || |__  | | | |_| |  | | | |
 |  __|  | __|  | | | || __|  | | | || |   | |  | || |  | | | | || __|  | | | | | |  | | | |
 | |     | |____| |_| || |____| |_| || |____| |__| || |__| | |_| || |____| |_| |_| |__| |_|
 |_|     |______|\___/ |______||____/ |______|\____/  \____/ \___/ |______||____/(_)(_)|___|

                  >> A CLIENT-SIDE NEURAL INTERFACE FOR ADVANCED THREAT ANALYSIS <<
                                    [VERSION 1.0 - OFFLINE KERNEL]


## // DIRECTIVA PRINCIPAL

**ESCUDO DIGITAL** es un motor de análisis de amenazas autónomo, diseñado para operar en el `edge` (el navegador del cliente). Funciona bajo un protocolo de confianza cero (`zero-trust`), procesando todos los datos de forma local sin transmitir información sensible a servidores externos. Su propósito es la identificación y neutralización de vectores de ataque basados en ingeniería social (phishing, estafas, etc.).

## // CAPACIDADES DEL KERNEL

* **ANÁLISIS DE VECTORES DE AMENAZA ZERO-SHOT:** El núcleo de IA no depende de una base de datos de firmas de virus. Utiliza un modelo de clasificación `zero-shot` para analizar la intención semántica de cualquier texto y clasificarlo en tiempo real contra un conjunto de vectores de amenaza conocidos (`phishing`, `falsa urgencia`, `estafa`, `spam`, `legítimo`).

* **EXTRACCIÓN DE PAYLOADS (NER):** El sistema escanea el texto en busca de "payloads" (cargas útiles) y los aísla para su inspección. Utiliza `Named Entity Recognition` para identificar y resaltar URLs, direcciones de email, números de teléfono y otras entidades potencialmente maliciosas.

## // PROTOCOLO DE USO

1.  **INPUT STREAM:** Inserte el flujo de datos de texto sospechoso en la terminal de análisis.
2.  **EXECUTE ANALYSIS:** Active el botón `[ ANALIZAR AMENAZA ]`.
3.  **RECEIVE OUTPUT:** El sistema devolverá un veredicto codificado por colores, un análisis de intención y los `payloads` extraídos del flujo de datos.

## // TECH STACK

* **NEURAL ENGINE:** `Transformers.js` (Xenova Port)
* **PIPELINES:** `zero-shot-text-classification`, `token-classification` (NER)
* **INTERFACE:** `HTML5`, `CSS3`, `JavaScript (ESM)`

---
// STATUS: ONLINE. AWAITING INPUT.
