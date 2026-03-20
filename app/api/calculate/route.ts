import { NextRequest, NextResponse } from 'next/server';
import { QueuingModel, QueuingInput, QueuingResults } from '@/lib/queuing/types';
import { calculateMM1 } from '@/lib/queuing/models/mm1';
import { calculateMMS } from '@/lib/queuing/models/mms';
import { calculateMG1 } from '@/lib/queuing/models/mg1';
import { calculateMM1K } from '@/lib/queuing/models/mm1k';
import { calculatePriority } from '@/lib/queuing/models/priority';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { model, input } = body as {
      model: QueuingModel;
      input: QueuingInput;
    };

    // Validar que tenemos modelo e input
    if (!model || !input) {
      return NextResponse.json(
        { error: 'Missing model or input parameters' },
        { status: 400 }
      );
    }

    let result: QueuingResults;

    // Ejecutar el cálculo apropiado
    switch (model) {
      case 'MM1':
        result = calculateMM1(input);
        break;

      case 'MMS':
        result = calculateMMS(input);
        break;

      case 'MG1':
        result = calculateMG1(input);
        break;

      case 'MM1K':
        result = calculateMM1K(input);
        break;

      case 'PRIORITY':
        result = calculatePriority(input);
        break;

      case 'COST':
        // Para análisis de costos, usar MMS con ajustes
        result = calculateMMS(input);
        // Agregar cálculo de costo
        if ('costPerServer' in input && 'costPerWaitingCustomer' in input) {
          const serverCost = (input.servers || 1) * input.costPerServer;
          const waitingCost = result.l * input.costPerWaitingCustomer;
          result.cost = serverCost + waitingCost;
        }
        break;

      default:
        return NextResponse.json(
          { error: `Unknown model: ${model}` },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, results: result });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[v0] API Error:', errorMessage);

    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    );
  }
}
