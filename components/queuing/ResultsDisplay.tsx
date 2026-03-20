'use client';

import { useState } from 'react';
import { QueuingResults } from '@/lib/queuing/types';
import { formatDisplay, formatNumber } from '@/lib/queuing/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

interface ResultsDisplayProps {
  results: QueuingResults;
  input: Record<string, number>;
}

export function ResultsDisplay({ results, input }: ResultsDisplayProps) {
  const [selectedMetric, setSelectedMetric] = useState<{ id: string, label: string, value: number } | null>(null);

  const getTimeConversionMarkdown = (val: number) => {
    if (val === 0 || !isFinite(val)) return '';
    
    const formatTime = (totalSeconds: number) => {
      const d = Math.floor(Math.abs(totalSeconds) / (3600 * 24));
      const h = Math.floor((Math.abs(totalSeconds) % (3600 * 24)) / 3600);
      const m = Math.floor((Math.abs(totalSeconds) % 3600) / 60);
      const s = Math.round(Math.abs(totalSeconds) % 60);
      
      const parts = [];
      if (d > 0) parts.push(`**${d}** días`);
      if (h > 0 || d > 0) parts.push(`**${h}** hrs`);
      if (m > 0 || h > 0 || d > 0) parts.push(`**${m}** min`);
      parts.push(`**${s}** seg`);
      
      return parts.join(', ');
    };

    return `
---

**Conversión de Tiempo:**

*Si la tasa ingresada es en **horas**:*
🕒 ${formatTime(val * 3600)}

*Si la tasa ingresada es en **minutos**:*
🕒 ${formatTime(val * 60)}`;
  };

  const getFormulaMarkdown = (id: string, label: string, value: number) => {
    const lam = input.lambda || '\\lambda';
    const mu = input.mu || '\\mu';
    const rhoStr = results.rho.toFixed(4);
    
    switch (id) {
      case 'rho':
        if (results.model === 'MMS') {
          return `**Fórmula (M/M/s):**\n\n$$ \\rho = \\frac{\\lambda}{s \\cdot \\mu} $$\n\n**Sustitución:**\n\n$$ \\rho = \\frac{${lam}}{${input.servers || 's'} \\cdot ${mu}} = ${value.toFixed(4)} $$`;
        }
        return `**Fórmula:**\n\n$$ \\rho = \\frac{\\lambda}{\\mu} $$\n\n**Sustitución:**\n\n$$ \\rho = \\frac{${lam}}{${mu}} = ${value.toFixed(4)} $$`;
      case 'p0':
        if (results.model === 'MM1') {
          return `**Fórmula (M/M/1):**\n\n$$ P_0 = 1 - \\rho $$\n\n**Sustitución:**\n\n$$ P_0 = 1 - ${rhoStr} = ${value.toFixed(4)} $$`;
        }
        if (results.model === 'MMS') {
          return `**Fórmula de Erlang B completa (M/M/s):**\n\n$$ P_0 = \\left[ \\sum_{n=0}^{s-1} \\frac{(s \\cdot \\rho)^n}{n!} + \\frac{(s \\cdot \\rho)^s}{s!(1 - \\rho)} \\right]^{-1} $$\n\n**Valor Calculado:**\n\n$$ P_0 = ${value.toFixed(4)} $$`;
        }
        return `**Fórmula paramétrica:**\n\nEl cálculo previene que el sistema crezca al infinito y depende de sumatorias de probabilidad según el modelo.\n\n**Valor Calculado:**\n\n$$ P_0 = ${value.toFixed(4)} $$`;
      case 'l':
        if (results.model === 'MM1') {
          return `**Fórmula (M/M/1):**\n\n$$ L = \\frac{\\rho}{1 - \\rho} = \\frac{\\lambda}{\\mu - \\lambda} $$\n\n**Sustitución:**\n\n$$ L = \\frac{${rhoStr}}{1 - ${rhoStr}} = ${value.toFixed(4)} $$`;
        }
        return `**Ley de Little:**\n\n$$ L = L_q + \\frac{\\lambda}{\\mu} $$\n\n**Sustitución:**\n\n$$ L = ${results.lq.toFixed(4)} + \\frac{${lam}}{${mu}} = ${value.toFixed(4)} $$`;
      case 'lq':
        if (results.model === 'MM1') {
          return `**Fórmula (M/M/1):**\n\n$$ L_q = \\frac{\\rho^2}{1 - \\rho} $$\n\n**Sustitución:**\n\n$$ L_q = \\frac{${rhoStr}^2}{1 - ${rhoStr}} = ${value.toFixed(4)} $$`;
        }
        if (results.model === 'MMS') {
          const pwStr = results.pw?.toFixed(4) || 'P_w';
          return `**Fórmula (M/M/s):**\n\n$$ L_q = P_w \\cdot \\frac{\\rho}{1 - \\rho} $$\n\n**Sustitución:**\n\n$$ L_q = ${pwStr} \\cdot \\frac{${rhoStr}}{1 - ${rhoStr}} = ${value.toFixed(4)} $$`;
        }
        return `**Ley de Little para tiempo en cola:**\n\n$$ L_q = \\lambda \\cdot W_q $$\n\n**Valor Calculado:**\n\n$$ L_q = ${value.toFixed(4)} $$`;
      case 'pw':
        if (results.model === 'MMS') {
          return `**Fórmula de Erlang C (M/M/s):**\n\n$$ P_w = P_0 \\cdot \\frac{(s \\cdot \\rho)^s}{s! (1 - \\rho)} $$\n\nEs la probabilidad de que un cliente tenga que esperar en la cola.\n\n**Valor Calculado:**\n\n$$ P_w = ${value.toFixed(4)} $$`;
        }
        return `**Probabilidad de Espera:**\n\n$$ P_w = ${value.toFixed(4)} $$`;
      case 'w':
        return `**Ley de Little:**\n\n$$ W = \\frac{L}{\\lambda} $$\n\nTambién expresable como:\n\n$$ W = W_q + \\frac{1}{\\mu} $$\n\n**Sustitución:**\n\n$$ W = \\frac{${results.l.toFixed(4)}}{${lam}} = ${value.toFixed(4)} $$\n\n---\n\n**Fórmula para conversión a minutos:**\n\nSi las tasas ($\\lambda$, $\\mu$) están en **horas**, multiplicamos el resultado por 60 para obtener los minutos equivalentes:\n\n$$ W_{(min)} = ${value.toFixed(4)} \\times 60 = ${(value * 60).toFixed(2)} \\text{ minutos} $$${getTimeConversionMarkdown(value)}`;
      case 'wq':
        return `**Ley de Little en Cola:**\n\n$$ W_q = \\frac{L_q}{\\lambda} $$\n\n**Sustitución:**\n\n$$ W_q = \\frac{${results.lq.toFixed(4)}}{${lam}} = ${value.toFixed(4)} $$\n\n---\n\n**Fórmula para conversión a minutos:**\n\nSi las tasas ($\\lambda$, $\\mu$) están en **horas**, multiplicamos por 60:\n\n$$ W_{q(min)} = ${value.toFixed(4)} \\times 60 = ${(value * 60).toFixed(2)} \\text{ minutos} $$${getTimeConversionMarkdown(value)}`;
      default:
        return `**Valor Calculado para ${label}:**\n\n$$ \\text{Valor} = ${value.toFixed(4)} $$`;
    }
  };

  // Preparar datos para gráfico de probabilidades
  const probabilityData = results.pn.slice(0, 15).map((p, idx) => ({
    n: idx,
    probability: formatNumber(p * 100, 2)
  }));

  // Preparar datos para gráfico de métricas
  const metricsData = [
    { name: 'Clientes en sistema (L)', value: results.l },
    { name: 'Clientes en cola (Lq)', value: results.lq },
    { name: 'Tiempo en sistema (W)', value: results.w },
    { name: 'Tiempo en cola (Wq)', value: results.wq }
  ];

  const getRecommendations = (): string[] => {
    const recommendations: string[] = [];

    if (results.rho >= 0.9) {
      recommendations.push('Sistema altamente saturado (ρ ≥ 0.9). Considere aumentar capacidad.');
    } else if (results.rho >= 0.75) {
      recommendations.push('Sistema congestionado (ρ ≥ 0.75). Monitor de cerca requerido.');
    } else if (results.rho < 0.5) {
      recommendations.push('Capacidad ociosa (ρ < 0.5). Considere reducir recursos.');
    } else {
      recommendations.push('Sistema en operación normal (0.5 ≤ ρ < 0.75).');
    }

    if (results.l > 10) {
      recommendations.push('Número alto de clientes en sistema. Investigar mejoras de eficiencia.');
    }

    if (results.blockingProbability && results.blockingProbability > 0.1) {
      recommendations.push(`${formatNumber(results.blockingProbability * 100, 2)}% de clientes rechazados. Aumentar capacidad.`);
    }

    return recommendations;
  };

  return (
    <div className="space-y-6">
      {/* Status */}
      {results.stability && (
        <Alert className={results.isStable ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
          <div className="flex items-center gap-3">
            {results.isStable ? (
              <CheckCircle className="h-5 w-5 text-green-700" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-700" />
            )}
            <div>
              <p className={`font-semibold ${results.isStable ? 'text-green-900' : 'text-red-900'}`}>
                {results.stability.message}
              </p>
              <p className={`text-sm ${results.isStable ? 'text-green-800' : 'text-red-800'}`}>
                {results.stability.condition}
              </p>
            </div>
          </div>
        </Alert>
      )}

      {/* Main Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Métricas Principales</CardTitle>
          <CardDescription>Resultados del análisis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              label="Utilización (ρ)"
              value={formatDisplay(results.rho, 4)}
              unit=""
              color="indigo"
              onClick={() => setSelectedMetric({ id: 'rho', label: 'Utilización (ρ)', value: results.rho })}
            />
            <MetricCard
              label="P₀"
              value={formatDisplay(results.p0, 4)}
              unit=""
              color="blue"
              onClick={() => setSelectedMetric({ id: 'p0', label: 'P₀', value: results.p0 })}
            />
            <MetricCard
              label="Clientes en Sistema (L)"
              value={formatDisplay(results.l, 4)}
              unit="clientes"
              color="purple"
              onClick={() => setSelectedMetric({ id: 'l', label: 'Clientes en Sistema (L)', value: results.l })}
            />
            <MetricCard
              label="Clientes en Cola (Lq)"
              value={formatDisplay(results.lq, 4)}
              unit="clientes"
              color="violet"
              onClick={() => setSelectedMetric({ id: 'lq', label: 'Clientes en Cola (Lq)', value: results.lq })}
            />
            <MetricCard
              label="Tiempo en Sistema (W)"
              value={formatDisplay(results.w, 4)}
              unit="unidades"
              color="orange"
              onClick={() => setSelectedMetric({ id: 'w', label: 'Tiempo en Sistema (W)', value: results.w })}
            />
            <MetricCard
              label="Tiempo en Cola (Wq)"
              value={formatDisplay(results.wq, 4)}
              unit="unidades"
              color="amber"
              onClick={() => setSelectedMetric({ id: 'wq', label: 'Tiempo en Cola (Wq)', value: results.wq })}
            />
            {results.pw !== undefined && (
              <MetricCard
                label="Prob. Espera (Pw)"
                value={formatDisplay(results.pw, 4)}
                unit=""
                color="rose"
                onClick={() => setSelectedMetric({ id: 'pw', label: 'Prob. Espera (Pw)', value: results.pw! })}
              />
            )}
            {results.blockingProbability !== undefined && (
              <MetricCard
                label="Prob. Bloqueo"
                value={formatDisplay(results.blockingProbability, 4)}
                unit=""
                color="red"
                onClick={() => setSelectedMetric({ id: 'pb', label: 'Prob. Bloqueo', value: results.blockingProbability! })}
              />
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedMetric} onOpenChange={(open) => !open && setSelectedMetric(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedMetric?.label}</DialogTitle>
            <DialogDescription>
              Paso a paso y fórmula utilizada
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 prose prose-indigo max-w-none">
            {selectedMetric && (
              <ReactMarkdown
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  p({ children }) {
                    return <p className="mb-4 last:mb-0 leading-relaxed text-gray-700">{children}</p>;
                  },
                  strong({ children }) {
                    return <strong className="font-semibold text-gray-900">{children}</strong>;
                  }
                }}
              >
                {getFormulaMarkdown(selectedMetric.id, selectedMetric.label, selectedMetric.value)}
              </ReactMarkdown>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Distribution Chart */}
      {probabilityData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Distribución de Probabilidades</CardTitle>
            <CardDescription>Probabilidad de n clientes en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={probabilityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="n" label={{ value: 'Número de clientes (n)', position: 'insideBottomRight', offset: -10 }} />
                <YAxis label={{ value: 'Probabilidad (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  formatter={(value: number) => `${value.toFixed(2)}%`}
                  contentStyle={{ backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb' }}
                />
                <Bar dataKey="probability" fill="#4f46e5" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      {getRecommendations().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recomendaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {getRecommendations().map((rec, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="text-indigo-600 font-bold mt-1">•</span>
                  <span className="text-gray-700">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Raw Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Datos Completos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-2 px-3 font-semibold">Variable</th>
                  <th className="text-right py-2 px-3 font-semibold">Valor</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Modelo', results.model],
                  ['Utilización (ρ)', formatDisplay(results.rho, 4)],
                  ['P₀', formatDisplay(results.p0, 4)],
                  ['L', formatDisplay(results.l, 4)],
                  ['Lq', formatDisplay(results.lq, 4)],
                  ['W', formatDisplay(results.w, 4)],
                  ['Wq', formatDisplay(results.wq, 4)],
                  ...(results.pw !== undefined ? [['Pw', formatDisplay(results.pw as number, 4)]] : []),
                  ...(results.effectiveLambda !== undefined ? [['λₑ', formatDisplay(results.effectiveLambda as number, 4)]] : []),
                  ...(results.blockingProbability !== undefined ? [['Prob. Bloqueo', formatDisplay(results.blockingProbability as number, 4)]] : []),
                  ...(results.cost !== undefined ? [['Costo Total', formatDisplay(results.cost as number, 2)]] : [])
                ].map(([label, value]) => (
                  <tr key={label} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3 text-gray-700 font-medium">{label}</td>
                    <td className="py-2 px-3 text-right text-gray-900 font-mono">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  unit: string;
  color: string;
  onClick?: () => void;
}

function MetricCard({ label, value, unit, color, onClick }: MetricCardProps) {
  const colorClasses: Record<string, string> = {
    indigo: 'from-indigo-50 to-indigo-100 border-indigo-200 hover:border-indigo-300',
    blue: 'from-blue-50 to-blue-100 border-blue-200 hover:border-blue-300',
    purple: 'from-purple-50 to-purple-100 border-purple-200 hover:border-purple-300',
    violet: 'from-violet-50 to-violet-100 border-violet-200 hover:border-violet-300',
    orange: 'from-orange-50 to-orange-100 border-orange-200 hover:border-orange-300',
    amber: 'from-amber-50 to-amber-100 border-amber-200 hover:border-amber-300',
    rose: 'from-rose-50 to-rose-100 border-rose-200 hover:border-rose-300',
    red: 'from-red-50 to-red-100 border-red-200 hover:border-red-300'
  };

  const textColorClasses: Record<string, string> = {
    indigo: 'text-indigo-900',
    blue: 'text-blue-900',
    purple: 'text-purple-900',
    violet: 'text-violet-900',
    orange: 'text-orange-900',
    amber: 'text-amber-900',
    rose: 'text-rose-900',
    red: 'text-red-900'
  };

  return (
    <div 
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`bg-gradient-to-br ${colorClasses[color] || colorClasses.indigo} border rounded-lg p-4 ${onClick ? 'cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5' : ''}`}
    >
      <p className="text-xs font-semibold text-gray-700 mb-2">{label}</p>
      <p className={`text-2xl font-bold ${textColorClasses[color] || textColorClasses.indigo}`}>
        {value}
      </p>
      {unit && <p className="text-xs text-gray-600 mt-1">{unit}</p>}
    </div>
  );
}
