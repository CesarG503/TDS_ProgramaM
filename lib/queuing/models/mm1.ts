// Modelo M/M/1: Un servidor, llegadas y servicios exponenciales

import { MM1Input, QueuingResults } from '@/lib/queuing/types';
import {
  isValidRate,
  formatNumber,
  generateProbabilityArray,
  checkMM1Stability
} from '@/lib/queuing/utils';

export function calculateMM1(input: MM1Input): QueuingResults {
  const { lambda, mu } = input;

  // Validar entrada
  if (!isValidRate(lambda) || !isValidRate(mu)) {
    throw new Error('λ y μ deben ser números positivos');
  }

  // Verificar estabilidad
  const stability = checkMM1Stability(lambda, mu);
  // Eliminado el 'throw new Error' para permitir cálculo incluso si es inestable

  // Cálculos principales
  const rho = formatNumber(lambda / mu);
  const p0 = formatNumber(1 - rho);

  // Validar que p0 sea válido (removido el throw para permitir números negativos en inestables)
  if (p0 < 0 || p0 > 1 || !isFinite(p0)) {
    // throw new Error('Error en el cálculo de P₀');
  }

  // Distribución de probabilidades: Pn = ρⁿ × P₀
  const pn = generateProbabilityArray(p0, rho);

  // Número promedio de clientes en el sistema: L = ρ/(1-ρ)
  const l = formatNumber(rho / (1 - rho));

  // Número promedio en la cola: Lq = ρ²/(1-ρ)
  const lq = formatNumber(Math.pow(rho, 2) / (1 - rho));

  // Tiempo promedio en el sistema: W = 1/(μ-λ)
  const w = formatNumber(1 / (mu - lambda));

  // Tiempo promedio en la cola: Wq = ρ/(μ-λ)
  const wq = formatNumber(rho / (mu - lambda));

  return {
    model: 'MM1',
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
 * Calcula probabilidad de n o más clientes en el sistema
 */
export function calculatePnOrMore(rho: number, n: number): number {
  return formatNumber(Math.pow(rho, n));
}

/**
 * Calcula probabilidad de exactamente n clientes
 */
export function calculatePnExact(p0: number, rho: number, n: number): number {
  return formatNumber(Math.pow(rho, n) * p0);
}

/**
 * Calcula el número de servidores equivalente para un tiempo de espera objetivo
 */
export function findTargetWaitingTime(lambda: number, mu: number, targetWq: number): number {
  // Wq = ρ/(μ-λ), despejando para encontrar el μ necesario
  // targetWq = λ/((μ-λ)×μ)
  // Necesitamos un μ más alto
  
  const requiredMu = lambda / (targetWq * mu) + lambda;
  return Math.ceil(requiredMu / mu); // Convertir a número de servidores equivalentes
}

/**
 * Análisis de sensibilidad: cómo afectan cambios en λ
 */
export function sensitivityAnalysisLambda(baseLambda: number, mu: number, variation: number = 0.2) {
  const results = [];
  const variations = [-variation, -variation / 2, 0, variation / 2, variation];

  for (const v of variations) {
    const newLambda = baseLambda * (1 + v);
    if (newLambda < mu) {
      const result = calculateMM1({ lambda: newLambda, mu });
      results.push({
        lambdaVariation: `${(v * 100 >= 0 ? '+' : '')}${(v * 100).toFixed(1)}%`,
        lambda: formatNumber(newLambda),
        ...result
      });
    }
  }

  return results;
}

/**
 * Análisis de sensibilidad: cómo afectan cambios en μ
 */
export function sensitivityAnalysisMu(lambda: number, baseMu: number, variation: number = 0.2) {
  const results = [];
  const variations = [-variation, -variation / 2, 0, variation / 2, variation];

  for (const v of variations) {
    const newMu = baseMu * (1 + v);
    if (lambda < newMu) {
      const result = calculateMM1({ lambda, mu: newMu });
      results.push({
        muVariation: `${(v * 100 >= 0 ? '+' : '')}${(v * 100).toFixed(1)}%`,
        mu: formatNumber(newMu),
        ...result
      });
    }
  }

  return results;
}
