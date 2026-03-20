// Modelo M/M/s: Múltiples servidores, llegadas y servicios exponenciales

import { MMSInput, QueuingResults } from '@/lib/queuing/types';
import {
  isValidRate,
  formatNumber,
  generateProbabilityArray,
  checkMMSStability
} from '@/lib/queuing/utils';

/**
 * Calcula P₀ para M/M/s usando la fórmula de Erlang
 */
function calculateP0MMS(lambda: number, mu: number, servers: number): number {
  const rho = lambda / (servers * mu);

  // Término de la sumatoria: suma de (λ/μ)^n / n! para n = 0 a s-1
  let sum = 0;
  for (let n = 0; n < servers; n++) {
    const numerator = Math.pow(lambda / mu, n);
    let denominator = 1;
    for (let i = 1; i <= n; i++) {
      denominator *= i; // n!
    }
    sum += numerator / denominator;
  }

  // Término especial para n = s
  const numerator = Math.pow(lambda / mu, servers);
  let denominator = 1;
  for (let i = 1; i <= servers; i++) {
    denominator *= i; // s!
  }
  const lastTerm = (numerator / denominator) * (servers / (servers - lambda / mu));

  const p0 = formatNumber(1 / (sum + lastTerm));
  return Math.max(0, Math.min(1, p0)); // Asegurar que esté en [0,1]
}

/**
 * Calcula la probabilidad de espera (Erlang C) para M/M/s
 */
function calculateErlangC(lambda: number, mu: number, servers: number, p0: number): number {
  const rho = lambda / (servers * mu);

  // C(s, λ/μ) = (λ/μ)^s / s! × s / (s - λ/μ) × P₀
  const numerator = Math.pow(lambda / mu, servers);
  let denominator = 1;
  for (let i = 1; i <= servers; i++) {
    denominator *= i; // s!
  }

  const pw = formatNumber(
    (numerator / denominator) * (servers / (servers - lambda / mu)) * p0
  );

  return Math.max(0, Math.min(1, pw));
}

export function calculateMMS(input: MMSInput): QueuingResults {
  const { lambda, mu, servers } = input;

  // Validar entrada
  if (!isValidRate(lambda) || !isValidRate(mu) || servers < 1 || !Number.isInteger(servers)) {
    throw new Error('λ, μ deben ser positivos y s debe ser entero ≥ 1');
  }

  // Verificar estabilidad
  const stability = checkMMSStability(lambda, mu, servers);
  // Eliminado el 'throw new Error' para permitir cálculo incluso si es inestable

  // Cálculos principales
  const rho = formatNumber(lambda / (servers * mu));

  // P₀ (Erlang B modificado)
  const p0 = calculateP0MMS(lambda, mu, servers);

  // Probabilidad de espera (Erlang C)
  const pw = calculateErlangC(lambda, mu, servers, p0);

  // Número promedio en la cola: Lq = Pw × ρ / (1 - ρ)
  const lq = formatNumber((pw * rho) / (1 - rho));

  // Número promedio en el sistema: L = Lq + λ/μ
  const l = formatNumber(lq + lambda / mu);

  // Tiempo promedio en la cola: Wq = Lq / λ
  const wq = formatNumber(lq / lambda);

  // Tiempo promedio en el sistema: W = Wq + 1/μ
  const w = formatNumber(wq + 1 / mu);

  // Generar array de probabilidades (limitado)
  const pn = [p0];
  for (let n = 1; n < Math.min(servers + 10, 20); n++) {
    const pn_value = formatNumber(
      (Math.pow(lambda / mu, n) / (n < servers ? factorial(n) : Math.pow(servers, n - servers) * factorial(servers))) * p0
    );
    pn.push(pn_value);
  }

  return {
    model: 'MMS',
    rho,
    p0,
    pn,
    l,
    lq,
    w,
    wq,
    pw,
    isStable: stability.isMet,
    stability
  };
}

/**
 * Calcula factorial (duplicado aquí para evitar dependencia circular)
 */
function factorial(n: number): number {
  if (n < 0) return NaN;
  if (n === 0 || n === 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

/**
 * Encuentra el número mínimo de servidores para cumplir un nivel de servicio
 */
export function findMinServersForServiceLevel(
  lambda: number,
  mu: number,
  targetPw: number
): number {
  let servers = Math.ceil(lambda / mu); // Mínimo teórico

  for (let s = servers; s <= servers + 10; s++) {
    const result = calculateMMS({ lambda, mu, servers: s });
    if (result.pw && result.pw <= targetPw) {
      return s;
    }
  }

  return servers + 10;
}

/**
 * Análisis de costos: encuentra el número óptimo de servidores
 */
export function optimizeServers(
  lambda: number,
  mu: number,
  costPerServer: number,
  costPerWaitingCustomer: number,
  maxServers: number = 20
): {
  optimalServers: number;
  optimalCost: number;
  costsByServers: Array<{ servers: number; totalCost: number; serverCost: number; waitingCost: number }>;
} {
  const costs = [];

  for (let s = Math.ceil(lambda / mu); s <= maxServers; s++) {
    const result = calculateMMS({ lambda, mu, servers: s });
    const serverCost = s * costPerServer;
    const waitingCost = result.l * costPerWaitingCustomer;
    const totalCost = formatNumber(serverCost + waitingCost);

    costs.push({
      servers: s,
      totalCost,
      serverCost,
      waitingCost
    });
  }

  const optimal = costs.reduce((prev, current) =>
    prev.totalCost < current.totalCost ? prev : current
  );

  return {
    optimalServers: optimal.servers,
    optimalCost: optimal.totalCost,
    costsByServers: costs
  };
}

/**
 * Sensibilidad del número de servidores
 */
export function sensitivityServers(lambda: number, mu: number, baseServers: number) {
  const results = [];
  const minServers = Math.ceil(lambda / mu);

  for (let s = Math.max(1, minServers); s <= baseServers + 5; s++) {
    const result = calculateMMS({ lambda, mu, servers: s });
    results.push({
      servers: s,
      pw: result.pw,
      lq: result.lq,
      wq: result.wq
    });
  }

  return results;
}
