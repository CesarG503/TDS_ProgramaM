'use client';

import { QueuingModel } from '@/lib/queuing/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ModelSelectorProps {
  selectedModel: QueuingModel;
  onModelSelect: (model: QueuingModel) => void;
}

const MODELS = [
  {
    id: 'MM1' as QueuingModel,
    name: 'M/M/1',
    description: 'Un servidor',
    details: 'Llegadas Poisson, servicio exponencial, un servidor'
  },
  {
    id: 'MMS' as QueuingModel,
    name: 'M/M/s',
    description: 'Múltiples servidores',
    details: 'Llegadas Poisson, servicio exponencial, s servidores'
  },
  {
    id: 'MG1' as QueuingModel,
    name: 'M/G/1',
    description: 'Servicio general',
    details: 'Llegadas Poisson, servicio con distribución general'
  },
  {
    id: 'MM1K' as QueuingModel,
    name: 'M/M/1/K',
    description: 'Capacidad finita',
    details: 'Un servidor, capacidad máxima limitada'
  },
  {
    id: 'PRIORITY' as QueuingModel,
    name: 'Con Prioridades',
    description: 'Múltiples clases',
    details: 'Sistema con diferentes niveles de prioridad'
  },
  {
    id: 'COST' as QueuingModel,
    name: 'Análisis de Costos',
    description: 'Optimización',
    details: 'Encuentra el número óptimo de servidores'
  }
];

export function ModelSelector({ selectedModel, onModelSelect }: ModelSelectorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Selecciona un Modelo</h2>
        <p className="text-gray-600">
          Elige el modelo de colas que se ajuste a tu problema
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {MODELS.map((model) => (
          <Button
            key={model.id}
            onClick={() => onModelSelect(model.id)}
            variant={selectedModel === model.id ? 'default' : 'outline'}
            className={`h-auto p-4 flex flex-col items-start justify-start text-left transition-all ${
              selectedModel === model.id
                ? 'ring-2 ring-indigo-500 bg-indigo-50 border-indigo-300'
                : 'hover:border-indigo-300 hover:bg-indigo-50'
            }`}
          >
            <div className="font-bold text-lg text-indigo-700 mb-1">{model.name}</div>
            <div className="text-sm font-medium text-gray-700 mb-2">{model.description}</div>
            <div className="text-xs text-gray-600">{model.details}</div>
          </Button>
        ))}
      </div>
    </div>
  );
}
