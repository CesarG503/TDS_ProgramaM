'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, Bot, User, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

type Message = {
  role: 'user' | 'assistant';
  text: string;
};

// Función para asegurar que el modelo renderice bien la matemática 
// cambiando formatos comunes de LaTeX por los que remark-math entiende ($ y $$).
const preprocessMath = (text: string) => {
  if (!text) return text;
  return text
    .replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$') // Replace \[ \] with $$ $$
    .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$')     // Replace \( \) with $ $
    // Fix común donde la IA separa el exponente del bloque matemático
    .replace(/\\right\s*\$\$\s*\^\{?(-1)\}?\s*\$\$/g, '\\right]^{-1} $$')
    // Fix común donde la IA confundió el prompt anterior y usó \left$
    .replace(/\\left\$/g, '\\left[')
    .replace(/\\right\$/g, '\\right]')
    .replace(/\[\s*([\s\S]*?)\s*\]/g, (match, p1) => {
      // Si el texto dentro de [ ] contiene un símbolo matemático común como \rho, \frac, =, etc., lo tratamos como bloque matemático
      if (p1.includes('\\') || p1.includes('=')) {
        return `\n$$ ${p1} $$\n`;
      }
      return match;
    })
    .replace(/\(\s*([\s\S]*?)\s*\)/g, (match, p1) => {
      // Si el texto dentro de ( ) contiene matemáticas puras como \lambda = 6, \rho, etc.
      if (p1.includes('\\') && (p1.includes('=') || p1.includes('approx'))) {
        return `$ ${p1} $`;
      }
      return match;
    });
};

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: '¡Hola! Soy el asistente con IA de este simulador. ¿En qué te puedo ayudar hoy?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Usamos ref en el contenedor de mensajes para scrollear hacia abajo automáticamente
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setError('');
    
    const newMessages: Message[] = [...messages, { role: 'user', text: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Formatear respuestas anteriores en formato history
      const history = messages.slice(1).map(m => ({ 
        role: m.role === 'assistant' ? 'model' : 'user', 
        text: m.text 
      }));

      // Llamar a nuestro backend local en lugar de la web externa
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, history })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Algo salió mal. Verifica tu API Key.');
      }

      setMessages([...newMessages, { role: 'assistant', text: data.text }]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-white rounded-lg overflow-hidden border border-gray-200">
      {/* Zona de Mensajes */}
      <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-green-100 text-green-600'}`}>
                {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
              }`}>
                {/* Renderizamos el mensaje con ReactMarkdown para soportar LaTeX y estilos */}
                <div className="prose prose-sm max-w-none dark:prose-invert [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 flex flex-col gap-2">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                    components={{
                      p({ children }) {
                        return <p className={`mb-2 last:mb-0 leading-relaxed ${msg.role === 'user' ? 'text-white' : 'text-gray-700'}`}>{children}</p>;
                      },
                      h1({ children }) {
                        return <h1 className={`text-xl font-bold mt-4 mb-2 border-b pb-1 ${msg.role === 'user' ? 'text-white border-white/20' : 'text-indigo-900 border-gray-200'}`}>{children}</h1>;
                      },
                      h2({ children }) {
                        return <h2 className={`text-lg font-bold mt-4 mb-2 ${msg.role === 'user' ? 'text-white' : 'text-indigo-800'}`}>{children}</h2>;
                      },
                      h3({ children }) {
                        return <h3 className={`text-base font-bold mt-3 mb-2 ${msg.role === 'user' ? 'text-white' : 'text-indigo-700'}`}>{children}</h3>;
                      },
                      h4({ children }) {
                        return <h4 className={`text-sm font-bold mt-3 mb-2 ${msg.role === 'user' ? 'text-white' : 'text-indigo-700'}`}>{children}</h4>;
                      },
                      strong({ children }) {
                        return <strong className={`font-semibold ${msg.role === 'user' ? 'text-white' : 'text-gray-900'}`}>{children}</strong>;
                      },
                      ul({ children }) {
                        return <ul className={`list-disc pl-5 mb-3 space-y-1 ${msg.role === 'user' ? 'text-white' : 'text-gray-700'}`}>{children}</ul>;
                      },
                      ol({ children }) {
                        return <ol className={`list-decimal pl-5 mb-3 space-y-1 ${msg.role === 'user' ? 'text-white' : 'text-gray-700'}`}>{children}</ol>;
                      },
                      li({ children }) {
                        return <li className="leading-relaxed">{children}</li>;
                      }
                    }}
                  >
                    {preprocessMath(msg.text)}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 shadow-sm border border-green-200">
                <Bot size={18} />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl p-3 rounded-tl-none flex items-center gap-2 shadow-sm">
                <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                <span className="text-sm text-gray-500">Escribiendo...</span>
              </div>
            </div>
          )}
          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>

      {/* Zona del Input */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input 
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Haz una pregunta al asistente (ej: qué es lambda)..."
            disabled={isLoading}
            className="flex-1 bg-white"
          />
          <Button type="submit" disabled={isLoading || !input.trim()} size="icon" className="bg-indigo-600 hover:bg-indigo-700">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
