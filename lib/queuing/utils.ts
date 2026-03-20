// Funciones auxiliares para teoría de colas

export const VARIABLE_DEFINITIONS = {
  lambda: {
    symbol: 'λ',
    name: 'Tasa de Llegada',
    description: 'Número promedio de clientes que llegan al sistema por unidad de tiempo',
    unit: 'clientes/hora',
    typicalRange: '1 - 100 clientes/hora',
    interpretation: 'Valores mayores indican más presión en el sistema'
  },
  mu: {
    symbol: 'μ',
    name: 'Tasa de Servicio',
    description: 'Número promedio de clientes que un servidor puede atender por unidad de tiempo',
    unit: 'clientes/hora',
    typicalRange: '1 - 100 clientes/hora',
    interpretation: 'Valores mayores indican servidores más eficientes'
  },
  rho: {
    symbol: 'ρ',
    name: 'Factor de Utilización',
    description: 'Proporción de tiempo que los servidores están ocupados',
    unit: 'Sin unidad (0-1)',
    typicalRange: '0.5 - 0.9',
    interpretation: 'ρ cercano a 1 indica sistema saturado; < 0.5 indica capacidad ociosa'
  },
  p0: {
    symbol: 'P₀',
    name: 'Probabilidad de Sistema Vacío',
    description: 'Probabilidad de que no haya clientes en el sistema',
    unit: 'Probabilidad (0-1)',
    typicalRange: '0.1 - 0.5',
    interpretation: 'Valores bajos indican sistema ocupado la mayoría del tiempo'
  },
  l: {
    symbol: 'L',
    name: 'Clientes en Sistema',
    description: 'Número promedio de clientes presentes en el sistema (cola + servidor)',
    unit: 'clientes',
    typicalRange: '1 - 50 clientes',
    interpretation: 'Indica congestión general del sistema'
  },
  lq: {
    symbol: 'Lq',
    name: 'Clientes en Cola',
    description: 'Número promedio de clientes esperando en la cola',
    unit: 'clientes',
    typicalRange: '0.5 - 30 clientes',
    interpretation: 'Refleja la efectividad de la cola; valores bajos son deseables'
  },
  w: {
    symbol: 'W',
    name: 'Tiempo en Sistema',
    description: 'Tiempo promedio que un cliente pasa en el sistema (espera + servicio)',
    unit: 'minutos u horas',
    typicalRange: '5 - 120 minutos',
    interpretation: 'Impacta en la satisfacción del cliente'
  },
  wq: {
    symbol: 'Wq',
    name: 'Tiempo en Cola',
    description: 'Tiempo promedio que un cliente espera antes de ser atendido',
    unit: 'minutos u horas',
    typicalRange: '1 - 60 minutos',
    interpretation: 'Mide la calidad del servicio; valores menores son mejores'
  },
  servers: {
    symbol: 's',
    name: 'Número de Servidores',
    description: 'Cantidad de servidores disponibles para atender clientes',
    unit: 'servidores',
    typicalRange: '1 - 20 servidores',
    interpretation: 'Aumentar servidores reduce tiempos de espera pero incrementa costos'
  },
  capacity: {
    symbol: 'K',
    name: 'Capacidad Máxima',
    description: 'Máximo número de clientes permitidos en el sistema',
    unit: 'clientes',
    typicalRange: '5 - 100 clientes',
    interpretation: 'Clientes que llegan cuando K está lleno son rechazados'
  },
  variance: {
    symbol: 'σ²',
    name: 'Varianza del Servicio',
    description: 'Medida de variabilidad en los tiempos de servicio',
    unit: '(unidad de tiempo)²',
    typicalRange: '0.1 - 10',
    interpretation: 'Mayor varianza = mayor impacto en la cola'
  }
};

/**
 * Valida que un número sea válido y positivo
 */
export function isValidRate(value: number): boolean {
  return typeof value === 'number' && value > 0 && isFinite(value);
}

/**
 * Calcula factorial (usado en algunas fórmulas)
 */
export function factorial(n: number): number {
  if (n < 0) return NaN;
  if (n === 0 || n === 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

/**
 * Calcula combinaciones C(n, k)
 */
export function combination(n: number, k: number): number {
  if (k > n) return 0;
  if (k === 0 || k === n) return 1;
  return factorial(n) / (factorial(k) * factorial(n - k));
}

/**
 * Formatea un número con dígitos significativos
 */
export function formatNumber(value: number, decimals: number = 4): number {
  if (!isFinite(value)) return 0;
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Formatea un número para mostrar (con separadores, decimales)
 */
export function formatDisplay(value: number, decimals: number = 4): string {
  if (!isFinite(value)) return '∞';
  const formatted = formatNumber(value, decimals);
  return formatted.toLocaleString('es-MX', {
    minimumFractionDigits: Math.min(decimals, 2),
    maximumFractionDigits: decimals
  });
}

/**
 * Genera array de probabilidades desde 0 hasta n
 */
export function generateProbabilityArray(p0: number, rho: number, maxTerms: number = 20): number[] {
  const pn: number[] = [p0];
  let cumulative = p0;

  for (let n = 1; n < maxTerms && cumulative < 0.999; n++) {
    const pn_value = Math.pow(rho, n) * p0;
    pn.push(pn_value);
    cumulative += pn_value;
  }

  return pn;
}

/**
 * Verifica estabilidad del sistema M/M/1: λ < μ
 */
export function checkMM1Stability(lambda: number, mu: number): {
  isMet: boolean;
  condition: string;
  message: string;
} {
  const isMet = lambda < mu;
  return {
    isMet,
    condition: `λ < μ (${lambda.toFixed(2)} < ${mu.toFixed(2)})`,
    message: isMet ? 'Sistema estable' : 'Sistema inestable - λ ≥ μ'
  };
}

/**
 * Verifica estabilidad del sistema M/M/s: λ < s×μ
 */
export function checkMMSStability(lambda: number, mu: number, servers: number): {
  isMet: boolean;
  condition: string;
  message: string;
} {
  const capacity = servers * mu;
  const isMet = lambda < capacity;
  return {
    isMet,
    condition: `λ < s×μ (${lambda.toFixed(2)} < ${capacity.toFixed(2)})`,
    message: isMet ? 'Sistema estable' : 'Sistema inestable - λ ≥ s×μ'
  };
}

/**
 * Calcula el coeficiente de variación (σ²/μ²) para M/G/1
 */
export function getVariationCoefficient(variance: number, mu: number): number {
  return variance / Math.pow(mu, 2);
}

/**
 * Trunca decimales sin redondear
 */
export function truncateDecimals(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.trunc(value * factor) / factor;
}

/**
 * Genera datos para gráficos (rho vs L, Lq, W, Wq)
 */
export function generateChartData(
  lambda: number,
  mu: number,
  servers: number = 1,
  maxRho: number = 0.95
) {
  const data = [];
  const step = 0.05;

  for (let rho = step; rho <= maxRho; rho += step) {
    const currentLambda = rho * servers * mu;
    data.push({
      rho: formatNumber(rho, 3),
      lambda: formatNumber(currentLambda, 2)
    });
  }

  return data;
}
