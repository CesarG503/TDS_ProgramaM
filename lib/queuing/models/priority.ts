// Modelo con Prioridades: Sistema con múltiples clases de prioridad

import { PriorityInput, QueuingResults } from '@/lib/queuing/types';
import { isValidRate, formatNumber } from '@/lib/queuing/utils';

export function calculatePriority(input: PriorityInput): QueuingResults {
  const { lambda, mu, servers, classCount, classLambdas, classMus, priorities } = input;

  // Validar entrada
  if (
    !isValidRate(lambda) ||
    !isValidRate(mu) ||
    servers < 1 ||
    classCount < 1 ||
    classLambdas.length !== classCount ||
    classMus.length !== classCount ||
    priorities.length !== classCount
  ) {
    throw new Error('Parámetros inválidos para sistema con prioridades');
  }

  // Calcular carga total
  const totalLambda = classLambdas.reduce((a, b) => a + b, 0);
  const rho = formatNumber(totalLambda / (servers * mu));

  // Verificar estabilidad
  if (rho >= 1) {
    // throw new Error('Sistema inestable: tasa total de llegada ≥ capacidad total');
  }

  // Para un sistema simplificado de prioridades no preemptive
  // Calculamos Wq para cada clase

  const classResults = classLambdas.map((classLambda, idx) => {
    const classMu = classMus[idx];
    const priority = priorities[idx];

    // Utilización de la clase
    const classRho = formatNumber(classLambda / (servers * classMu));

    // Para prioridades no preemptive, usamos aproximación
    // Wq para clase i depende de clases con mayor prioridad
    let wq_sum = 0;
    let lambda_higher = 0;

    for (let j = 0; j < classCount; j++) {
      if (priorities[j] < priority) {
        // Clase j tiene mayor prioridad
        lambda_higher += classLambdas[j];
        const mu_j = classMus[j];
        const rho_j = classLambdas[j] / (servers * mu_j);
        wq_sum += (rho_j * servers) / (1 - rho_j);
      }
    }

    // Wq aproximado
    const w_q = formatNumber(
      ((classRho * servers) / (1 - rho)) * (1 + wq_sum)
    );

    const w = formatNumber(w_q + 1 / classMu);
    const lq = formatNumber(classLambda * w_q);
    const l = formatNumber(classLambda * w);

    return {
      class: idx + 1,
      priority,
      lambda: formatNumber(classLambda),
      mu: formatNumber(classMu),
      rho: classRho,
      lq,
      l,
      wq: w_q,
      w
    };
  });

  // Agregados del sistema
  const p0 = formatNumber(1 - rho);
  const totalL = classResults.reduce((sum, c) => sum + c.l, 0);
  const totalLq = classResults.reduce((sum, c) => sum + c.lq, 0);
  const totalW = formatNumber(totalL / totalLambda);
  const totalWq = formatNumber(totalLq / totalLambda);

  return {
    model: 'PRIORITY',
    rho,
    p0,
    pn: [], // No aplicable para prioridades
    l: totalL,
    lq: totalLq,
    w: totalW,
    wq: totalWq,
    isStable: rho < 1,
    stability: {
      isMet: rho < 1,
      condition: `ρ = λ/（s×μ) < 1 (${formatNumber(rho)} < 1)`,
      message: rho < 1 ? 'Sistema estable' : 'Sistema inestable'
    }
  };
}

/**
 * Análisis del impacto de la prioridad en tiempos de espera
 */
export function priorityImpactAnalysis(
  lambda: number,
  mu: number,
  servers: number,
  classCount: number = 2
) {
  // Escenario sin prioridades (todas igualmente tratadas)
  const equalLambdaPerClass = lambda / classCount;
  const equalMuPerClass = mu;

  const results = {
    withPriority: null as any,
    withoutPriority: null as any,
    improvements: null as any
  };

  // Sistema con prioridades
  const classLambdas = Array(classCount).fill(equalLambdaPerClass);
  const classMus = Array(classCount).fill(equalMuPerClass);
  const priorities = Array.from({ length: classCount }, (_, i) => i + 1); // 1, 2, 3, ...

  results.withPriority = calculatePriority({
    lambda,
    mu,
    servers,
    classCount,
    classLambdas,
    classMus,
    priorities
  });

  // Sistema sin prioridades (todas igualmente)
  results.withoutPriority = {
    l: formatNumber((lambda * (1 / mu)) / (1 - lambda / (servers * mu))),
    wq: formatNumber(
      ((lambda / mu) * servers) /
      ((servers - lambda / mu) * 2 * (1 - lambda / (servers * mu)))
    )
  };

  return results;
}

/**
 * Recomendaciones para distribución de prioridades
 */
export function getPriorityRecommendations(classLambdas: number[], priorities: number[]): string[] {
  const recommendations: string[] = [];

  // Ordenar por lambda
  const sorted = classLambdas
    .map((lambda, idx) => ({ lambda, priority: priorities[idx], idx }))
    .sort((a, b) => b.lambda - a.lambda);

  // Analizar patrones
  if (sorted[0].priority > sorted[sorted.length - 1].priority) {
    recommendations.push(
      'Clases de alto volumen tienen baja prioridad. Considere invertir prioridades'
    );
  }

  const highPriorityLoad = classLambdas
    .map((lambda, idx) => (priorities[idx] === 1 ? lambda : 0))
    .reduce((a, b) => a + b, 0);

  if (highPriorityLoad > classLambdas.reduce((a, b) => a + b) * 0.5) {
    recommendations.push('Alta prioridad recibe >50% del tráfico. Considere redistribuir');
  }

  if (recommendations.length === 0) {
    recommendations.push('Distribución de prioridades balanceada');
  }

  return recommendations;
}

/**
 * Análisis de sensibilidad de prioridades
 */
export function prioritySensitivityAnalysis(
  lambda: number,
  mu: number,
  servers: number,
  baseClassLambdas: number[],
  baseClassMus: number[],
  variation: number = 0.2
) {
  const classCount = baseClassLambdas.length;
  const results = [];

  for (let varIdx = 0; varIdx < classCount; varIdx++) {
    const variedLambdas = baseClassLambdas.map((l, idx) =>
      idx === varIdx ? l * (1 + variation) : l
    );

    const priorities = Array.from({ length: classCount }, (_, i) => i + 1);

    try {
      const result = calculatePriority({
        lambda,
        mu,
        servers,
        classCount,
        classLambdas: variedLambdas,
        classMus: baseClassMus,
        priorities
      });

      results.push({
        variedClass: varIdx + 1,
        lambdaVariation: `+${(variation * 100).toFixed(1)}%`,
        totalWq: result.wq,
        totalL: result.l
      });
    } catch (e) {
      // Ignorar si se vuelve inestable
    }
  }

  return results;
}
