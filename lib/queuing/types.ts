// Tipos para la aplicación de teoría de colas

export type QueuingModel = 'MM1' | 'MMS' | 'MG1' | 'MM1K' | 'PRIORITY' | 'COMPARISON' | 'COST';

export interface BaseInput {
  lambda: number; // Tasa de llegada (clientes/unidad tiempo)
  mu: number; // Tasa de servicio (clientes/unidad tiempo)
}

export interface MM1Input extends BaseInput {}

export interface MMSInput extends BaseInput {
  servers: number; // Número de servidores
}

export interface MG1Input extends BaseInput {
  variance: number; // Varianza del tiempo de servicio
}

export interface MM1KInput extends BaseInput {
  capacity: number; // Capacidad máxima del sistema
}

export interface PriorityInput extends BaseInput {
  servers: number;
  classCount: number; // Número de clases de prioridad
  classLambdas: number[]; // Tasas de llegada por clase
  classMus: number[]; // Tasas de servicio por clase
  priorities: number[]; // Niveles de prioridad (1=máxima)
}

export interface CostInput extends BaseInput {
  servers: number;
  costPerServer: number; // Costo por servidor
  costPerWaitingCustomer: number; // Costo de espera por cliente
}

export type QueuingInput = MM1Input | MMSInput | MG1Input | MM1KInput | PriorityInput | CostInput;

// Resultados de los cálculos
export interface QueuingResults {
  model: QueuingModel;
  rho: number; // Utilización del sistema
  p0: number; // Probabilidad de que el sistema esté vacío
  pn: number[]; // Distribución de probabilidades
  l: number; // Número promedio de clientes en el sistema
  lq: number; // Número promedio de clientes en la cola
  w: number; // Tiempo promedio en el sistema
  wq: number; // Tiempo promedio en la cola
  pw?: number; // Probabilidad de espera (M/M/s)
  effectiveLambda?: number; // Tasa efectiva (M/M/1/K)
  blockingProbability?: number; // Probabilidad de bloqueo (M/M/1/K)
  cost?: number; // Costo total (análisis de costos)
  isStable: boolean;
  stability?: {
    condition: string;
    isMet: boolean;
    message: string;
  };
}

export interface VariableDefinition {
  symbol: string;
  name: string;
  description: string;
  unit: string;
  typicalRange: string;
  interpretation: string;
}

export interface ScenarioComparison {
  name: string;
  input: QueuingInput;
  results: QueuingResults;
}
