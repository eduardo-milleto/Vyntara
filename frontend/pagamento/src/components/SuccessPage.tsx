import { useEffect, useState } from "react";
import { CheckCircle2, Download, Home, Mail, Package } from "lucide-react";
import logo from "figma:asset/4ecfb6a8e509fe50ceda33711a426fcd6fc6e3ae.png";

export function SuccessPage() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setTimeout(() => setShow(true), 200);
    
    const timer1 = setTimeout(() => {
      const el = document.getElementById('check-icon');
      if (el) el.style.transform = 'scale(1.1)';
    }, 600);
    
    const timer2 = setTimeout(() => {
      const el = document.getElementById('check-icon');
      if (el) el.style.transform = 'scale(1)';
    }, 900);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className={`w-full max-w-2xl transition-all duration-1000 ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        
        {/* Logo */}
        <div className="flex justify-center mb-12 relative">
          <div className="absolute inset-0 blur-3xl bg-[#d4af37] opacity-20 animate-pulse"></div>
          <img 
            src={logo} 
            alt="Venda Sem Limites" 
            className="w-56 h-auto relative z-10 drop-shadow-[0_0_25px_rgba(212,175,55,0.5)]" 
          />
        </div>

        {/* Main Card */}
        <div className="bg-black rounded-3xl shadow-2xl overflow-hidden border border-[#d4af37] relative">
          
          {/* Animated golden top line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent animate-shimmer"></div>
          
          {/* Success Icon with glow */}
          <div className="p-8 border-b border-[#d4af37]/30 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-[#d4af37] rounded-full blur-3xl opacity-40 animate-pulse"></div>
              <div 
                id="check-icon"
                className="relative w-24 h-24 bg-gradient-to-br from-[#d4af37] to-[#f4d03f] rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(212,175,55,0.6)] transition-transform duration-300"
              >
                <CheckCircle2 className="w-14 h-14 text-black" strokeWidth={3} />
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-10 text-center space-y-6">
            
            <div className="space-y-4">
              <div 
                className="inline-block px-6 py-2 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 backdrop-blur-sm"
                style={{
                  boxShadow: '0 0 20px rgba(212,175,55,0.2)'
                }}
              >
                <p 
                  className="text-[#d4af37] text-sm font-semibold uppercase tracking-wider"
                  style={{ 
                    fontFamily: "'Poppins', 'Inter', system-ui, sans-serif",
                    letterSpacing: '0.15em'
                  }}
                >
                  ✓ Sua compra foi confirmada
                </p>
              </div>
              
              <h1 
                className="text-6xl font-black tracking-tight bg-gradient-to-r from-[#d4af37] via-[#f4d03f] to-[#d4af37] bg-clip-text text-transparent mb-4"
                style={{ 
                  fontFamily: "'Poppins', 'Inter', system-ui, -apple-system, sans-serif",
                  letterSpacing: '-0.02em',
                  lineHeight: '1.1'
                }}
              >
                Pagamento Aprovado!
              </h1>
              <p 
                className="text-zinc-200 text-2xl font-light"
                style={{ 
                  fontFamily: "'Poppins', 'Inter', system-ui, sans-serif",
                  letterSpacing: '0.02em'
                }}
              >
                Sua compra foi processada com sucesso
              </p>
            </div>

            {/* Status items */}
            <div className="bg-zinc-900/50 rounded-xl p-8 border border-[#d4af37]/20 backdrop-blur-sm space-y-5">
              
              <div className="flex items-center gap-5 group max-w-md mx-auto">
                <div className="w-12 h-12 bg-[#d4af37]/10 rounded-lg flex items-center justify-center group-hover:bg-[#d4af37]/20 transition-colors flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-[#d4af37]" />
                </div>
                <div className="flex-1 text-left">
                  <p 
                    className="text-zinc-100 font-semibold text-lg mb-1"
                    style={{ fontFamily: "'Poppins', 'Inter', system-ui, sans-serif" }}
                  >
                    Pagamento confirmado
                  </p>
                  <p 
                    className="text-zinc-400 text-base"
                    style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                  >
                    Transação processada com sucesso
                  </p>
                </div>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-[#d4af37]/20 to-transparent"></div>

              <div className="flex items-center gap-5 group max-w-md mx-auto">
                <div className="w-12 h-12 bg-[#d4af37]/10 rounded-lg flex items-center justify-center group-hover:bg-[#d4af37]/20 transition-colors flex-shrink-0">
                  <Package className="w-6 h-6 text-[#d4af37]" />
                </div>
                <div className="flex-1 text-left">
                  <p 
                    className="text-zinc-100 font-semibold text-lg mb-1"
                    style={{ fontFamily: "'Poppins', 'Inter', system-ui, sans-serif" }}
                  >
                    Acesso liberado
                  </p>
                  <p 
                    className="text-zinc-400 text-base"
                    style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                  >
                    Você já pode acessar seu produto
                  </p>
                </div>
              </div>

              <div className="h-px bg-gradient-to-r from-transparent via-[#d4af37]/20 to-transparent"></div>

              <div className="flex items-center gap-5 group max-w-md mx-auto">
                <div className="w-12 h-12 bg-[#d4af37]/10 rounded-lg flex items-center justify-center group-hover:bg-[#d4af37]/20 transition-colors flex-shrink-0">
                  <Mail className="w-6 h-6 text-[#d4af37]" />
                </div>
                <div className="flex-1 text-left">
                  <p 
                    className="text-zinc-100 font-semibold text-lg mb-1"
                    style={{ fontFamily: "'Poppins', 'Inter', system-ui, sans-serif" }}
                  >
                    E-mail enviado
                  </p>
                  <p 
                    className="text-zinc-400 text-base"
                    style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                  >
                    Verifique sua caixa de entrada
                  </p>
                </div>
              </div>

            </div>

            {/* Action Button */}
            <div className="pt-6">
              <button
                disabled
                style={{
                  background: 'linear-gradient(to right, #d4af37, #f0c951)',
                  color: '#000',
                  padding: '0.875rem 1.5rem',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  borderRadius: '0.75rem',
                  boxShadow: '0 0 30px rgba(212,175,55,0.4)',
                  width: '100%',
                  border: 'none',
                  cursor: 'default',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                className="transition-all duration-300 group"
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 0 40px rgba(212,175,55,0.6)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 0 30px rgba(212,175,55,0.4)'}
              >
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.2), transparent)',
                  transform: 'translateX(-200%)',
                  transition: 'transform 700ms'
                }}></div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  position: 'relative',
                  zIndex: 10
                }}>
                  <Package className="w-5 h-5" />
                  <span>Acessar Meu Produto</span>
                </div>
              </button>
            </div>

          </div>

          {/* Animated golden bottom line */}
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent animate-shimmer-reverse"></div>
        
        </div>

        {/* Footer note - Outside card */}
        <div className="mt-6 text-center space-y-4">
          <p className="text-zinc-400 text-base leading-relaxed max-w-md mx-auto">
            Em caso de <span className="text-[#d4af37] font-semibold">evento presencial</span>, entre em contato com a nossa equipe para mais informações após a compra:
          </p>
          <a 
            href="https://wa.me/5551993042514?text=Estou%20com%20d%C3%BAvidas"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#d4af37] hover:bg-[#f0c951] text-black font-semibold rounded-xl transition-all duration-300 hover:shadow-[0_0_25px_rgba(212,175,55,0.5)] hover:scale-105"
            style={{ fontFamily: "'Poppins', 'Inter', system-ui, sans-serif" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Chamar no WhatsApp
          </a>
        </div>

        {/* Decorative blurs */}
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-[#d4af37]/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-[#d4af37]/10 rounded-full blur-3xl pointer-events-none"></div>

      </div>

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes shimmer-reverse {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
        .animate-shimmer-reverse {
          animation: shimmer-reverse 3s infinite;
        }
      `}</style>
    </div>
  );
}
