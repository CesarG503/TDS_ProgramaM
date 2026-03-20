'use client';

import { useState, useEffect } from 'react';
import { QueuingModel, QueuingInput, QueuingResults } from '@/lib/queuing/types';
import { ModelSelector } from '@/components/queuing/ModelSelector';
import { InputForm } from '@/components/queuing/InputForm';
import { ResultsDisplay } from '@/components/queuing/ResultsDisplay';
import { VariableExplainer } from '@/components/queuing/VariableExplainer';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { AIChat } from '@/components/AIChat';

export default function QueuingCalculator() {
  const [selectedModel, setSelectedModel] = useState<QueuingModel>('MM1');
  const [results, setResults] = useState<QueuingResults | null>(null);
  const [currentInput, setCurrentInput] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow Shift + c or Shift + C
      if (e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        setIsChatOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleModelSelect = (model: QueuingModel) => {
    setSelectedModel(model);
    setResults(null);
    setError('');
  };

  const handleCalculate = async (input: QueuingInput) => {
    setIsLoading(true);
    setError('');

    try {
      // Convertir input a objeto para mostrar en explainer
      const inputObj = input as Record<string, number>;
      setCurrentInput(inputObj);

      const response = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          input
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error en el cálculo');
      }

      setResults(data.results);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMsg);
      console.error('[v0] Calculation error:', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Selector de Modelo */}
      <section className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <ModelSelector 
          selectedModel={selectedModel} 
          onModelSelect={handleModelSelect}
        />
      </section>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Input and Results */}
        <div className="lg:col-span-2 space-y-6">
          {/* Input Form */}
          <InputForm
            model={selectedModel}
            onSubmit={handleCalculate}
            isLoading={isLoading}
          />

          {/* Results */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {results && !error && (
            <div className="animate-in fade-in duration-300">
              <ResultsDisplay 
                results={results}
                input={currentInput}
              />
            </div>
          )}

          {!results && !error && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-8 border border-indigo-200 text-center">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-indigo-900">
                  Ingresa los parámetros y calcula
                </h3>
                <p className="text-sm text-gray-600">
                  Completa el formulario con tus valores y presiona "Calcular Resultados" para ver el análisis
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Variable Explainer */}
        <aside>
          <div className="sticky top-24">
            <VariableExplainer
              selectedModel={selectedModel}
              currentValues={results ? {
                lambda: currentInput.lambda,
                mu: currentInput.mu,
                rho: results.rho,
                p0: results.p0,
                l: results.l,
                lq: results.lq,
                w: results.w,
                wq: results.wq
              } : undefined}
            />
          </div>
        </aside>
      </div>

      {/* Footer Tips */}
      <section className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-6 border border-amber-200">
        <h3 className="font-semibold text-amber-900 mb-3">Consejos para usar la calculadora</h3>
        <ul className="space-y-2 text-sm text-amber-800">
          <li>
            <strong>Unidades consistentes:</strong> Asegúrate que λ y μ usen las mismas unidades de tiempo
          </li>
          <li>
            <strong>Estabilidad:</strong> Para M/M/1: λ debe ser menor que μ. Para M/M/s: λ debe ser menor que s×μ
          </li>
          <li>
            <strong>Interpretación:</strong> Usa el panel derecho para entender qué significa cada variable
          </li>
          <li>
            <strong>Casos especiales:</strong> M/M/1/K es útil para sistemas con capacidad limitada
          </li>
        </ul>
      </section>

      {/* Asistente IA Section */}
      <section className={`bg-white rounded-lg shadow-sm p-4 border border-gray-200 mt-8 mb-8 flex flex-col ${isChatOpen ? 'block' : 'hidden'}`}>
        <div className="flex-1 w-full bg-gray-50 rounded-lg overflow-hidden shadow-inner h-[600px]">
          <AIChat />
        </div>
      </section>
    </div>
  );
}
