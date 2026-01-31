import { Eye, Link2, Shield, Zap, Brain, Target } from "lucide-react";

const features = [
  {
    icon: Eye,
    title: "Visão Completa",
    description: "Unifica dados de dezenas de fontes públicas em um único lugar",
    color: "#67EDFC"
  },
  {
    icon: Brain,
    title: "IA Interpretativa",
    description: "Inteligência artificial elimina homônimos e interpreta dados jurídicos",
    color: "#5582F3"
  },
  {
    icon: Link2,
    title: "Vínculos Revelados",
    description: "Descubra empresas, sócios e conexões ocultas automaticamente",
    color: "#A557FA"
  },
  {
    icon: Zap,
    title: "Resultados Instantâneos",
    description: "Relatório completo gerado em minutos, não em dias",
    color: "#67EDFC"
  },
  {
    icon: Shield,
    title: "100% Legal",
    description: "Baseado exclusivamente em dados públicos e oficiais",
    color: "#5582F3"
  },
  {
    icon: Target,
    title: "Risco Calculado",
    description: "Indicador de risco público baseado em processos e vínculos",
    color: "#A557FA"
  }
];

export function Features() {
  return (
    <section className="relative py-24 px-4">
      {/* Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(103,237,252,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(103,237,252,0.02)_1px,transparent_1px)] bg-[size:48px_48px]"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-[#67EDFC]/10 to-[#A557FA]/10 border border-[#67EDFC]/20 mb-4">
            <span className="text-[#67EDFC]">RECURSOS</span>
          </div>
          <h2 className="text-[#FDFDFE] mb-4" style={{ fontSize: '2.5rem' }}>
            Due Diligence Pública Reinventada
          </h2>
          <p className="text-[#E3E2E4]/70 max-w-2xl mx-auto">
            Investigação prévia automatizada com IA para revelar quem realmente está do outro lado
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-gradient-to-br from-[#190E68]/20 to-[#06406E]/20 backdrop-blur-sm border border-[#67EDFC]/10 rounded-2xl p-8 hover:border-[#67EDFC]/30 transition-all duration-300 hover:scale-[1.02]"
            >
              {/* Icon */}
              <div 
                className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#190E68]/40 to-[#06406E]/40 border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300"
                style={{ borderColor: `${feature.color}40` }}
              >
                <feature.icon className="w-7 h-7" style={{ color: feature.color }} />
              </div>

              {/* Content */}
              <h3 className="text-[#FDFDFE] mb-3">
                {feature.title}
              </h3>
              <p className="text-[#E3E2E4]/70">
                {feature.description}
              </p>

              {/* Hover Glow */}
              <div 
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity duration-300 blur-xl"
                style={{ background: `radial-gradient(circle at center, ${feature.color}, transparent)` }}
              ></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
