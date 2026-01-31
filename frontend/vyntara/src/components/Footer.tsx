import { Sparkles, Mail, Linkedin, Twitter } from "lucide-react";
import logo from "figma:asset/cba8d20263dcc09d1045a7b736399ab368c1686f.png";

export function Footer() {
  return (
    <footer className="relative border-t border-[#67EDFC]/10 py-16 px-4">
      {/* Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(103,237,252,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(103,237,252,0.02)_1px,transparent_1px)] bg-[size:48px_48px]"></div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Column */}
          <div className="md:col-span-2">
            <div className="mb-4">
              <img src={logo} alt="VYNTARA" className="h-32 w-auto" />
            </div>
            <p className="text-[#E3E2E4]/70 mb-6 max-w-md">
              Inteligência Pública Unificada. Antes de confiar, negociar, investir ou se relacionar, 
              você merece enxergar a verdade pública sobre quem está do outro lado.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-[#67EDFC]/10 border border-[#67EDFC]/20 flex items-center justify-center hover:bg-[#67EDFC]/20 hover:border-[#67EDFC]/40 transition-all duration-300"
              >
                <Mail className="w-5 h-5 text-[#67EDFC]" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-[#5582F3]/10 border border-[#5582F3]/20 flex items-center justify-center hover:bg-[#5582F3]/20 hover:border-[#5582F3]/40 transition-all duration-300"
              >
                <Linkedin className="w-5 h-5 text-[#5582F3]" />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-lg bg-[#A557FA]/10 border border-[#A557FA]/20 flex items-center justify-center hover:bg-[#A557FA]/20 hover:border-[#A557FA]/40 transition-all duration-300"
              >
                <Twitter className="w-5 h-5 text-[#A557FA]" />
              </a>
            </div>
          </div>

          {/* Links Column */}
          <div>
            <h4 className="text-[#FDFDFE] mb-4">Produto</h4>
            <ul className="space-y-3">
              {["Como Funciona", "Recursos", "Planos", "API", "Documentação"].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-[#E3E2E4]/70 hover:text-[#67EDFC] transition-colors duration-300"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h4 className="text-[#FDFDFE] mb-4">Empresa</h4>
            <ul className="space-y-3">
              {["Sobre", "Blog", "Carreiras", "Contato", "Suporte"].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-[#E3E2E4]/70 hover:text-[#67EDFC] transition-colors duration-300"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="h-[1px] bg-gradient-to-r from-transparent via-[#67EDFC]/20 to-transparent mb-8"></div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-[#E3E2E4]/50 text-sm">
            © 2025 VYNTARA. Todos os direitos reservados.
          </div>
          <div className="flex gap-6 text-sm">
            <a href="#" className="text-[#E3E2E4]/50 hover:text-[#67EDFC] transition-colors duration-300">
              Privacidade
            </a>
            <a href="#" className="text-[#E3E2E4]/50 hover:text-[#67EDFC] transition-colors duration-300">
              Termos de Uso
            </a>
            <a href="#" className="text-[#E3E2E4]/50 hover:text-[#67EDFC] transition-colors duration-300">
              LGPD
            </a>
          </div>
        </div>

        {/* Tagline */}
        <div className="text-center mt-12">
          <p className="text-[#E3E2E4]/40 text-sm italic">
            Sua Inteligência Pública.
          </p>
        </div>
      </div>
    </footer>
  );
}