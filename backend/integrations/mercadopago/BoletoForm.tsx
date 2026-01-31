import React, { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Download, Printer, Calendar, Loader2 } from "lucide-react";

import { useEffect } from "react";

interface DadosIniciais {
  nome: string;
  email: string;
  telefone: string;
}

interface BoletoFormProps {
  amount: number;
  produtoId: number;
  dadosIniciais?: DadosIniciais;
}

export function BoletoForm({ amount, produtoId, dadosIniciais }: BoletoFormProps) {
  const [nomeCompleto, setNomeCompleto] = useState(dadosIniciais?.nome || "");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState(dadosIniciais?.email || "");
  const [telefone, setTelefone] = useState(dadosIniciais?.telefone || "");
  const [rua, setRua] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
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
    return v.slice(0, 11).replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const formatTelefone = (value: string) => {
    const v = value.replace(/\D/g, "");
    if (v.length <= 11) {
      return v.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
    return value;
  };

  const handleGenerateBoleto = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      const response = await fetch('/api/pagamento/criar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          produto_id: produtoId, 
          metodo: 'boleto',
          payer: {
            nome: nomeCompleto,
            email: email,
            cpf: cpf.replace(/\D/g, ''),
            telefone: telefone.replace(/\D/g, ''),
            endereco: {
              rua: rua,
              bairro: bairro,
              cidade: cidade,
              estado: estado
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao criar pagamento');
      }

      const data = await response.json();
      // Redirecionar para página de pagamento do Mercado Pago
      window.location.href = data.init_point;
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      alert('Erro ao processar pagamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 3);
  const dueDateFormatted = dueDate.toLocaleDateString("pt-BR");

  return (
    <form onSubmit={handleGenerateBoleto} className="space-y-6">
      {/* Boleto Info */}
      <div className="bg-gradient-to-br from-zinc-900 to-black rounded-xl p-6 border border-[#d4af37] shadow-[0_0_30px_rgba(212,175,55,0.3)] relative overflow-hidden">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-[#d4af37] mb-2">Boleto Bancário</h3>
            <p className="text-zinc-500 text-sm">
              Pagamento em até 3 dias úteis
            </p>
          </div>
          <div className="bg-[#d4af37] text-black px-4 py-2 rounded-lg shadow-[0_0_20px_rgba(212,175,55,0.5)]">
            <div className="text-xs">VALOR</div>
            <div className="font-mono">R$ {amount.toFixed(2).replace(".", ",")}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="bg-zinc-950 rounded-lg p-3 border border-zinc-800">
            <div className="text-zinc-600 text-xs mb-1">Vencimento</div>
            <div className="text-zinc-300 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#d4af37]" />
              {dueDateFormatted}
            </div>
          </div>
          <div className="bg-zinc-950 rounded-lg p-3 border border-zinc-800">
            <div className="text-zinc-600 text-xs mb-1">Código de Barras</div>
            <div className="text-zinc-300 font-mono text-xs">
              23793.38128 60047.101252...
            </div>
          </div>
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
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

        {/* Endereço */}
        <div className="border-b border-zinc-800 pb-4">
          <h3 className="text-[#d4af37] font-semibold mb-3">Endereço</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rua" className="text-zinc-300">Rua/Avenida *</Label>
              <Input id="rua" type="text" placeholder="Rua exemplo, 123" value={rua} onChange={(e) => setRua(e.target.value)} className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-[#d4af37] focus:ring-[#d4af37] focus:ring-1 transition-all duration-300" required />
            </div>
            <div>
              <Label htmlFor="bairro" className="text-zinc-300">Bairro *</Label>
              <Input id="bairro" type="text" placeholder="Nome do bairro" value={bairro} onChange={(e) => setBairro(e.target.value)} className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-[#d4af37] focus:ring-[#d4af37] focus:ring-1 transition-all duration-300" required />
            </div>
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
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-zinc-950 rounded-lg p-6 border border-[#d4af37]/30">
        <h4 className="text-[#d4af37] mb-3">Instruções de Pagamento</h4>
        <ul className="space-y-2 text-zinc-400 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-[#d4af37] mt-1">•</span>
            <span>O boleto será enviado para o e-mail informado</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#d4af37] mt-1">•</span>
            <span>
              Você também pode imprimir ou salvar em PDF após a geração
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#d4af37] mt-1">•</span>
            <span>
              O pagamento pode ser feito em qualquer banco, lotérica ou app
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#d4af37] mt-1">•</span>
            <span>Prazo de compensação: até 3 dias úteis</span>
          </li>
        </ul>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <Button
          type="submit"
          className="w-full bg-[#d4af37] hover:bg-[#f0c951] text-black h-12 shadow-[0_0_30px_rgba(212,175,55,0.4)] hover:shadow-[0_0_40px_rgba(212,175,55,0.6)] transition-all duration-300 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
          <Download className="w-4 h-4 mr-2 relative z-10" />
          <span className="relative z-10">Gerar Boleto</span>
        </Button>
        
        <Button
          type="button"
          variant="outline"
          className="w-full border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-black h-12 transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,175,55,0.5)]"
          onClick={() => alert("Abrindo visualização para impressão...")}
        >
          <Printer className="w-4 h-4 mr-2" />
          Visualizar para Imprimir
        </Button>
      </div>
    </form>
  );
}