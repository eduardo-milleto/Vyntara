import React, { useState, useEffect } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { CreditCard, Lock, Loader2, CheckCircle2, Shield, RefreshCw } from "lucide-react";

interface DadosIniciais {
  nome: string;
  email: string;
  telefone: string;
}

interface CreditCardFormProps {
  amount: number;
  produtoId: number;
  dadosIniciais?: DadosIniciais;
}

declare global {
  interface Window {
    MercadoPago: any;
  }
}

export function CreditCardForm({ amount, produtoId, dadosIniciais }: CreditCardFormProps) {
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState(dadosIniciais?.email || "");
  const [nomeCompleto, setNomeCompleto] = useState(dadosIniciais?.nome || "");
  const [telefone, setTelefone] = useState(dadosIniciais?.telefone || "");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [mp, setMp] = useState<any>(null);
  const [installments, setInstallments] = useState(1);
  const [installmentOptions, setInstallmentOptions] = useState<any[]>([]);
  const [cardBrandIcon, setCardBrandIcon] = useState<string | null>(null);
  const [cardBrandName, setCardBrandName] = useState<string | null>(null);

  useEffect(() => {
    // Atualizar campos se dados iniciais mudarem
    if (dadosIniciais) {
      if (dadosIniciais.nome) setNomeCompleto(dadosIniciais.nome);
      if (dadosIniciais.email) setEmail(dadosIniciais.email);
      if (dadosIniciais.telefone) setTelefone(dadosIniciais.telefone);
    }
  }, [dadosIniciais]);

  useEffect(() => {
    // Buscar public key e inicializar Mercado Pago
    const initMP = async () => {
      try {
        // Usar URL raiz do servidor (não relativo ao /pagamento/)
        const apiUrl = window.location.origin + '/api/pagamento/public-key';
        const response = await fetch(apiUrl);
        const data = await response.json();
        const mercadopago = new window.MercadoPago(data.public_key, {
          locale: 'pt-BR'
        });
        setMp(mercadopago);
      } catch (error) {
        console.error('Erro ao inicializar Mercado Pago:', error);
      }
    };

    if (window.MercadoPago) {
      initMP();
    }
  }, []);

  // Buscar opções de parcelamento e ícone da bandeira quando cartão é digitado
  useEffect(() => {
    const fetchCardInfo = async () => {
      const cleanNumber = cardNumber.replace(/\s/g, '');
      
      if (!mp || cleanNumber.length < 6) {
        setInstallmentOptions([]);
        setCardBrandIcon(null);
        setCardBrandName(null);
        return;
      }

      try {
        const bin = cleanNumber.substring(0, 6);
        const paymentMethods = await mp.getPaymentMethods({ bin });
        
        if (paymentMethods?.results?.[0]) {
          const paymentMethod = paymentMethods.results[0];
          const paymentMethodId = paymentMethod.id;
          
          // Capturar ícone da bandeira do Mercado Pago
          if (paymentMethod.secure_thumbnail) {
            setCardBrandIcon(paymentMethod.secure_thumbnail);
            setCardBrandName(paymentMethod.name);
          } else if (paymentMethod.thumbnail) {
            setCardBrandIcon(paymentMethod.thumbnail);
            setCardBrandName(paymentMethod.name);
          }
          
          const issuers = await mp.getIssuers({ paymentMethodId, bin });
          const issuerId = issuers?.[0]?.id;

          const installmentsResult = await mp.getInstallments({
            amount: amount.toString(),
            bin,
            paymentTypeId: 'credit_card'
          });

          if (installmentsResult?.[0]?.payer_costs) {
            setInstallmentOptions(installmentsResult[0].payer_costs);
          }
        }
      } catch (error) {
        console.log('Erro ao buscar info do cartão:', error);
      }
    };

    fetchCardInfo();
  }, [cardNumber, mp, amount]);

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(" ");
    } else {
      return value;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.slice(0, 2) + "/" + v.slice(2, 4);
    }
    return v;
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mp) {
      alert('Erro ao carregar sistema de pagamento. Tente novamente.');
      return;
    }

    try {
      setLoading(true);

      // Extrair mês e ano da validade
      const [month, year] = expiry.split('/');

      if (!month || !year || month.length !== 2 || year.length !== 2) {
        throw new Error('Validade inválida. Use o formato MM/AA');
      }

      const cleanCardNumber = cardNumber.replace(/\s/g, '');

      // Primeiro, identificar o método de pagamento (bin do cartão)
      console.log('🔍 Identificando método de pagamento...');
      let paymentMethodId = null;
      let issuerId = null;

      try {
        const bin = cleanCardNumber.substring(0, 6);
        const paymentMethods = await mp.getPaymentMethods({ bin });
        
        if (paymentMethods && paymentMethods.results && paymentMethods.results.length > 0) {
          paymentMethodId = paymentMethods.results[0].id;
          
          // Buscar issuer se necessário
          if (paymentMethods.results[0].additional_info_needed?.includes('issuer_id')) {
            const issuers = await mp.getIssuers({ paymentMethodId, bin });
            if (issuers && issuers.length > 0) {
              issuerId = issuers[0].id;
            }
          }
          
          console.log('✅ Método de pagamento identificado:', paymentMethodId, 'Issuer:', issuerId);
        }
      } catch (pmError) {
        console.warn('⚠️ Não foi possível identificar método de pagamento automaticamente', pmError);
        // Continua mesmo assim, vai usar o padrão
      }

      // Tokenizar cartão usando Mercado Pago SDK
      const cardData = {
        cardNumber: cleanCardNumber,
        cardholderName: cardName,
        cardExpirationMonth: month,
        cardExpirationYear: `20${year}`,
        securityCode: cvv,
        identificationType: 'CPF',
        identificationNumber: cpf.replace(/\D/g, '')
      };

      console.log('🔐 Criando token do cartão...', { 
        cardNumber: '****' + cleanCardNumber.slice(-4),
        cardholderName: cardName,
        paymentMethod: paymentMethodId
      });

      let token;
      try {
        token = await mp.createCardToken(cardData);
        console.log('✅ Token criado:', { id: token.id, length: token.id?.length });
      } catch (tokenError: any) {
        console.error('❌ Erro ao criar token:', tokenError);
        throw new Error(`Erro ao processar cartão: ${tokenError.message || 'Dados do cartão inválidos'}`);
      }

      if (!token || !token.id) {
        throw new Error('Não foi possível processar os dados do cartão. Verifique os dados e tente novamente.');
      }

      // Usar payment_method_id identificado ou fallback
      const finalPaymentMethodId = paymentMethodId || token.payment_method_id || 'visa';
      const finalIssuerId = issuerId || token.issuer_id || null;

      console.log('💳 Dados finais:', { 
        paymentMethod: finalPaymentMethodId, 
        issuer: finalIssuerId,
        tokenId: token.id.substring(0, 10) + '...'
      });

      // Preparar dados para envio
      const requestBody = {
        produto_id: produtoId,
        card_token: token.id,
        payment_method_id: finalPaymentMethodId,
        issuer_id: finalIssuerId,
        installments: installments,
        payer: {
          email: email,
          identification: {
            type: 'CPF',
            number: cpf.replace(/\D/g, '')
          },
          nome: nomeCompleto,
          telefone: telefone.replace(/\D/g, ''),
          endereco: {
            rua: rua,
            numero: numero,
            complemento: complemento,
            bairro: bairro,
            cidade: cidade,
            estado: estado
          }
        }
      };

      console.log('📤 Enviando para backend...');

      // Enviar token e dados do pagador para o backend (usar URL raiz)
      const apiUrl = window.location.origin + '/api/pagamento/processar-cartao';
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao processar pagamento');
      }

      const data = await response.json();
      
      if (data.status === 'approved') {
        setSuccess(true);
        setTimeout(() => {
          window.location.href = '/pagamento/sucesso';
        }, 2000);
      } else if (data.status === 'pending') {
        alert('Pagamento pendente. Aguarde confirmação.');
      } else {
        throw new Error('Pagamento não aprovado. Verifique os dados do cartão.');
      }
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      alert(error instanceof Error ? error.message : 'Erro ao processar pagamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-12">
        <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4 animate-bounce" />
        <h3 className="text-2xl text-[#d4af37] mb-2">Pagamento Aprovado!</h3>
        <p className="text-zinc-400">Redirecionando...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Card Preview */}
      <div className="bg-gradient-to-br from-zinc-900 to-black rounded-xl p-6 border border-[#d4af37] shadow-[0_0_30px_rgba(212,175,55,0.3)] relative overflow-hidden group">
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#d4af37]/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
        </div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-8">
            <CreditCard className="w-10 h-10 text-[#d4af37] drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]" />
            <div className="text-[#d4af37] text-xs bg-[#d4af37]/20 px-3 py-1 rounded-full">PREMIUM</div>
          </div>
          <div className="mb-6">
            <div className="text-zinc-300 tracking-widest">
              {cardNumber || "•••• •••• •••• ••••"}
            </div>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <div className="text-zinc-500 text-xs mb-1">TITULAR</div>
              <div className="text-zinc-300 text-sm">
                {cardName || "NOME NO CARTÃO"}
              </div>
            </div>
            <div>
              <div className="text-zinc-500 text-xs mb-1">VALIDADE</div>
              <div className="text-zinc-300 text-sm">{expiry || "MM/AA"}</div>
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
              <Label htmlFor="nomeCompleto" className="text-zinc-300">
                Nome Completo *
              </Label>
              <Input
                id="nomeCompleto"
                type="text"
                placeholder="Seu nome completo"
                value={nomeCompleto}
                onChange={(e) => setNomeCompleto(e.target.value)}
                className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-[#d4af37] focus:ring-[#d4af37] focus:ring-1 transition-all duration-300"
                required
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-zinc-300">
                E-mail *
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-[#d4af37] focus:ring-[#d4af37] focus:ring-1 transition-all duration-300"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cpf" className="text-zinc-300">
                  CPF *
                </Label>
                <Input
                  id="cpf"
                  type="text"
                  placeholder="000.000.000-00"
                  maxLength={14}
                  value={cpf}
                  onChange={(e) => setCpf(formatCPF(e.target.value))}
                  className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-[#d4af37] focus:ring-[#d4af37] focus:ring-1 transition-all duration-300"
                  required
                />
              </div>

              <div>
                <Label htmlFor="telefone" className="text-zinc-300">
                  Telefone *
                </Label>
                <Input
                  id="telefone"
                  type="text"
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                  value={telefone}
                  onChange={(e) => setTelefone(formatTelefone(e.target.value))}
                  className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-[#d4af37] focus:ring-[#d4af37] focus:ring-1 transition-all duration-300"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Endereço - Simplificado */}
        <div className="border-b border-zinc-800 pb-4">
          <h3 className="text-[#d4af37] font-semibold mb-3">Localização</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cidade" className="text-zinc-300">
                Cidade *
              </Label>
              <Input
                id="cidade"
                type="text"
                placeholder="Sua cidade"
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-[#d4af37] focus:ring-[#d4af37] focus:ring-1 transition-all duration-300"
                required
              />
            </div>

            <div>
              <Label htmlFor="estado" className="text-zinc-300">
                Estado *
              </Label>
              <Input
                id="estado"
                type="text"
                placeholder="UF"
                maxLength={2}
                value={estado}
                onChange={(e) => setEstado(e.target.value.toUpperCase())}
                className="bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-[#d4af37] focus:ring-[#d4af37] focus:ring-1 transition-all duration-300"
                required
              />
            </div>
          </div>
        </div>

        {/* Dados do Cartão - Estilo Mercado Pago */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-[#009EE3]" />
            <h3 className="text-gray-800 font-semibold">Dados do Cartão</h3>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cardNumber" className="text-gray-700 text-sm font-medium">
                Número do Cartão *
              </Label>
              <div style={{ position: 'relative' }}>
                <Input
                  id="cardNumber"
                  type="text"
                  placeholder="0000 0000 0000 0000"
                  maxLength={19}
                  value={cardNumber}
                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                  className="bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-[#009EE3] focus:ring-[#009EE3] focus:ring-1 transition-all duration-300 h-12"
                  style={{ paddingRight: '140px' }}
                  required
                />
                {/* Card brand icons */}
                <div style={{ 
                  position: 'absolute', 
                  right: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  {cardBrandName ? (
                    /* Show only detected brand with local icon */
                    cardBrandName.toLowerCase().includes('visa') ? (
                      <img src="/logos/visa.webp" alt="Visa" style={{ height: '28px', width: 'auto' }} />
                    ) : cardBrandName.toLowerCase().includes('master') ? (
                      <img src="/logos/mastercard.webp" alt="Mastercard" style={{ height: '28px', width: 'auto' }} />
                    ) : cardBrandName.toLowerCase().includes('amex') || cardBrandName.toLowerCase().includes('american') ? (
                      <img src="/logos/amex.png" alt="Amex" style={{ height: '32px', width: 'auto' }} />
                    ) : cardBrandName.toLowerCase().includes('elo') ? (
                      <img src="/logos/elo.png" alt="Elo" style={{ height: '28px', width: 'auto' }} />
                    ) : (
                      <img src={cardBrandIcon || ''} alt={cardBrandName} style={{ height: '28px', width: 'auto' }} />
                    )
                  ) : (
                    /* Show all brands as placeholder */
                    <>
                      <img src="/logos/visa.webp" alt="Visa" style={{ height: '24px', width: 'auto' }} />
                      <img src="/logos/mastercard.webp" alt="Mastercard" style={{ height: '24px', width: 'auto' }} />
                      <img src="/logos/amex.png" alt="Amex" style={{ height: '28px', width: 'auto' }} />
                      <img src="/logos/elo.png" alt="Elo" style={{ height: '24px', width: 'auto' }} />
                    </>
                  )}
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="cardName" className="text-gray-700 text-sm font-medium">
                Nome no Cartão *
              </Label>
              <Input
                id="cardName"
                type="text"
                placeholder="NOME COMPLETO"
                value={cardName}
                onChange={(e) => setCardName(e.target.value.toUpperCase())}
                className="bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-[#009EE3] focus:ring-[#009EE3] focus:ring-1 transition-all duration-300 h-12"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="expiry" className="text-gray-700 text-sm font-medium">
                  Validade *
                </Label>
                <Input
                  id="expiry"
                  type="text"
                  placeholder="MM/AA"
                  maxLength={5}
                  value={expiry}
                  onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  className="bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-[#009EE3] focus:ring-[#009EE3] focus:ring-1 transition-all duration-300 h-12"
                  required
                />
              </div>
              <div>
                <Label htmlFor="cvv" className="text-gray-700 text-sm font-medium">
                  CVV *
                </Label>
                <Input
                  id="cvv"
                  type="text"
                  placeholder="123"
                  maxLength={4}
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))}
                  className="bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-[#009EE3] focus:ring-[#009EE3] focus:ring-1 transition-all duration-300 h-12"
                  required
                />
              </div>
            </div>

            {/* Parcelamento */}
            <div>
              <Label htmlFor="installments" className="text-gray-700 text-sm font-medium">
                Parcelamento *
              </Label>
              {installmentOptions.length > 0 ? (
                <select
                  id="installments"
                  value={installments}
                  onChange={(e) => setInstallments(Number(e.target.value))}
                  className="w-full h-12 px-3 bg-gray-50 border border-gray-300 text-gray-900 rounded-md focus:border-[#009EE3] focus:ring-[#009EE3] focus:ring-1 transition-all duration-300"
                >
                  {installmentOptions.map((option: any) => (
                    <option key={option.installments} value={option.installments}>
                      {option.installments}x de R$ {option.installment_amount.toFixed(2).replace('.', ',')}
                      {option.installments > 1 && option.installment_rate > 0 && ` (Total: R$ ${option.total_amount.toFixed(2).replace('.', ',')})`}
                      {option.installments === 1 && ' sem juros'}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="w-full h-12 px-3 bg-gray-50 border border-gray-300 text-gray-500 rounded-md flex items-center text-sm">
                  {cardNumber.replace(/\s/g, '').length >= 6 
                    ? 'Carregando opções de parcelamento...' 
                    : 'Digite o número do cartão para ver as opções'}
                </div>
              )}
            </div>

            {/* Segurança inline */}
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
              <Shield className="w-4 h-4 text-green-600" />
              <span className="text-xs text-gray-500">Seus dados estão protegidos com criptografia SSL</span>
            </div>

            {/* Botão Confirmar Compra - Estilo Mercado Pago Oficial */}
            <div className="mt-6 space-y-3">
              <button
                type="submit"
                disabled={loading}
                style={{ backgroundColor: '#009EE3' }}
                className="w-full flex items-center justify-center gap-2 text-white font-medium h-12 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-md border-0 shadow-sm hover:opacity-90"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Confirmar compra</span>
                  </>
                )}
              </button>

              {/* Pagamento protegido por Mercado Pago */}
              <div className="flex flex-col items-center justify-center gap-3 py-4">
                <img 
                  src="/logos/mercado-pago.png" 
                  alt="Mercado Pago" 
                  style={{ height: '120px', width: 'auto' }}
                />
                <span className="text-gray-600 text-sm font-medium">Pagamento protegido por Mercado Pago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
