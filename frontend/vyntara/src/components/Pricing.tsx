import { Check, Zap, TrendingUp, Building } from "lucide-react";

const plans = [
  {
    icon: Zap,
    name: "Avulso",
    description: "Para consultas pontuais",
    price: "R$ 49",
    period: "por relatório",
    features: [
      "1 relatório completo",
      "Todas as fontes públicas",
      "IA de interpretação",
      "Download em PDF",
      "Válido por 30 dias"
    ],
    color: "#67EDFC",
    highlight: false
  },
  {
    icon: TrendingUp,
    name: "Mensal",
    description: "Para uso recorrente",
    price: "R$ 299",
    period: "por mês",
    features: [
      "10 relatórios por mês",
      "Histórico de consultas",
      "Alertas de mudanças",
      "Suporte prioritário",
      "API de integração básica"
    ],
    color: "#5582F3",
    highlight: true
  },
  {
    icon: Building,
    name: "Empresarial",
    description: "Para empresas e times",
    price: "Personalizado",
    period: "consulte-nos",
    features: [
      "Consultas ilimitadas",
      "Múltiplos usuários",
      "API completa",
      "White-label disponível",
      "SLA e suporte dedicado"
    ],
    color: "#A557FA",
    highlight: false
  }
];

export function Pricing() {
  return (
    <section className="relative py-24 px-4">
      {/* Background Effect */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#67EDFC] rounded-full mix-blend-screen filter blur-[160px] opacity-10"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#A557FA] rounded-full mix-blend-screen filter blur-[160px] opacity-10"></div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-[#67EDFC]/10 to-[#A557FA]/10 border border-[#67EDFC]/20 mb-4">
            <span className="text-[#67EDFC]">PLANOS</span>
          </div>
          <h2 className="text-[#FDFDFE] mb-4" style={{ fontSize: '2.5rem' }}>
            Escolha seu Plano
          </h2>
          <p className="text-[#E3E2E4]/70 max-w-2xl mx-auto">
            Acesso à inteligência pública para cada necessidade
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative group ${plan.highlight ? 'md:-mt-4 md:mb-4' : ''}`}
            >
              {/* Highlight Badge */}
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-[#67EDFC] to-[#A557FA] text-[#060411] rounded-full text-sm z-10">
                  Mais Popular
                </div>
              )}

              {/* Card */}
              <div
                className={`relative bg-gradient-to-br from-[#190E68]/30 to-[#06406E]/30 backdrop-blur-sm border rounded-3xl p-8 h-full flex flex-col ${
                  plan.highlight
                    ? 'border-[#5582F3] shadow-2xl shadow-[#5582F3]/20'
                    : 'border-[#67EDFC]/10 hover:border-[#67EDFC]/30'
                } transition-all duration-300`}
              >
                {/* Icon */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6"
                  style={{ backgroundColor: `${plan.color}20` }}
                >
                  <plan.icon className="w-7 h-7" style={{ color: plan.color }} />
                </div>

                {/* Plan Info */}
                <div className="mb-6">
                  <h3 className="text-[#FDFDFE] mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-[#E3E2E4]/60 text-sm mb-4">
                    {plan.description}
                  </p>
                  
                  <div className="flex items-baseline gap-2">
                    <span className="text-[#FDFDFE]" style={{ fontSize: '2.5rem' }}>
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className="text-[#E3E2E4]/60">
                        {plan.period}
                      </span>
                    )}
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-3">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: `${plan.color}20` }}
                      >
                        <Check className="w-3 h-3" style={{ color: plan.color }} />
                      </div>
                      <span className="text-[#E3E2E4]/80 text-sm">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  className={`w-full py-4 rounded-xl transition-all duration-300 ${
                    plan.highlight
                      ? 'bg-gradient-to-r from-[#67EDFC] via-[#5582F3] to-[#A557FA] text-[#060411] hover:shadow-lg hover:shadow-[#5582F3]/50 hover:scale-105'
                      : 'bg-[#060411] text-[#FDFDFE] border border-[#67EDFC]/30 hover:border-[#67EDFC] hover:bg-[#67EDFC]/10'
                  }`}
                >
                  {plan.price === "Personalizado" ? "Falar com Vendas" : "Começar Agora"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Trust Note */}
        <div className="text-center mt-12">
          <p className="text-[#E3E2E4]/50 text-sm">
            Todos os planos incluem: 100% dados públicos • Zero dados privados • Conformidade legal total
          </p>
        </div>
      </div>
    </section>
  );
}
