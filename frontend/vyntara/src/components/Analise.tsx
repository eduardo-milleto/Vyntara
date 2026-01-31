import { useState } from "react";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";

interface AnaliseProps {
  searchQuery: string;
  onBack: () => void;
  onGoToPayment?: (nome: string, email: string, telefone: string) => void;
}

export function Analise({ searchQuery, onBack, onGoToPayment }: AnaliseProps) {
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStep, setSimulationStep] = useState(0);

  const formatTelefone = (value: string) => {
    const nums = value.replace(/\D/g, '');
    if (nums.length <= 2) return nums.length ? `(${nums}` : '';
    if (nums.length <= 7) return `(${nums.slice(0, 2)}) ${nums.slice(2)}`;
    return `(${nums.slice(0, 2)}) ${nums.slice(2, 7)}-${nums.slice(7, 11)}`;
  };

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatTelefone(e.target.value);
    setTelefone(formatted);
  };

  const startSimulationAndPayment = async () => {
    const telefoneNumeros = telefone.replace(/\D/g, '');
    if (!email || telefoneNumeros.length !== 11) {
      alert('Por favor, preencha email e WhatsApp corretamente (11 dígitos com o 9)');
      return;
    }

    setIsSimulating(true);
    
    for (let i = 1; i <= 5; i++) {
      await new Promise(r => setTimeout(r, 800));
      setSimulationStep(i);
    }
    
    await new Promise(r => setTimeout(r, 500));

    if (onGoToPayment) {
      onGoToPayment(searchQuery, email, telefoneNumeros);
    }
  };

  return (
    <div className="min-h-screen bg-[#060411] relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#67EDFC] rounded-full mix-blend-screen filter blur-[128px] opacity-20"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#A557FA] rounded-full mix-blend-screen filter blur-[128px] opacity-20"></div>
      </div>

      <div className="absolute inset-0 bg-[linear-gradient(rgba(103,237,252,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(103,237,252,0.02)_1px,transparent_1px)] bg-[size:64px_64px]"></div>

      <button
        onClick={onBack}
        className="fixed top-4 left-4 md:top-8 md:left-8 z-20 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#190E68]/80 to-[#06406E]/80 border border-[#67EDFC]/30 rounded-xl backdrop-blur-sm hover:border-[#67EDFC]/60 transition-all"
        style={{ color: '#67EDFC' }}
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-medium">Voltar</span>
      </button>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-20">
        <div className="w-full max-w-md mx-auto bg-gradient-to-br from-[#190E68]/90 to-[#06406E]/90 border border-[#67EDFC]/30 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-sm">
          {!isSimulating ? (
            <>
              <h1 className="text-3xl font-bold mb-2" style={{ color: '#FFFFFF' }}>Quase pronto!</h1>
              <p className="mb-8" style={{ color: 'rgba(227, 226, 228, 0.9)' }}>
                Informe seus dados para receber a análise completa sobre{" "}
                <span style={{ color: '#67EDFC', fontWeight: 600 }}>{searchQuery}</span>
              </p>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm mb-2" style={{ color: '#E3E2E4' }}>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full px-4 py-3 rounded-xl focus:outline-none transition-colors"
                    style={{ backgroundColor: '#0a0a1a', border: '1px solid rgba(103, 237, 252, 0.4)', color: '#FFFFFF' }}
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2" style={{ color: '#E3E2E4' }}>WhatsApp</label>
                  <input
                    type="tel"
                    value={telefone}
                    onChange={handleTelefoneChange}
                    placeholder="(51) 98631-7625"
                    maxLength={16}
                    className="w-full px-4 py-3 rounded-xl focus:outline-none transition-colors"
                    style={{ backgroundColor: '#0a0a1a', border: '1px solid rgba(103, 237, 252, 0.4)', color: '#FFFFFF' }}
                  />
                  <p className="text-xs mt-1" style={{ color: 'rgba(103, 237, 252, 0.6)' }}>Formato: (DDD) 9XXXX-XXXX</p>
                </div>
              </div>

              <div className="mt-8 p-4 bg-gradient-to-r from-[#A557FA]/20 to-[#67EDFC]/20 rounded-xl border border-[#A557FA]/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[#E3E2E4]/60 text-sm line-through">R$ 99,90</p>
                    <p className="text-3xl font-bold text-[#67EDFC]">R$ 19,90</p>
                  </div>
                  <div className="text-right">
                    <span className="bg-[#A557FA] text-white text-sm font-bold px-4 py-2 rounded-full">80% OFF</span>
                    <p className="text-[#E3E2E4]/60 text-xs mt-1">Pagamento único</p>
                  </div>
                </div>
              </div>

              <button
                onClick={startSimulationAndPayment}
                className="w-full mt-8 py-4 bg-gradient-to-r from-[#67EDFC] via-[#5582F3] to-[#A557FA] text-[#060411] font-bold rounded-xl hover:shadow-[0_0_30px_rgba(103,237,252,0.5)] transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <Sparkles className="w-5 h-5" />
                Ir para Pagamento
              </button>
            </>
          ) : (
            <div className="text-center py-8">
              <Loader2 className="w-16 h-16 text-[#67EDFC] animate-spin mx-auto mb-6" />
              <h3 className="text-xl font-bold mb-6" style={{ color: '#67EDFC' }}>Analisando dados...</h3>
              <div className="space-y-4 text-left">
                {[
                  "Conectando com fontes públicas...",
                  "Consultando bases de dados judiciais...",
                  "Analisando registros empresariais...",
                  "Verificando situação cadastral...",
                  "Compilando informações..."
                ].map((step, i) => (
                  <div key={i} className={`flex items-center gap-3 ${simulationStep > i ? 'text-[#67EDFC]' : 'text-[#E3E2E4]/40'}`}>
                    {simulationStep > i ? (
                      <div className="w-5 h-5 rounded-full bg-[#67EDFC] flex items-center justify-center">
                        <span className="text-[#060411] text-xs">✓</span>
                      </div>
                    ) : simulationStep === i + 1 ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-current" />
                    )}
                    <span className="text-sm">{step}</span>
                  </div>
                ))}
              </div>
              <p className="text-[#E3E2E4]/60 text-sm mt-6">
                Encontramos dados relevantes! Redirecionando para pagamento...
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-center gap-6 text-[#E3E2E4]/40 text-xs">
          <span>Pagamento seguro</span>
          <span>•</span>
          <span>Dados criptografados</span>
          <span>•</span>
          <span>Garantia de entrega</span>
        </div>
      </div>
    </div>
  );
}
