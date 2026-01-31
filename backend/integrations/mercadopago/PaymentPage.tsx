import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { CreditCardForm } from "./CreditCardForm";
import { PixForm } from "./PixForm";
import { CreditCard, QrCode, Lock, Loader2 } from "lucide-react";
import logo from "figma:asset/4ecfb6a8e509fe50ceda33711a426fcd6fc6e3ae.png";

interface Produto {
  id: number;
  titulo: string;
  descricao: string;
  preco: number;
  imagem_url?: string;
  slug?: string;
}

interface DadosIniciais {
  nome: string;
  email: string;
  telefone: string;
}

export function PaymentPage() {
  const [produto, setProduto] = useState<Produto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dadosIniciais, setDadosIniciais] = useState<DadosIniciais>({
    nome: "",
    email: "",
    telefone: ""
  });

  useEffect(() => {
    const loadProduto = async () => {
      try {
        // Pegar slug do produto da URL (ex: /pagamento/nome-do-produto)
        const pathname = window.location.pathname;
        const produtoSlug = pathname.split('/').pop();

        if (!produtoSlug || produtoSlug === 'pagamento') {
          setError('Produto não encontrado na URL');
          setLoading(false);
          return;
        }

        // Ler parâmetros da URL (nome, telefone, email)
        const urlParams = new URLSearchParams(window.location.search);
        const nome = urlParams.get('nome') || "";
        const telefone = urlParams.get('telefone') || "";
        const email = urlParams.get('email') || "";
        
        setDadosIniciais({ nome, email, telefone });

        const response = await fetch(`/api/pagamento/produto/${produtoSlug}`);
        if (!response.ok) {
          throw new Error('Produto não encontrado');
        }

        const data = await response.json();
        setProduto(data.produto);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar produto');
      } finally {
        setLoading(false);
      }
    };

    loadProduto();
  }, []);

  if (loading) {
    return (
      <div className="w-full max-w-2xl flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-[#d4af37] animate-spin" />
      </div>
    );
  }

  if (error || !produto) {
    return (
      <div className="w-full max-w-2xl">
        <div className="bg-black rounded-3xl shadow-2xl overflow-hidden border border-red-500 p-8">
          <h1 className="text-red-500 text-2xl mb-4">Erro</h1>
          <p className="text-zinc-400">{error || 'Produto não encontrado'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl">
      {/* Logo with animation */}
      <div className="flex justify-center mb-12 relative">
        <div className="absolute inset-0 blur-3xl bg-[#d4af37] opacity-20 animate-pulse"></div>
        <img 
          src={logo} 
          alt="Venda Sem Limites" 
          className="w-56 h-auto relative z-10 drop-shadow-[0_0_25px_rgba(212,175,55,0.5)] animate-fade-in" 
        />
      </div>

      <div className="bg-black rounded-3xl shadow-2xl overflow-hidden border border-[#d4af37] relative">
        {/* Animated golden lines */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent animate-shimmer"></div>
        
        {/* Header */}
        <div className="p-8 border-b border-[#d4af37]/30 relative">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[#d4af37] mb-2 animate-fade-in">{produto.titulo}</h1>
              <p className="text-zinc-500">{produto.descricao || 'Complete sua compra'}</p>
            </div>
            <div className="text-right bg-[#d4af37]/10 px-6 py-3 rounded-xl border border-[#d4af37]/30">
              <p className="text-zinc-500 text-sm">Valor total</p>
              <p className="text-[#d4af37]">
                R$ {produto.preco.toFixed(2).replace('.', ',')}
              </p>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="p-8">
          <Tabs defaultValue="card" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-zinc-900 p-1 rounded-lg gap-2">
              <TabsTrigger 
                value="card" 
                className="bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 data-[state=active]:bg-[#d4af37] data-[state=active]:text-black data-[state=active]:shadow-[0_0_20px_rgba(212,175,55,0.5)] transition-all duration-300 py-3"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Cartão
              </TabsTrigger>
              <TabsTrigger 
                value="pix"
                className="bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 data-[state=active]:bg-[#d4af37] data-[state=active]:text-black data-[state=active]:shadow-[0_0_20px_rgba(212,175,55,0.5)] transition-all duration-300 py-3"
              >
                <QrCode className="w-4 h-4 mr-2" />
                PIX
              </TabsTrigger>
            </TabsList>

            <TabsContent value="card" className="mt-6">
              <CreditCardForm amount={produto.preco} produtoId={produto.id} dadosIniciais={dadosIniciais} />
            </TabsContent>

            <TabsContent value="pix" className="mt-6">
              <PixForm amount={produto.preco} produtoId={produto.id} dadosIniciais={dadosIniciais} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="bg-zinc-950 p-6 border-t border-zinc-900">
          <div className="flex items-center justify-center gap-2 text-sm">
            <Lock className="w-4 h-4 text-[#d4af37]" />
            <span className="text-[#d4af37]">Todos os pagamentos do Grupo Incomum são processados pelo</span>
            <img 
              src="https://logospng.org/download/mercado-pago/logo-mercado-pago-icone-1024.png" 
              alt="Mercado Pago" 
              className="h-6"
            />
          </div>
        </div>
      </div>
    </div>
  );
}