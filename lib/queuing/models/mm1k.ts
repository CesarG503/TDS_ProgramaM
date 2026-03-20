// Modelo M/M/1/K: Un servidor, capacidad finita K

import { MM1KInput, QueuingResults } from '@/lib/queuing/types';
import { isValidRate, formatNumber } from '@/lib/queuing/utils';

export function calculateMM1K(input: MM1KInput): QueuingResults {
  const { lambda, mu, capacity } = input;

  // Validar entrada
  if (!isValidRate(lambda) || !isValidRate(mu) || capacity < 1 || !Number.isInteger(capacity)) {
    throw new Error('λ, μ deben ser positivos y K debe ser entero ≥ 1');
  }

  // Cálculos principales
  const rho = formatNumber(lambda / mu);

  let p0: number;
  let pn: number[];

  if (Math.abs(rho - 1) < 1e-10) {
    // Caso especial cuando ρ = 1
    p0 = formatNumber(1 / (capacity + 1));
    pn = Array(capacity + 1).fill(p0);
  } else {
    // Caso general: ρ ≠ 1
    // P₀ = (1 - ρ) / (1 - ρ^(K+1))
    const numerator = 1 - rho;
    const denominator = 1 - Math.pow(rho, capacity + 1);
    p0 = formatNumber(numerator / denominator);

    // Pn = ρⁿ × P₀
    pn = [];
    let cumulative = 0;
    for (let n = 0; n <= capacity; n++) {
      const pn_value = formatNumber(Math.pow(rho, n) * p0);
      pn.push(pn_value);
      cumulative += pn_value;
    }
  }

  // Probabilidad de que el sistema esté lleno (rechazo)
  const blockingProbability = formatNumber(pn[capacity] || 0);

  // Tasa efectiva de llegada: λₑ = λ × (1 - P_K)
  const effectiveLambda = formatNumber(lambda * (1 - blockingProbability));

  // Número promedio de clientes en el sistema
  // L = Σ n × Pn desde n=0 hasta K
  let l = 0;
  for (let n = 0; n <= capacity; n++) {
    l += n * (pn[n] || 0);
  }
  l = formatNumber(l);

  // Número promedio en la cola: Lq = L - (1 - P₀) × (λₑ/λ)
  // O más directamente: Lq = Σ (n - 1) × Pn para n ≥ 1
  let lq = 0;
  for (let n = 1; n <= capacity; n++) {
    lq += (n - 1) * (pn[n] || 0);
  }
  lq = formatNumber(lq);

  // Tiempo promedio en el sistema: W = L / λₑ
  const w = effectiveLambda > 0 ? formatNumber(l / effectiveLambda) : 0;

  // Tiempo promedio en la cola: Wq = Lq / λₑ
  const wq = effectiveLambda > 0 ? formatNumber(lq / effectiveLambda) : 0;

  // Determinar estabilidad (sistema M/M/1/K siempre es estable)
  const stability = {
    isMet: true,
    condition: 'Sistema con capacidad finita siempre estable',
    message: 'Capacidad finita garantiza estabilidad'
  };

  return {
    model: 'MM1K',
    rho,
    p0,
    pn,
    l,
    lq,
    w,
    wq,
    blockingProbability,
    effectiveLambda,
    isStable: true,
    stability
  };
}

/**
 * Calcula el efecto de aumentar la capacidad
 */
export function capacityAnalysis(
  lambda: number,
  mu: number,
  maxCapacity: number = 30
): Array<{
  capacity: number;
  blockingProb: number;
  effectiveLambda: number;
  l: number;
  lq: number;
}> {
  const results = [];
  const minCapacity = Math.ceil(lambda / mu) + 1;

  for (let k = minCapacity; k <= maxCapacity; k++) {
    const result = calculateMM1K({ lambda, mu, capacity: k });

    results.push({
      capacity: k,
      blockingProb: result.blockingProbability || 0,
      effectiveLambda: result.effectiveLambda || 0,
      l: result.l,
      lq: result.lq
    });
  }

  return results;
}

/**
 * Encuentra la capacidad mínima para cumplir un objetivo de pérdida
 */
export function findCapacityForBlockingRate(
  lambda: number,
  mu: number,
  targetBlockingRate: number = 0.05, // 5% de rechazo
  maxCapacity: number = 100
): {
  requiredCapacity: number;
  actualBlockingRate: number;
} {
  for (let k = 1; k <= maxCapacity; k++) {
    const result = calculateMM1K({ lambda, mu, capacity: k });
    if ((result.blockingProbability || 0) <= targetBlockingRate) {
      return {
        requiredCapacity: k,
        actualBlockingRate: result.blockingProbability || 0
      };
    }
  }

  return {
    requiredCapacity: maxCapacity,
    actualBlockingRate: calculateMM1K({ lambda, mu, capacity: maxCapacity }).blockingProbability || 0
  };
}

/**
 * Comparación entre sistema con capacidad infinita y finita
 */
export function compareWithInfiniteCapacity(
  lambda: number,
  mu: number,
  capacity: number
): {
  finite: QueuingResults;
  infinite: {
    l: number;
    lq: number;
    w: number;
    wq: number;
  };
  difference: {
    lDifference: number;
    lqDifference: number;
    blockingProbability: number;
  };
} {
  const finite = calculateMM1K({ lambda, mu, capacity });

  // Para capacidad infinita (M/M/1)
  const rho = lambda / mu;
  if (rho >= 1) {
    throw new Error('No se puede comparar con capacidad infinita cuando ρ ≥ 1');
  }

  const infinite = {
    l: formatNumber(rho / (1 - rho)),
    lq: formatNumber(Math.pow(rho, 2) / (1 - rho)),
    w: formatNumber(1 / (mu - lambda)),
    wq: formatNumber(rho / (mu - lambda))
  };

  return {
    finite,
    infinite,
    difference: {
      lDifference: formatNumber(infinite.l - finite.l),
      lqDifference: formatNumber(infinite.lq - finite.lq),
      blockingProbability: finite.blockingProbability || 0
    }
  };
}

/**
 * Análisis de costos considerando rechazo
 */
export function costAnalysisWithBlockingCost(
  lambda: number,
  mu: number,
  capacity: number,
  costPerWaitingCustomer: number,
  costPerRejectedCustomer: number
): {
  serverCost: number;
  waitingCost: number;
  rejectionCost: number;
  totalCost: number;
} {
  const result = calculateMM1K({ lambda, mu, capacity });
  const blockingProb = result.blockingProbability || 0;
  const rejectionRate = lambda * blockingProb;

  const waitingCost = formatNumber(result.l * costPerWaitingCustomer);
  const rejectionCost = formatNumber(rejectionRate * costPerRejectedCustomer);
  const totalCost = formatNumber(waitingCost + rejectionCost);

  return {
    serverCost: 0, // Un servidor
    waitingCost,
    rejectionCost,
    totalCost
  };
}
