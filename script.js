// La importación y configuración de la IA se hace aquí, al principio de todo.
import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1';
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
        'phishing': ['NUNCA hagas clic en enlaces de correos o SMS de este tipo.','Verifica la dirección del remitente. A menudo contiene errores sutiles.','Accede siempre a tu cuenta escribiendo la URL oficial en el navegador, no desde el enlace.','Ninguna entidad seria te pedirá tu contraseña o datos completos por correo.'],
        'estafa de soporte técnico': ['Cuelga el teléfono o cierra el chat. Microsoft/Apple NUNCA te contactarán de esta forma.','No instales ningún software que te pidan (AnyDesk, TeamViewer).','Nunca les des el control de tu ordenador.'],
        'oferta engañosa': ['Desconfía de ofertas que no has solicitado y que prometen mucho por poco esfuerzo.','Nunca pagues por adelantado para un trabajo o para recibir un premio.','Investiga a la empresa o persona que te contacta. Busca opiniones en Google.'],
        'sextorsión': ['NO PAGUES. Pagar no garantiza que borren nada y te pedirán más dinero.','Denuncia el caso a la policía y guarda todas las pruebas.','Bloquea al remitente y no respondas a sus mensajes.'],
        'notificación de entrega falsa': ['No pagues ninguna tasa aduanera desde un enlace de SMS/email.','Copia el número de seguimiento y búscalo en la web OFICIAL de la empresa de paquetería.','Elimina el mensaje. Es un intento de robar los datos de tu tarjeta.'],
        'estafa': ['Si suena demasiado bueno para ser verdad,
