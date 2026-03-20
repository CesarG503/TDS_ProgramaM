// Modelo M/G/1: Una servidor, llegadas exponenciales, servicio general (cualquier distribución)

import { MG1Input, QueuingResults } from '@/lib/queuing/types';
import { isValidRate, formatNumber, checkMM1Stability } from '@/lib/queuing/utils';

export function calculateMG1(input: MG1Input): QueuingResults {
  const { lambda, mu, variance } = input;

  // Validar entrada
  if (!isValidRate(lambda) || !isValidRate(mu) || variance < 0) {
    throw new Error('λ, μ deben ser positivos y varianza ≥ 0');
  }

  // Verificar estabilidad (ρ = λ/μ < 1)
  const stability = checkMM1Stability(lambda, mu);
  // Eliminado el 'throw new Error' para permitir el cálculo incluso si es inestable

  // Cálculos principales
  const rho = formatNumber(lambda / mu);
  const p0 = formatNumber(1 - rho);

  // Coeficiente de variación: Cs² = σ²/μ²
  const cs2 = formatNumber(variance / Math.pow(mu, 2));

  // Fórmula de Pollaczek-Khinchine para Lq
  // Lq = (λ² × σ² + ρ²) / (2 × (1 - ρ))
  const numerator = Math.pow(lambda, 2) * variance + Math.pow(rho, 2);
  const lq = formatNumber(numerator / (2 * (1 - rho)));

  // Tiempo promedio en la cola: Wq = Lq / λ
  const wq = formatNumber(lq / lambda);

  // Número promedio en el sistema: L = Lq + ρ
  const l = formatNumber(lq + rho);

  // Tiempo promedio en el sistema: W = L / λ = Wq + 1/μ
  const w = formatNumber(l / lambda);

  // Para M/G/1, P₀ es simplemente 1 - ρ
  // Las otras probabilidades Pn son más complejas, así que generamos un array simplificado
  const pn = [p0];
  for (let n = 1; n < 15; n++) {
    // Aproximación: disminución exponencial
    const pn_value = formatNumber(p0 * Math.pow(rho, n) * Math.exp(-lambda * (1 / mu)));
    pn.push(pn_value);
  }

  return {
    model: 'MG1',
    rho,
    p0,
    pn,
    l,
    lq,
    w,
    wq,
    isStable: stability.isMet,
    stability
  };
}

/**
 * Calcula el impacto de la variabilidad en el sistema
 * Compara con M/M/1 (exponencial) para mostrar la diferencia
 */
export function compareWithMM1(
  lambda: number,
  mu: number,
  variance: number
): {
  mg1: QueuingResults;
  mm1: QueuingResults;
  variabilityImpact: {
    lqDifference: number;
    wqDifference: number;
    percentageIncrease: number;
  };
} {
  // Calcular M/G/1
  const mg1 = calculateMG1({ lambda, mu, variance });

  // Para M/M/1, la varianza es 1/μ²
  const mm1Variance = 1 / Math.pow(mu, 2);
  const mm1 = calculateMG1({ lambda, mu, variance: mm1Variance });

  const lqDifference = formatNumber(mg1.lq - mm1.lq);
  const wqDifference = formatNumber(mg1.wq - mm1.wq);
  const percentageIncrease = formatNumber((lqDifference / mm1.lq) * 100);

  return {
    mg1,
    mm1,
    variabilityImpact: {
      lqDifference,
      wqDifference,
      percentageIncrease
    }
  };
}

/**
 * Análisis del efecto de la varianza en la cola
 */
export function varianceAnalysis(
  lambda: number,
  mu: number,
  baseVariance: number
) {
  const results = [];
  const variations = [0, baseVariance * 0.5, baseVariance, baseVariance * 1.5, baseVariance * 2];

  for (const variance of variations) {
    const result = calculateMG1({ lambda, mu, variance });
    const cs2 = variance / Math.pow(mu, 2);

    results.push({
      variance: formatNumber(variance),
      cs2: formatNumber(cs2),
      lq: result.lq,
      wq: result.wq,
      l: result.l,
      w: result.w
    });
  }

  return results;
}

/**
 * Recomendaciones basadas en la variabilidad
 */
export function getVariabilityRecommendations(variance: number, mu: number): string[] {
  const cs2 = variance / Math.pow(mu, 2);
  const recommendations: string[] = [];

  if (cs2 < 0.5) {
    recommendations.push('Servicio muy consistente (baja variabilidad)');
    recommendations.push('El sistema se comporta similar a M/M/1');
  } else if (cs2 < 1) {
    recommendations.push('Servicio con variabilidad moderada');
    recommendations.push('Comparable a distribuciones como Erlang');
  } else if (cs2 === 1) {
    recommendations.push('Servicio exponencial (M/M/1)');
  } else {
    recommendations.push('Servicio con alta variabilidad');
    recommendations.push('Considere mejorar la consistencia del servicio');
    recommendations.push('Aumentar capacidad podría ser necesario');
  }

  return recommendations;
}

/**
 * Calcula el número mínimo de servidores equivalente para M/G/1
 * usando la fórmula simplificada de capacidad
 */
export function getEquivalentCapacity(
  lambda: number,
  mu: number,
  variance: number
): number {
  const result = calculateMG1({ lambda, mu, variance });

  // La capacidad efectiva es reducida por la variabilidad
  // Usamos L como indicador
  const capacity = Math.ceil(result.l * 1.5); // Buffer de 1.5x

  return capacity;
}
