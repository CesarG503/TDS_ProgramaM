'use client';

import { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { VARIABLE_DEFINITIONS } from '@/lib/queuing/utils';

interface VariableExplainerProps {
  selectedModel?: string;
  currentValues?: Record<string, number | string>;
}

export function VariableExplainer({ selectedModel = 'MM1', currentValues = {} }: VariableExplainerProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>(['rho', 'p0']);

  const getRelevantVariables = () => {
    const baseVariables = ['lambda', 'mu', 'rho', 'p0', 'l', 'lq', 'w', 'wq'];

    switch (selectedModel) {
      case 'MMS':
        return [...baseVariables, 'servers'];
      case 'MG1':
        return [...baseVariables, 'variance'];
      case 'MM1K':
        return [...baseVariables, 'capacity'];
      case 'PRIORITY':
        return [...baseVariables, 'servers'];
      case 'COST':
        return [...baseVariables, 'servers'];
      default:
        return baseVariables;
    }
  };

  const relevantVariables = getRelevantVariables();
  const variables = (Object.entries(VARIABLE_DEFINITIONS) as Array<
    [string, typeof VARIABLE_DEFINITIONS[keyof typeof VARIABLE_DEFINITIONS]]
  >).filter(([key]) => relevantVariables.includes(key));

  const getModelDescription = () => {
    const descriptions: Record<string, string> = {
      MM1: 'Sistema con un servidor, llegadas Poisson, servicio exponencial',
      MMS: 'Sistema con múltiples servidores, llegadas Poisson, servicio exponencial',
      MG1: 'Un servidor, llegadas Poisson, servicio con distribución general',
      MM1K: 'Un servidor con capacidad limitada, llegadas Poisson rechazadas si está lleno',
      PRIORITY: 'Sistema con múltiples clases de prioridad',
      COST: 'Análisis de costos para encontrar número óptimo de servidores'
    };
    return descriptions[selectedModel] || '';
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-indigo-200">
      <CardHeader>
        <CardTitle className="text-indigo-900">Explicación de Variables</CardTitle>
        <CardDescription>{getModelDescription()}</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion
          type="multiple"
          value={expandedItems}
          onValueChange={setExpandedItems}
          className="w-full"
        >
          {variables.map(([key, variable]) => (
            <AccordionItem key={key} value={key}>
              <AccordionTrigger className="hover:bg-indigo-100 rounded-lg px-3">
                <div className="flex items-center gap-3 text-left">
                  <span className="text-xl font-semibold text-indigo-700 min-w-12">
                    {variable.symbol}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">{variable.name}</p>
                    <p className="text-sm text-gray-600">{variable.unit}</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="bg-white rounded-lg p-4 mt-2">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">Definición:</p>
                    <p className="text-sm text-gray-600">{variable.description}</p>
                  </div>

                  {currentValues[key] !== undefined && (
                    <div className="bg-indigo-50 rounded p-3 border border-indigo-200">
                      <p className="text-sm font-semibold text-indigo-900">Valor actual:</p>
                      <p className="text-lg font-bold text-indigo-700">
                        {currentValues[key]}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">Rango típico:</p>
                    <p className="text-sm text-gray-600">{variable.typicalRange}</p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">Interpretación:</p>
                    <p className="text-sm text-gray-600">{variable.interpretation}</p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-900">
            <strong>Consejo:</strong> Los sistemas son más eficientes cuando ρ está entre 0.5 y 0.8. Valores
            superiores a 0.9 indican saturación.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
