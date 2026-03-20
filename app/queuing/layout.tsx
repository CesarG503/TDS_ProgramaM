export const metadata = {
  title: 'Teoría de Colas - Calculadora',
  description: 'Herramienta interactiva para resolver problemas de teoría de colas con modelos M/M/1, M/M/s, M/G/1 y más'
};

export default function QueuingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="border-b border-indigo-200 bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-indigo-900">Teoría de Colas</h1>
              <p className="text-sm text-gray-600">Calculadora interactiva de modelos de colas</p>
            </div>
            <nav className="space-x-4">
              <a href="/queuing" className="text-indigo-600 hover:text-indigo-700 font-medium">
                Calculadora
              </a>
              <a href="/" className="text-gray-600 hover:text-gray-700 font-medium">
                Inicio
              </a>
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  );
}
