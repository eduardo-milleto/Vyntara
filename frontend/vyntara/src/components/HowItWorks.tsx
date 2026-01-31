import { Search, Database, Sparkles, FileText } from "lucide-react";

const steps = [
  {
    icon: Search,
    number: "01",
    title: "Digite um nome",
    description: "Insira o nome da pessoa ou CNPJ da empresa que deseja investigar",
    color: "#67EDFC"
  },
  {
    icon: Database,
    number: "02",
    title: "Busca automatizada",
    description: "Nossa IA varre dezenas de fontes públicas: tribunais, empresas, diários oficiais",
    color: "#5582F3"
  },
  {
    icon: Sparkles,
    number: "03",
    title: "IA interpreta",
    description: "Eliminamos homônimos e interpretamos dados jurídicos e empresariais",
    color: "#A557FA"
  },
  {
    icon: FileText,
    number: "04",
    title: "Relatório completo",
    description: "Receba um relatório claro com identidade, processos, empresas e indicador de risco",
    color: "#67EDFC"
  }
];

export function HowItWorks() {
  return (
    <section className="relative py-24 px-4">
      {/* Background Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#5582F3] rounded-full mix-blend-screen filter blur-[160px] opacity-10"></div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-[#67EDFC]/10 to-[#A557FA]/10 border border-[#67EDFC]/20 mb-4">
            <span className="text-[#67EDFC]">COMO FUNCIONA</span>
          </div>
          <h2 className="text-[#FDFDFE] mb-4" style={{ fontSize: '2.5rem' }}>
            Inteligência em 4 Passos
          </h2>
          <p className="text-[#E3E2E4]/70 max-w-2xl mx-auto">
            De uma simples busca até o relatório completo em minutos
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-[calc(50%+2rem)] w-[calc(100%-4rem)] h-[2px] bg-gradient-to-r from-[#67EDFC]/30 to-transparent"></div>
              )}

              {/* Step Card */}
              <div className="relative">
                {/* Number Badge */}
                <div 
                  className="absolute -top-4 -left-4 w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center z-10 border-2 border-[#060411]"
                  style={{ 
                    background: `linear-gradient(135deg, ${step.color}40, ${step.color}10)`,
                    borderColor: step.color
                  }}
                >
                  <span className="text-[#FDFDFE]">{step.number}</span>
                </div>

                {/* Content */}
                <div className="bg-gradient-to-br from-[#190E68]/30 to-[#06406E]/30 backdrop-blur-sm border border-[#67EDFC]/10 rounded-2xl p-8 pt-10">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${step.color}20` }}
                  >
                    <step.icon className="w-6 h-6" style={{ color: step.color }} />
                  </div>
                  
                  <h3 className="text-[#FDFDFE] mb-3">
                    {step.title}
                  </h3>
                  <p className="text-[#E3E2E4]/70 text-sm">
                    {step.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <button className="px-10 py-4 bg-gradient-to-r from-[#67EDFC] via-[#5582F3] to-[#A557FA] text-[#060411] rounded-xl hover:shadow-lg hover:shadow-[#67EDFC]/50 transition-all duration-300 hover:scale-105">
            Começar Agora
          </button>
        </div>
      </div>
    </section>
  );
}
