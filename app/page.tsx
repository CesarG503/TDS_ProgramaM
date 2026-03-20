'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, BarChart3, Zap, BookOpen, Lightbulb } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50 to-indigo-50">
      {/* Header/Navigation */}
      <header className="border-b border-indigo-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-8 h-8 text-indigo-600" />
              <h1 className="text-2xl font-bold text-indigo-900">Teoría de Colas</h1>
            </div>
            <nav className="space-x-4">
              <Link href="/queuing">
                <Button variant="ghost">Calculadora</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center space-y-6 mb-16">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
            Domina la <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600">Teoría de Colas</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Herramienta interactiva para resolver problemas de teoría de colas con múltiples modelos matemáticos y visualización de resultados
          </p>
          <Link href="/queuing">
            <Button size="lg" className="gap-2 bg-indigo-600 hover:bg-indigo-700">
              Ir a la Calculadora <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <FeatureCard
            icon={<BarChart3 className="w-8 h-8 text-indigo-600" />}
            title="5 Modelos"
            description="M/M/1, M/M/s, M/G/1, M/M/1/K y análisis con prioridades"
          />
          <FeatureCard
            icon={<Zap className="w-8 h-8 text-indigo-600" />}
            title="Cálculos Instantáneos"
            description="Resultados inmediatos con fórmulas matemáticas precisas"
          />
          <FeatureCard
            icon={<BookOpen className="w-8 h-8 text-indigo-600" />}
            title="Educativo"
            description="Explicaciones claras de cada variable y su interpretación"
          />
          <FeatureCard
            icon={<Lightbulb className="w-8 h-8 text-indigo-600" />}
            title="Visualización"
            description="Gráficos y recomendaciones basadas en los resultados"
          />
        </div>

        {/* Models Section */}
        <section className="mb-16">
          <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">Modelos Disponibles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ModelCard
              name="M/M/1"
              description="Un servidor con llegadas Poisson y servicio exponencial"
              features={['Análisis simple', 'Una cola', 'Un servidor']}
            />
            <ModelCard
              name="M/M/s"
              description="Múltiples servidores paralelos con llegadas y servicio exponenciales"
              features={['Varios servidores', 'Probabilidad de espera', 'Análisis de capacidad']}
            />
            <ModelCard
              name="M/G/1"
              description="Un servidor con servicio de distribución general (cualquier distribución)"
              features={['Servicio variable', 'Fórmula Pollaczek-Khinchine', 'Análisis de varianza']}
            />
            <ModelCard
              name="M/M/1/K"
              description="Un servidor con capacidad limitada (cliente pueden ser rechazados)"
              features={['Capacidad finita', 'Probabilidad de bloqueo', 'Tasa efectiva']}
            />
            <ModelCard
              name="Con Prioridades"
              description="Sistema con múltiples clases de clientes con diferentes prioridades"
              features={['Clases de prioridad', 'Tiempos por clase', 'Análisis diferenciado']}
            />
            <ModelCard
              name="Análisis de Costos"
              description="Optimización de número de servidores considerando costos operacionales"
              features={['Costo por servidor', 'Costo de espera', 'Optimización']}
            />
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-white rounded-lg shadow-sm p-8 border border-gray-200 mb-16">
          <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">Cómo Usar</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StepCard
              number={1}
              title="Selecciona Modelo"
              description="Elige el modelo que mejor representa tu problema"
            />
            <StepCard
              number={2}
              title="Ingresa Parámetros"
              description="Completa los valores de tasa de llegada y servicio"
            />
            <StepCard
              number={3}
              title="Calcula"
              description="El sistema procesa los cálculos automáticamente"
            />
            <StepCard
              number={4}
              title="Analiza Resultados"
              description="Visualiza gráficos, tablas y recomendaciones"
            />
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-lg p-12 text-center text-white">
          <h3 className="text-3xl font-bold mb-4">¿Listo para comenzar?</h3>
          <p className="text-lg mb-8 text-indigo-100">
            Resuelve problemas complejos de teoría de colas en segundos
          </p>
          <Link href="/queuing">
            <Button size="lg" variant="secondary" className="gap-2">
              Acceder a la Calculadora <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </section>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/50 backdrop-blur-sm mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-600 text-sm">
          <p>Teoría de Colas - Herramienta educativa para análisis de sistemas de espera</p>
        </div>
      </footer>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="pt-6 text-center">
        <div className="flex justify-center mb-4">{icon}</div>
        <h4 className="font-semibold text-gray-900 mb-2">{title}</h4>
        <p className="text-sm text-gray-600">{description}</p>
      </CardContent>
    </Card>
  );
}

interface ModelCardProps {
  name: string;
  description: string;
  features: string[];
}

function ModelCard({ name, description, features }: ModelCardProps) {
  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow h-full">
      <CardHeader>
        <CardTitle className="text-indigo-700">{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
              <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

interface StepCardProps {
  number: number;
  title: string;
  description: string;
}

function StepCard({ number, title, description }: StepCardProps) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg mb-4">
        {number}
      </div>
      <h4 className="font-semibold text-gray-900 mb-2">{title}</h4>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}
