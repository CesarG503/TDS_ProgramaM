'use client';

import { useState } from 'react';
import { QueuingModel, QueuingInput, MM1Input, MMSInput, MG1Input, MM1KInput, CostInput } from '@/lib/queuing/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface InputFormProps {
  model: QueuingModel;
  onSubmit: (input: QueuingInput) => Promise<void>;
  isLoading?: boolean;
}

export function InputForm({ model, onSubmit, isLoading = false }: InputFormProps) {
  const [formData, setFormData] = useState<Record<string, number>>({
    lambda: 5,
    mu: 8,
    servers: 2,
    capacity: 10,
    variance: 1,
    costPerServer: 100,
    costPerWaitingCustomer: 50
  });

  const [error, setError] = useState<string>('');
  const [warning, setWarning] = useState<string>('');

  const handleChange = (field: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData(prev => ({ ...prev, [field]: numValue }));
    setError('');
    setWarning('');

    // Validar estabilidad
    if (field === 'lambda' || field === 'mu' || field === 'servers') {
      const lambda = field === 'lambda' ? numValue : formData.lambda;
      const mu = field === 'mu' ? numValue : formData.mu;
      const servers = field === 'servers' ? numValue : formData.servers;

      if (lambda > 0 && mu > 0) {
        if (model === 'MM1' && lambda >= mu) {
          setWarning('Sistema inestable: λ debe ser < μ');
        } else if ((model === 'MMS' || model === 'PRIORITY') && servers > 0 && lambda >= servers * mu) {
          setWarning(`Sistema inestable: λ debe ser < ${servers} × μ`);
        }
      }
    }
  };

  const getFormFields = () => {
    const fields: Array<{ name: string; label: string; description?: string }> = [
      { name: 'lambda', label: 'λ (Tasa de llegada)', description: 'clientes por unidad de tiempo' },
      { name: 'mu', label: 'μ (Tasa de servicio)', description: 'clientes por unidad de tiempo' }
    ];

    switch (model) {
      case 'MMS':
        fields.push({ name: 'servers', label: 's (Número de servidores)' });
        break;
      case 'MG1':
        fields.push({ name: 'variance', label: 'σ² (Varianza del servicio)' });
        break;
      case 'MM1K':
        fields.push({ name: 'capacity', label: 'K (Capacidad máxima)' });
        break;
      case 'COST':
        fields.push({ name: 'servers', label: 's (Número de servidores)' });
        fields.push({ 
          name: 'costPerServer', 
          label: 'Costo por servidor',
          description: 'costo por unidad de tiempo'
        });
        fields.push({
          name: 'costPerWaitingCustomer',
          label: 'Costo de espera',
          description: 'costo por cliente esperando'
        });
        break;
    }

    return fields;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar entrada básica
    if (formData.lambda <= 0 || formData.mu <= 0) {
      setError('λ y μ deben ser positivos');
      return;
    }

    try {
      const input = buildInput();
      await onSubmit(input);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en el cálculo');
    }
  };

  const buildInput = (): QueuingInput => {
    const base = { lambda: formData.lambda, mu: formData.mu };

    switch (model) {
      case 'MM1':
        return base as MM1Input;
      case 'MMS':
        return { ...base, servers: Math.round(formData.servers) } as MMSInput;
      case 'MG1':
        return { ...base, variance: formData.variance } as MG1Input;
      case 'MM1K':
        return { ...base, capacity: Math.round(formData.capacity) } as MM1KInput;
      case 'COST':
        return {
          ...base,
          servers: Math.round(formData.servers),
          costPerServer: formData.costPerServer,
          costPerWaitingCustomer: formData.costPerWaitingCustomer
        } as CostInput;
      case 'PRIORITY':
      default:
        return base;
    }
  };

  const fields = getFormFields();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Parámetros del Sistema</CardTitle>
        <CardDescription>Ingresa los valores para tu modelo</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {warning && (
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertCircle className="h-4 w-4 text-yellow-700" />
              <AlertDescription className="text-yellow-800">{warning}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map(field => (
              <Field key={field.name}>
                <FieldLabel>{field.label}</FieldLabel>
                <Input
                  type="number"
                  step={field.name === 'servers' || field.name === 'capacity' ? '1' : '0.01'}
                  min="0"
                  value={formData[field.name]}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className="mt-1"
                />
                {field.description && (
                  <p className="text-xs text-gray-500 mt-1">{field.description}</p>
                )}
              </Field>
            ))}
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? 'Calculando...' : 'Calcular Resultados'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
