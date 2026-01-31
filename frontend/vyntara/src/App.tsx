import { Hero } from "./components/Hero";
import { Features } from "./components/Features";
import { HowItWorks } from "./components/HowItWorks";
import { ForWho } from "./components/ForWho";
import { Pricing } from "./components/Pricing";
import { Footer } from "./components/Footer";
import { Results } from "./components/Results";
import { Analise } from "./components/Analise";
import { PagamentoConfirmado } from "./components/PagamentoConfirmado";
import { Pagamento } from "./components/Pagamento";
import { useState, useEffect } from "react";

function LoadingScreen() {
  return (
    <>
      <style>{`
        html, body, #root {
          background-color: #060411 !important;
          min-height: 100vh !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        @keyframes loading-bar {
          0% { width: 0%; transform: translateX(0); }
          50% { width: 80%; transform: translateX(10%); }
          100% { width: 100%; transform: translateX(0); }
        }
        .animate-loading-bar {
          animation: loading-bar 2s ease-in-out infinite;
        }
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        .animate-ping-custom {
          animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
      <div className="min-h-screen w-full bg-[#060411] flex flex-col items-center justify-center overflow-hidden relative">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#67EDFC] rounded-full mix-blend-screen filter blur-[128px] opacity-30 animate-pulse"></div>
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-[#A557FA] rounded-full mix-blend-screen filter blur-[128px] opacity-30 animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-[#5582F3] rounded-full mix-blend-screen filter blur-[128px] opacity-30 animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="absolute inset-0 bg-[linear-gradient(rgba(103,237,252,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(103,237,252,0.03)_1px,transparent_1px)] bg-[size:64px_64px]"></div>

        <div className="relative z-10 flex flex-col items-center px-4">
          <div className="relative mb-8">
            <div className="w-24 h-24 rounded-full border-4 border-transparent border-t-[#67EDFC] border-r-[#5582F3] animate-spin"></div>
            <div className="absolute inset-2 w-20 h-20 rounded-full border-4 border-transparent border-b-[#A557FA] border-l-[#5582F3] animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            <div className="absolute inset-4 w-16 h-16 rounded-full border-4 border-transparent border-t-[#67EDFC] animate-spin" style={{ animationDuration: '2s' }}></div>
            <div className="absolute inset-0 w-24 h-24 rounded-full bg-gradient-to-br from-[#67EDFC]/20 to-[#A557FA]/20 animate-pulse"></div>
          </div>

          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-[#67EDFC] via-[#5582F3] to-[#A557FA] bg-clip-text text-transparent animate-pulse">
            Investigando...
          </h2>

          <p className="text-[#E3E2E4]/80 text-lg mb-6 text-center max-w-md">
            Nossa IA está analisando milhões de dados públicos para gerar seu relatório completo
          </p>

          <div className="flex items-center gap-3 text-[#67EDFC] text-sm">
            <div className="relative">
              <div className="w-2 h-2 bg-[#67EDFC] rounded-full"></div>
              <div className="absolute inset-0 bg-[#67EDFC] rounded-full animate-ping-custom"></div>
            </div>
            <span>Processando com inteligência artificial avançada</span>
          </div>

          <div className="mt-12 flex gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-3 h-3 bg-gradient-to-br from-[#67EDFC] to-[#A557FA] rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              ></div>
            ))}
          </div>

          <div className="mt-8 w-64 h-1 bg-[#1a1a2e] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#67EDFC] via-[#5582F3] to-[#A557FA] rounded-full animate-loading-bar"></div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<"home" | "results" | "loading" | "analise" | "pagamento" | "pix">("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [pedidoId, setPedidoId] = useState("");
  const [paymentData, setPaymentData] = useState({ nome: "", email: "", telefone: "" });

  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes('/resultado')) {
      const storedReport = localStorage.getItem('vyntaraReport');
      if (storedReport) {
        try {
          const data = JSON.parse(storedReport);
          setSearchQuery(data.identifiedName || 'Pesquisa por imagem');
          setCurrentPage("results");
        } catch (e) {
          console.error('Erro ao carregar relatório:', e);
        }
      }
    } else if (path.includes('/pagamento-confirmado')) {
      const urlParams = new URLSearchParams(window.location.search);
      const pedido = urlParams.get('pedido');
      if (pedido) {
        setPedidoId(pedido);
        setCurrentPage("pagamento");
      } else {
        window.location.href = '/vyntara';
      }
    } else if (path.includes('/analise')) {
      const storedQuery = localStorage.getItem('vyntaraSearchQuery');
      if (storedQuery) {
        setSearchQuery(storedQuery);
        setCurrentPage("analise");
      } else {
        window.location.href = '/vyntara';
      }
    }
  }, []);

  const handleSearchStart = () => {
    setCurrentPage("loading");
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage("results");
  };

  const handleBack = () => {
    setCurrentPage("home");
    setSearchQuery("");
    localStorage.removeItem('vyntaraSearchQuery');
    window.history.pushState({}, '', '/vyntara/');
  };

  const handleInvestigate = (query: string) => {
    setSearchQuery(query);
    localStorage.setItem('vyntaraSearchQuery', query);
    setCurrentPage("analise");
    window.history.pushState({}, '', '/vyntara/analise');
  };

  const handleGoToPayment = (nome: string, email: string, telefone: string) => {
    setPaymentData({ nome, email, telefone });
    setCurrentPage("pix");
    window.history.pushState({}, '', '/vyntara/pagamento');
  };

  const handlePaymentSuccess = (newPedidoId: string) => {
    setPedidoId(newPedidoId);
    setCurrentPage("pagamento");
    window.history.pushState({}, '', `/vyntara/pagamento-confirmado?pedido=${newPedidoId}`);
  };

  if (currentPage === "loading") {
    return <LoadingScreen />;
  }

  if (currentPage === "results") {
    return <Results searchQuery={searchQuery} onBack={handleBack} />;
  }

  if (currentPage === "analise") {
    return <Analise searchQuery={searchQuery} onBack={handleBack} onGoToPayment={handleGoToPayment} />;
  }

  if (currentPage === "pix") {
    return (
      <Pagamento 
        nome={paymentData.nome} 
        email={paymentData.email} 
        telefone={paymentData.telefone}
        onBack={handleBack}
        onSuccess={handlePaymentSuccess}
      />
    );
  }

  if (currentPage === "pagamento") {
    return <PagamentoConfirmado pedidoId={pedidoId} onBack={handleBack} />;
  }

  return (
    <div className="min-h-screen bg-[#060411]">
      <Hero onSearch={handleSearch} onSearchStart={handleSearchStart} onInvestigate={handleInvestigate} />
      <Features />
      <HowItWorks />
      <ForWho />
      <Pricing />
      <Footer />
    </div>
  );
}
