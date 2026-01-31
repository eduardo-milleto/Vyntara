import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Copy, Check, QrCode, Loader2 } from "lucide-react";

interface DadosIniciais {
  nome: string;
  email: string;
  telefone: string;
}

interface PixFormProps {
  amount: number;
  produtoId: number;
  dadosIniciais?: DadosIniciais;
}

export function PixForm({ amount, produtoId, dadosIniciais }: PixFormProps) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [nomeCompleto, setNomeCompleto] = useState(dadosIniciais?.nome || "");
  const [email, setEmail] = useState(dadosIniciais?.email || "");
  const [cpf, setCpf] = useState("");
  const [telefone, setTelefone] = useState(dadosIniciais?.telefone || "");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [pixData, setPixData] = useState<{qr_code: string; qr_code_base64: string; payment_id: string} | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);

  React.useEffect(() => {
    if (dadosIniciais) {
      if (dadosIniciais.nome) setNomeCompleto(dadosIniciais.nome);
      if (dadosIniciais.email) setEmail(dadosIniciais.email);
      if (dadosIniciais.telefone) setTelefone(dadosIniciais.telefone);
    }
  }, [dadosIniciais]);

  const formatCPF = (value: string) => {
    const v = value.replace(/\D/g, "");
    if (v.length <= 11) {
      return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    return value;
  };

  const formatTelefone = (value: string) => {
    const v = value.replace(/\D/g, "");
    if (v.length <= 11) {
      return v.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
    return value;
  };

  const copyToClipboard = () => {
    if (pixData) {
      navigator.clipboard.writeText(pixData.qr_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeCompleto || !email || !cpf || !telefone || !cidade || !estado) {
      alert('Por favor, preencha todos os campos');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/pagamento/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          produto_id: produtoId,
          payer: {
            nome: nomeCompleto,
            email: email,
            cpf: cpf.replace(/\D/g, ''),
            telefone: telefone.replace(/\D/g, ''),
            endereco: {
              cidade: cidade,
              estado: estado
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao criar pagamento PIX');
      }

      const data = await response.json();
      setPixData({
        qr_code: data.qr_code,
        qr_code_base64: data.qr_code_base64,
        payment_id: data.payment_id
      });
      setShowForm(false);
      
      // Iniciar verificação automática do pagamento
      startPaymentPolling(data.payment_id);
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      alert('Erro ao processar pagamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const startPaymentPolling = (paymentId: string) => {
    let attempts = 0;
    const maxAttempts = 60; // 5 minutos (60 x 5 segundos)

    const interval = setInterval(async () => {
      attempts++;
      
      if (attempts > maxAttempts) {
        clearInterval(interval);
        setCheckingPayment(false);
        return;
      }

      try {
        setCheckingPayment(true);
        const response = await fetch(`/api/pagamento/status/${paymentId}`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.status === 'approved') {
            clearInterval(interval);
            // Redirecionar para página de sucesso
            window.location.href = '/pagamento/sucesso';
          }
        }
      } catch (error) {
        console.error('Erro ao verificar status:', error);
      }
    }, 5000); // Verificar a cada 5 segundos
  };

  if (showForm) {
    return (
      <form onSubmit={handleFormSubmit} className="space-y-6">
        {/* Dados Pessoais */}
        <div className="border-b border-zinc-800 pb-4">
          <h3 className="text-[#d4af37] font-semibold mb-3">Dados Pessoais</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="nomeCompleto" className="text-zinc-300">Nome Completo *</Label>
              <Input id="nomeCompleto" type="text" placeholder="Seu nome completo" value={nomeCompleto} onChange={(e) => setNomeCompleto(e.target.value)} className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-[#d4af37] focus:ring-[#d4af37] focus:ring-1 transition-all duration-300" required />
            </div>
            <div>
              <Label htmlFor="email" className="text-zinc-300">E-mail *</Label>
              <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-[#d4af37] focus:ring-[#d4af37] focus:ring-1 transition-all duration-300" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cpf" className="text-zinc-300">CPF *</Label>
                <Input id="cpf" type="text" placeholder="000.000.000-00" maxLength={14} value={cpf} onChange={(e) => setCpf(formatCPF(e.target.value))} className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-[#d4af37] focus:ring-[#d4af37] focus:ring-1 transition-all duration-300" required />
              </div>
              <div>
                <Label htmlFor="telefone" className="text-zinc-300">Telefone *</Label>
                <Input id="telefone" type="text" placeholder="(00) 00000-0000" maxLength={15} value={telefone} onChange={(e) => setTelefone(formatTelefone(e.target.value))} className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-[#d4af37] focus:ring-[#d4af37] focus:ring-1 transition-all duration-300" required />
              </div>
            </div>
          </div>
        </div>

        {/* Localização */}
        <div className="border-b border-zinc-800 pb-4">
          <h3 className="text-[#d4af37] font-semibold mb-3">Localização</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cidade" className="text-zinc-300">Cidade *</Label>
              <Input id="cidade" type="text" placeholder="Sua cidade" value={cidade} onChange={(e) => setCidade(e.target.value)} className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-[#d4af37] focus:ring-[#d4af37] focus:ring-1 transition-all duration-300" required />
            </div>
            <div>
              <Label htmlFor="estado" className="text-zinc-300">Estado *</Label>
              <Input id="estado" type="text" placeholder="UF" maxLength={2} value={estado} onChange={(e) => setEstado(e.target.value.toUpperCase())} className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-[#d4af37] focus:ring-[#d4af37] focus:ring-1 transition-all duration-300" required />
            </div>
          </div>
        </div>

        <Button type="submit" disabled={loading} className="w-full bg-[#d4af37] hover:bg-[#f0c951] text-black h-12 shadow-[0_0_30px_rgba(212,175,55,0.4)] hover:shadow-[0_0_40px_rgba(212,175,55,0.6)] transition-all duration-300">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Gerando PIX...
            </>
          ) : (
            'Continuar para PIX'
          )}
        </Button>
      </form>
    );
  }

  if (!pixData) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* QR Code Display */}
      <div className="bg-white rounded-xl p-8 flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.2)]">
        <div className="text-center">
          <img 
            src={`data:image/png;base64,${pixData.qr_code_base64}`}
            alt="QR Code PIX"
            className="mx-auto rounded-lg border-4 border-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.4)]"
            style={{ width: '300px', height: '300px' }}
          />
          <p className="text-zinc-900 mt-4 font-semibold">Escaneie o QR Code acima</p>
        </div>
      </div>

      {/* PIX Instructions */}
      <div className="bg-zinc-950 rounded-lg p-6 border border-[#d4af37]/30">
        <h3 className="text-[#d4af37] mb-4">Como pagar com PIX</h3>
        <ol className="space-y-3 text-zinc-400 text-sm">
          <li className="flex items-start group">
            <span className="bg-[#d4af37] text-black rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0 shadow-[0_0_15px_rgba(212,175,55,0.5)] group-hover:shadow-[0_0_20px_rgba(212,175,55,0.8)] transition-all duration-300">
              1
            </span>
            <span>Abra o app do seu banco e escolha a opção PIX</span>
          </li>
          <li className="flex items-start group">
            <span className="bg-[#d4af37] text-black rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0 shadow-[0_0_15px_rgba(212,175,55,0.5)] group-hover:shadow-[0_0_20px_rgba(212,175,55,0.8)] transition-all duration-300">
              2
            </span>
            <span>Escaneie o QR Code ou copie o código PIX</span>
          </li>
          <li className="flex items-start group">
            <span className="bg-[#d4af37] text-black rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0 shadow-[0_0_15px_rgba(212,175,55,0.5)] group-hover:shadow-[0_0_20px_rgba(212,175,55,0.8)] transition-all duration-300">
              3
            </span>
            <span>Confirme o pagamento no app do seu banco</span>
          </li>
        </ol>
      </div>

      {/* PIX Code */}
      <div>
        <label className="text-zinc-400 text-sm mb-2 block">
          Código PIX Copia e Cola
        </label>
        <div className="flex gap-2">
          <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-500 text-sm overflow-x-auto">
            <code className="break-all">{pixData.qr_code}</code>
          </div>
          <Button
            type="button"
            onClick={copyToClipboard}
            className="bg-[#d4af37] hover:bg-[#f0c951] text-black px-6 shadow-[0_0_20px_rgba(212,175,55,0.4)] hover:shadow-[0_0_30px_rgba(212,175,55,0.6)] transition-all duration-300"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copiar
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Payment Info */}
      <div className="bg-zinc-950 rounded-lg p-4 border border-[#d4af37]/30">
        <div className="flex justify-between items-center">
          <span className="text-zinc-400 text-sm">Valor a pagar</span>
          <span className="text-[#d4af37]">
            R$ {amount.toFixed(2).replace(".", ",")}
          </span>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-zinc-400 text-sm">Aprovação</span>
          <span className="text-zinc-300 text-sm">Instantânea</span>
        </div>
      </div>

      {/* Info sobre aprovação */}
      <div className="bg-[#d4af37]/10 border border-[#d4af37]/30 rounded-lg p-4 text-center">
        {checkingPayment ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-[#d4af37]" />
            <p className="text-zinc-300 text-sm">
              Aguardando confirmação do pagamento...
            </p>
          </div>
        ) : (
          <p className="text-zinc-300 text-sm">
            ⏱️ Assim que o PIX for confirmado, você será redirecionado automaticamente.
          </p>
        )}
      </div>
    </div>
  );
}