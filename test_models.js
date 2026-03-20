const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.GEMINI_API_KEY;
console.log('API Key cargada:', apiKey ? 'Sí (Oculta por seguridad)' : 'NO');

async function test() {
  if (!apiKey) return console.log('No hay API key en .env.local');
  
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await res.json();
    if (data.models) {
      console.log('Modelos disponibles:', data.models.map(m => m.name).filter(n => n.includes('gemini')));
    } else {
      console.log('Error al listar modelos:', data);
    }
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

test();
