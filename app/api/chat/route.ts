import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

const apiKey = process.env.OPENAI_API_KEY;

// Inicializar OpenAI
const openai = new OpenAI({
  apiKey: apiKey || '',
});

export async function POST(req: Request) {
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Falta la API Key. Por favor, verifica el archivo .env.local' }, 
      { status: 400 }
    );
  }

  try {
    const { message, history } = await req.json();

    // Formatear el historial para OpenAI (role: 'system'|'user'|'assistant', content: string)
    const formattedHistory = (history || []).map((msg: any) => ({
      role: msg.role === 'model' || msg.role === 'assistant' ? 'assistant' : 'user',
      content: String(msg.text),
    }));

    // El modelo gpt-4o-mini es por mucho el mejor en relación calidad-precio.
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Eres el asistente IA del simulador de colas. Responde de manera clara y útil. IMPORTANTE: Cuando escribas fórmulas matemáticas, usa SIEMPRE delimitadores de LaTeX: \\( ... \\) para matemáticas en línea y \\[ ... \\] para matemáticas en bloque. Asegúrate de balancear correctamente \\left y \\right en tus fracciones y sumatorias.' },
        ...formattedHistory,
        { role: 'user', content: message }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const responseText = response.choices[0]?.message?.content || 'Sin respuesta.';

    return NextResponse.json({ text: responseText });
  } catch (error: any) {
    console.error('Error en ruta de chat de OpenAI:', error);
    return NextResponse.json(
      { error: error?.message || 'Error al comunicarse con la IA.' }, 
      { status: 500 }
    );
  }
}
