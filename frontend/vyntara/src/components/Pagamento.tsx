import { useState, useEffect } from "react";
import { ArrowLeft, Copy, Check, Loader2, CheckCircle, CreditCard, Smartphone, Lock } from "lucide-react";

declare global {
  interface Window {
    MercadoPago: any;
  }
}

interface PagamentoProps {
  nome: string;
  email: string;
  telefone: string;
  onBack: () => void;
  onSuccess: (pedidoId: string) => void;
}

export function Pagamento({ nome, email, telefone, onBack, onSuccess }: PagamentoProps) {
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("pix");
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState("");
  const [qrCodeBase64, setQrCodeBase64] = useState("");
  const [pedidoId, setPedidoId] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "waiting" | "approved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cpf, setCpf] = useState("");
  const [mp, setMp] = useState<any>(null);
  const [detectedBrand, setDetectedBrand] = useState<string | null>(null);
  const [detectedPaymentMethodId, setDetectedPaymentMethodId] = useState<string | null>(null);
  const [detectedIssuerId, setDetectedIssuerId] = useState<string | null>(null);

  useEffect(() => {
    const initMP = async () => {
      try {
        const apiUrl = 'https://vendassemlimite.com.br/api/pagamento/public-key';
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        const script = document.createElement('script');
        script.src = 'https://sdk.mercadopago.com/js/v2';
        script.async = true;
        script.onload = () => {
          if (window.MercadoPago) {
            const mpInstance = new window.MercadoPago(data.public_key, { locale: 'pt-BR' });
            setMp(mpInstance);
          }
        };
        document.body.appendChild(script);
      } catch (error) {
        console.error('Erro ao inicializar Mercado Pago:', error);
      }
    };
    
    initMP();
  }, []);

  useEffect(() => {
    if (status === "waiting" && pedidoId) {
      const interval = setInterval(async () => {
        try {
          const response = await fetch(`https://vendassemlimite.com.br/api/vyntara/verificar-pagamento/${pedidoId}`);
          const data = await response.json();
          if (data.status === 'completed' || data.status === 'approved') {
            setStatus("approved");
            clearInterval(interval);
            setTimeout(() => onSuccess(pedidoId), 2000);
          }
        } catch (error) {
          console.error('Erro ao verificar pagamento:', error);
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [status, pedidoId, onSuccess]);

  const formatCardNumber = (value: string) => {
    const nums = value.replace(/\D/g, '');
    return nums.replace(/(\d{4})(?=\d)/g, '$1 ').substring(0, 19);
  };

  const formatExpiry = (value: string) => {
    const nums = value.replace(/\D/g, '');
    if (nums.length <= 2) return nums;
    return `${nums.slice(0, 2)}/${nums.slice(2, 4)}`;
  };

  const formatCpf = (value: string) => {
    const nums = value.replace(/\D/g, '');
    if (nums.length <= 3) return nums;
    if (nums.length <= 6) return `${nums.slice(0, 3)}.${nums.slice(3)}`;
    if (nums.length <= 9) return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6)}`;
    return `${nums.slice(0, 3)}.${nums.slice(3, 6)}.${nums.slice(6, 9)}-${nums.slice(9, 11)}`;
  };

  const [cardBrandIcon, setCardBrandIcon] = useState<string | null>(null);
  const [cardBrandName, setCardBrandName] = useState<string | null>(null);

  useEffect(() => {
    const fetchCardInfo = async () => {
      const cleanNumber = cardNumber.replace(/\s/g, '');
      
      if (!mp || cleanNumber.length < 6) {
        setDetectedBrand(null);
        setDetectedPaymentMethodId(null);
        setDetectedIssuerId(null);
        setCardBrandIcon(null);
        setCardBrandName(null);
        return;
      }

      try {
        const bin = cleanNumber.substring(0, 6);
        const paymentMethods = await mp.getPaymentMethods({ bin });
        
        if (paymentMethods?.results?.[0]) {
          const paymentMethod = paymentMethods.results[0];
          setDetectedPaymentMethodId(paymentMethod.id);
          setDetectedBrand(paymentMethod.id);
          
          if (paymentMethod.secure_thumbnail) {
            setCardBrandIcon(paymentMethod.secure_thumbnail);
            setCardBrandName(paymentMethod.name);
          } else if (paymentMethod.thumbnail) {
            setCardBrandIcon(paymentMethod.thumbnail);
            setCardBrandName(paymentMethod.name);
          }
          
          const issuers = await mp.getIssuers({ paymentMethodId: paymentMethod.id, bin });
          if (issuers?.[0]) {
            setDetectedIssuerId(issuers[0].id);
          }
        }
      } catch (error) {
        console.log('Erro ao detectar bandeira:', error);
      }
    };

    fetchCardInfo();
  }, [cardNumber, mp]);

  const handleCardNumberChange = (value: string) => {
    const formatted = formatCardNumber(value);
    setCardNumber(formatted);
  };

  const generatePix = async () => {
    try {
      setLoading(true);
      setStatus("loading");
      const response = await fetch('https://vendassemlimite.com.br/api/vyntara/gerar-pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, telefone })
      });
      const data = await response.json();
      if (data.success && data.qr_code) {
        setQrCode(data.qr_code);
        setQrCodeBase64(data.qr_code_base64);
        setPedidoId(data.pedido_id.toString());
        setPaymentId(data.payment_id.toString());
        setStatus("waiting");
      } else {
        setErrorMsg(data.error || 'Erro ao gerar PIX');
        setStatus("error");
      }
    } catch (error) {
      setErrorMsg('Erro de conexão');
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const processCardPayment = async () => {
    if (!mp) {
      setErrorMsg('SDK do Mercado Pago não carregado');
      return;
    }

    const cpfNums = cpf.replace(/\D/g, '');
    if (!cardNumber || !cardName || !cardExpiry || !cardCvv || cpfNums.length !== 11) {
      setErrorMsg('Preencha todos os campos corretamente');
      return;
    }

    try {
      setLoading(true);
      setStatus("loading");

      const [expMonth, expYear] = cardExpiry.split('/');
      const cardData = {
        cardNumber: cardNumber.replace(/\s/g, ''),
        cardholderName: cardName.toUpperCase(),
        cardExpirationMonth: expMonth,
        cardExpirationYear: '20' + expYear,
        securityCode: cardCvv,
        identificationType: 'CPF',
        identificationNumber: cpfNums
      };

      const token = await mp.createCardToken(cardData);

      const response = await fetch('https://vendassemlimite.com.br/api/vyntara/processar-cartao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome,
          email,
          telefone,
          cpf: cpfNums,
          card_token: token.id,
          payment_method_id: detectedPaymentMethodId || token.payment_method?.id || 'visa',
          issuer_id: detectedIssuerId
        })
      });

      const data = await response.json();
      if (data.success) {
        setPedidoId(data.pedido_id.toString());
        if (data.status === 'approved') {
          setStatus("approved");
          setTimeout(() => onSuccess(data.pedido_id.toString()), 2000);
        } else {
          setStatus("waiting");
        }
      } else {
        setErrorMsg(data.error || 'Erro ao processar cartão');
        setStatus("error");
      }
    } catch (error: any) {
      console.error('Erro:', error);
      setErrorMsg(error.message || 'Erro ao processar cartão');
      setStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const copyPixCode = async () => {
    try {
      await navigator.clipboard.writeText(qrCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      console.error('Erro ao copiar:', error);
    }
  };

  const handleSubmit = () => {
    if (paymentMethod === "pix") {
      generatePix();
    } else {
      processCardPayment();
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '0.875rem 1rem',
    background: '#1a1a2e',
    border: '1px solid rgba(103, 237, 252, 0.3)',
    borderRadius: '0.5rem',
    color: '#FFFFFF',
    fontSize: '1rem',
    outline: 'none'
  };

  const labelStyle = {
    display: 'block',
    color: '#E3E2E4',
    fontSize: '0.875rem',
    marginBottom: '0.5rem',
    fontWeight: 500
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#060411',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: '25%',
        left: '25%',
        width: '384px',
        height: '384px',
        background: '#67EDFC',
        borderRadius: '50%',
        filter: 'blur(128px)',
        opacity: 0.2
      }}></div>
      <div style={{
        position: 'absolute',
        bottom: '25%',
        right: '25%',
        width: '384px',
        height: '384px',
        background: '#A557FA',
        borderRadius: '50%',
        filter: 'blur(128px)',
        opacity: 0.2
      }}></div>

      <button
        onClick={onBack}
        style={{
          position: 'fixed',
          top: '1.5rem',
          left: '1.5rem',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1rem',
          background: 'linear-gradient(135deg, rgba(25, 14, 104, 0.8), rgba(6, 64, 110, 0.8))',
          border: '1px solid rgba(103, 237, 252, 0.3)',
          borderRadius: '0.75rem',
          color: '#67EDFC',
          cursor: 'pointer',
          fontWeight: 500
        }}
      >
        <ArrowLeft style={{ width: '20px', height: '20px' }} />
        <span>Voltar</span>
      </button>

      <div style={{
        position: 'relative',
        zIndex: 10,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '480px',
          background: 'linear-gradient(135deg, rgba(25, 14, 104, 0.95), rgba(6, 64, 110, 0.95))',
          border: '1px solid rgba(103, 237, 252, 0.4)',
          borderRadius: '1.5rem',
          padding: '1.5rem',
          boxShadow: '0 0 60px rgba(103, 237, 252, 0.2)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              background: 'linear-gradient(90deg, #67EDFC, #5582F3, #A557FA)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '0.25rem'
            }}>
              Finalizar Pagamento
            </h2>
            <p style={{ color: 'rgba(227, 226, 228, 0.7)', fontSize: '0.9rem' }}>
              Análise OSINT para <span style={{ color: '#67EDFC' }}>{nome}</span>
            </p>
          </div>

          <div style={{
            background: 'rgba(103, 237, 252, 0.1)',
            border: '1px solid rgba(103, 237, 252, 0.3)',
            borderRadius: '0.75rem',
            padding: '0.75rem',
            marginBottom: '1.25rem',
            textAlign: 'center'
          }}>
            <div style={{ color: '#67EDFC', fontSize: '0.8rem' }}>Valor</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#FFFFFF' }}>R$ 19,90</div>
          </div>

          {status === "idle" && (
            <>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <button
                  onClick={() => setPaymentMethod("pix")}
                  style={{
                    flex: 1,
                    padding: '0.875rem',
                    background: paymentMethod === "pix" ? 'rgba(103, 237, 252, 0.2)' : 'rgba(6, 4, 17, 0.5)',
                    border: `2px solid ${paymentMethod === "pix" ? '#67EDFC' : 'rgba(103, 237, 252, 0.2)'}`,
                    borderRadius: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <Smartphone style={{ width: '24px', height: '24px', color: paymentMethod === "pix" ? '#67EDFC' : '#E3E2E4' }} />
                  <span style={{ color: paymentMethod === "pix" ? '#67EDFC' : '#E3E2E4', fontWeight: 500 }}>PIX</span>
                </button>
                <button
                  onClick={() => setPaymentMethod("card")}
                  style={{
                    flex: 1,
                    padding: '0.875rem',
                    background: paymentMethod === "card" ? 'rgba(103, 237, 252, 0.2)' : 'rgba(6, 4, 17, 0.5)',
                    border: `2px solid ${paymentMethod === "card" ? '#67EDFC' : 'rgba(103, 237, 252, 0.2)'}`,
                    borderRadius: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <CreditCard style={{ width: '24px', height: '24px', color: paymentMethod === "card" ? '#67EDFC' : '#E3E2E4' }} />
                  <span style={{ color: paymentMethod === "card" ? '#67EDFC' : '#E3E2E4', fontWeight: 500 }}>Cartão</span>
                </button>
              </div>

              {paymentMethod === "card" && (
                <div style={{
                  background: 'rgba(6, 4, 17, 0.5)',
                  border: '1px solid rgba(103, 237, 252, 0.2)',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <CreditCard style={{ width: '20px', height: '20px', color: '#67EDFC' }} />
                    <span style={{ color: '#67EDFC', fontWeight: 600 }}>Dados do Cartão</span>
                  </div>

                  <div style={{ marginBottom: '0.875rem' }}>
                    <label style={labelStyle}>Número do Cartão *</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => handleCardNumberChange(e.target.value)}
                        placeholder="0000 0000 0000 0000"
                        maxLength={19}
                        style={{ ...inputStyle, paddingRight: '120px' }}
                      />
                      <div style={{ 
                        position: 'absolute', 
                        right: '0.75rem', 
                        top: '50%', 
                        transform: 'translateY(-50%)', 
                        display: 'flex', 
                        alignItems: 'center',
                        gap: '6px' 
                      }}>
                        {cardBrandName ? (
                          cardBrandName.toLowerCase().includes('visa') ? (
                            <img src="/logos/visa.webp" alt="Visa" style={{ height: '28px', width: 'auto' }} />
                          ) : cardBrandName.toLowerCase().includes('master') ? (
                            <img src="/logos/mastercard.webp" alt="Mastercard" style={{ height: '28px', width: 'auto' }} />
                          ) : cardBrandName.toLowerCase().includes('amex') || cardBrandName.toLowerCase().includes('american') ? (
                            <img src="/logos/amex.png" alt="Amex" style={{ height: '32px', width: 'auto' }} />
                          ) : cardBrandName.toLowerCase().includes('elo') ? (
                            <img src="/logos/elo.png" alt="Elo" style={{ height: '28px', width: 'auto' }} />
                          ) : cardBrandName.toLowerCase().includes('hipercard') ? (
                            <img src="/logos/hipercard.png" alt="Hipercard" style={{ height: '28px', width: 'auto' }} />
                          ) : (
                            <img src={cardBrandIcon || ''} alt={cardBrandName} style={{ height: '28px', width: 'auto' }} />
                          )
                        ) : (
                          <>
                            <img src="/logos/visa.webp" alt="Visa" style={{ height: '22px', width: 'auto' }} />
                            <img src="/logos/mastercard.webp" alt="Mastercard" style={{ height: '22px', width: 'auto' }} />
                            <img src="/logos/amex.png" alt="Amex" style={{ height: '26px', width: 'auto' }} />
                            <img src="/logos/elo.png" alt="Elo" style={{ height: '22px', width: 'auto' }} />
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '0.875rem' }}>
                    <label style={labelStyle}>Nome no Cartão *</label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value.toUpperCase())}
                      placeholder="NOME COMPLETO"
                      style={inputStyle}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.875rem' }}>
                    <div>
                      <label style={labelStyle}>Validade *</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                        placeholder="MM/AA"
                        maxLength={5}
                        style={inputStyle}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>CVV *</label>
                      <input
                        type="text"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').substring(0, 4))}
                        placeholder="123"
                        maxLength={4}
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '0.5rem' }}>
                    <label style={labelStyle}>CPF *</label>
                    <input
                      type="text"
                      value={cpf}
                      onChange={(e) => setCpf(formatCpf(e.target.value))}
                      placeholder="000.000.000-00"
                      maxLength={14}
                      style={inputStyle}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
                    <Lock style={{ width: '14px', height: '14px', color: 'rgba(227, 226, 228, 0.5)' }} />
                    <span style={{ color: 'rgba(227, 226, 228, 0.5)', fontSize: '0.75rem' }}>
                      Seus dados estão protegidos com criptografia SSL
                    </span>
                  </div>
                </div>
              )}

              {errorMsg && (
                <div style={{ color: '#EF4444', textAlign: 'center', marginBottom: '1rem', fontSize: '0.9rem' }}>
                  {errorMsg}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '1rem',
                  background: 'linear-gradient(90deg, #67EDFC, #5582F3, #A557FA)',
                  color: '#060411',
                  fontWeight: 'bold',
                  borderRadius: '0.75rem',
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontSize: '1rem',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? (
                  <>
                    <Loader2 style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} />
                    Processando...
                  </>
                ) : (
                  <>
                    <Lock style={{ width: '18px', height: '18px' }} />
                    {paymentMethod === "pix" ? "Gerar QR Code PIX" : "Confirmar Compra"}
                  </>
                )}
              </button>
            </>
          )}

          {status === "loading" && (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <Loader2 style={{ width: '48px', height: '48px', color: '#67EDFC', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
              <p style={{ color: '#67EDFC' }}>
                {paymentMethod === "pix" ? "Gerando QR Code PIX..." : "Processando pagamento..."}
              </p>
            </div>
          )}

          {status === "waiting" && paymentMethod === "pix" && qrCodeBase64 && (
            <>
              <div style={{
                background: '#FFFFFF',
                borderRadius: '0.75rem',
                padding: '1rem',
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '1rem'
              }}>
                <img 
                  src={`data:image/png;base64,${qrCodeBase64}`} 
                  alt="QR Code PIX"
                  style={{ width: '180px', height: '180px' }}
                />
              </div>

              <div style={{
                background: 'rgba(6, 4, 17, 0.5)',
                border: '1px solid rgba(103, 237, 252, 0.2)',
                borderRadius: '0.5rem',
                padding: '0.75rem',
                marginBottom: '0.75rem'
              }}>
                <p style={{ color: 'rgba(227, 226, 228, 0.6)', fontSize: '0.7rem', marginBottom: '0.25rem' }}>
                  Código PIX (Copia e Cola)
                </p>
                <p style={{ color: '#E3E2E4', fontSize: '0.65rem', wordBreak: 'break-all', lineHeight: 1.3 }}>
                  {qrCode.substring(0, 60)}...
                </p>
              </div>

              <button
                onClick={copyPixCode}
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  background: copied ? 'linear-gradient(90deg, #10B981, #059669)' : 'linear-gradient(90deg, #67EDFC, #5582F3, #A557FA)',
                  color: copied ? '#FFFFFF' : '#060411',
                  fontWeight: 'bold',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                {copied ? <><Check style={{ width: '18px', height: '18px' }} />Copiado!</> : <><Copy style={{ width: '18px', height: '18px' }} />Copiar Código PIX</>}
              </button>

              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                background: 'rgba(103, 237, 252, 0.05)',
                borderRadius: '0.5rem',
                border: '1px solid rgba(103, 237, 252, 0.2)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    background: '#67EDFC',
                    borderRadius: '50%',
                    animation: 'pulse 1.5s ease-in-out infinite'
                  }}></div>
                  <span style={{ color: '#67EDFC', fontSize: '0.85rem', fontWeight: 500 }}>
                    Aguardando pagamento...
                  </span>
                </div>
              </div>
            </>
          )}

          {status === "waiting" && paymentMethod === "card" && (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <Loader2 style={{ width: '48px', height: '48px', color: '#67EDFC', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
              <p style={{ color: '#67EDFC' }}>Aguardando confirmação do cartão...</p>
            </div>
          )}

          {status === "approved" && (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <CheckCircle style={{ width: '56px', height: '56px', color: '#10B981', margin: '0 auto 1rem' }} />
              <h3 style={{ color: '#10B981', fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                Pagamento Aprovado!
              </h3>
              <p style={{ color: 'rgba(227, 226, 228, 0.8)', fontSize: '0.9rem' }}>
                Redirecionando...
              </p>
            </div>
          )}

          {status === "error" && (
            <div style={{ textAlign: 'center', padding: '1.5rem' }}>
              <p style={{ color: '#EF4444', marginBottom: '1rem' }}>{errorMsg}</p>
              <button
                onClick={() => { setStatus("idle"); setErrorMsg(""); }}
                style={{
                  padding: '0.75rem 2rem',
                  background: 'linear-gradient(90deg, #67EDFC, #A557FA)',
                  color: '#060411',
                  fontWeight: 'bold',
                  borderRadius: '0.5rem',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Tentar Novamente
              </button>
            </div>
          )}

        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
