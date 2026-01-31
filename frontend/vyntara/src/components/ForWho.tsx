import { Briefcase, Scale, Building2, Users, Home, ShieldCheck } from "lucide-react";

const audiences = [
  {
    icon: Briefcase,
    title: "Empresários & Investidores",
    description: "Valide parceiros e investimentos antes de fechar negócio",
    gradient: "from-[#67EDFC] to-[#5582F3]"
  },
  {
    icon: Scale,
    title: "Advogados & Consultores",
    description: "Acelere pesquisas de due diligence para seus clientes",
    gradient: "from-[#5582F3] to-[#A557FA]"
  },
  {
    icon: Building2,
    title: "Fintechs & Compliance",
    description: "Automatize KYC e análise de risco com dados públicos",
    gradient: "from-[#A557FA] to-[#67EDFC]"
  },
  {
    icon: Users,
    title: "Recursos Humanos",
    description: "Background check confiável antes de contratar",
    gradient: "from-[#67EDFC] to-[#A557FA]"
  },
  {
    icon: Home,
    title: "Imobiliárias & Locadores",
    description: "Verifique inquilinos e minimize riscos de inadimplência",
    gradient: "from-[#5582F3] to-[#67EDFC]"
  },
  {
    icon: ShieldCheck,
    title: "Pessoas Físicas",
    description: "Proteja-se antes de confiar, investir ou se relacionar",
    gradient: "from-[#A557FA] to-[#5582F3]"
  }
];

export function ForWho() {
  return (
    <section className="relative py-24 px-4 bg-gradient-to-b from-transparent via-[#190E68]/10 to-transparent">
      {/* Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(103,237,252,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(103,237,252,0.02)_1px,transparent_1px)] bg-[size:48px_48px]"></div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-[#67EDFC]/10 to-[#A557FA]/10 border border-[#67EDFC]/20 mb-4">
            <span className="text-[#67EDFC]">PARA QUEM SERVE</span>
          </div>
          <h2 className="text-[#FDFDFE] mb-4" style={{ fontSize: '2.5rem' }}>
            Inteligência para Todos
          </h2>
          <p className="text-[#E3E2E4]/70 max-w-2xl mx-auto">
            Proteção e segurança para quem precisa tomar decisões importantes
          </p>
        </div>

        {/* Audiences Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {audiences.map((audience, index) => (
            <div
              key={index}
              className="group relative bg-[#060411] border border-[#67EDFC]/10 rounded-2xl p-8 hover:border-[#67EDFC]/30 transition-all duration-300 overflow-hidden"
            >
              {/* Gradient Background on Hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${audience.gradient} opacity-0 group-hover:opacity-[0.02] transition-opacity duration-300`}></div>

              {/* Icon with Gradient */}
              <div className="relative mb-6">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${audience.gradient} p-[2px]`}>
                  <div className="w-full h-full bg-[#060411] rounded-2xl flex items-center justify-center">
                    <audience.icon className="w-8 h-8 text-[#67EDFC]" />
                  </div>
                </div>
              </div>

              {/* Content */}
              <h3 className="text-[#FDFDFE] mb-3">
                {audience.title}
              </h3>
              <p className="text-[#E3E2E4]/70">
                {audience.description}
              </p>

              {/* Hover Effect Border */}
              <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none bg-gradient-to-br ${audience.gradient} blur-xl`} style={{ padding: '1px' }}></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}