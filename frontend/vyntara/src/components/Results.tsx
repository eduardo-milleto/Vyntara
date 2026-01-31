import { Search, ArrowLeft, Loader2, Check, AlertTriangle, Building2, User, FileText, Scale, TrendingUp, Sparkles, ChevronLeft, Volume2, VolumeX, Waves } from "lucide-react";
import { useState, useEffect, useRef } from "react";

interface ResultsProps {
  searchQuery: string;
  onBack: () => void;
  fromImage?: boolean;
}

export function Results({ searchQuery, onBack, fromImage = false }: ResultsProps) {
  const storedReportInitial = localStorage.getItem('vyntaraReport');
  const hasStoredReport = !!storedReportInitial;
  
  const [isLoading, setIsLoading] = useState(!hasStoredReport);
  const [progress, setProgress] = useState(hasStoredReport ? 100 : 0);
  const [currentStep, setCurrentStep] = useState(0);
  const [showResults, setShowResults] = useState(hasStoredReport);
  const [typedText, setTypedText] = useState("");
  const [reportData, setReportData] = useState<any>(() => {
    if (storedReportInitial) {
      try {
        const data = JSON.parse(storedReportInitial);
        localStorage.removeItem('vyntaraReport');
        return data;
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [displayName, setDisplayName] = useState(() => {
    if (storedReportInitial) {
      try {
        const data = JSON.parse(storedReportInitial);
        return data.identifiedName || searchQuery;
      } catch (e) {
        return searchQuery;
      }
    }
    return searchQuery;
  });
  const [htmlReport, setHtmlReport] = useState<string | null>(() => {
    if (storedReportInitial) {
      try {
        const data = JSON.parse(storedReportInitial);
        return data.report?.html || null;
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setVoicesLoaded(true);
      }
    };
    
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const steps = [
    { icon: Search, text: "Buscando em fontes públicas...", delay: 1000 },
    { icon: FileText, text: "Analisando documentos oficiais...", delay: 1500 },
    { icon: Building2, text: "Verificando dados da Receita Federal...", delay: 1200 },
    { icon: Scale, text: "Consultando tribunais e processos...", delay: 1300 },
    { icon: TrendingUp, text: "Compilando informações...", delay: 1000 },
  ];

  useEffect(() => {
    if (hasStoredReport) return;
    
    const totalTime = steps.reduce((acc, step) => acc + step.delay, 0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + (100 / totalTime) * 50;
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (reportData) return;
    
    let currentDelay = 0;
    steps.forEach((step, index) => {
      currentDelay += step.delay;
      setTimeout(() => {
        setCurrentStep(index);
      }, currentDelay);
    });

    setTimeout(() => {
      setIsLoading(false);
      setShowResults(true);
    }, currentDelay + 500);
  }, [reportData]);

  const formatReportText = () => {
    if (!reportData?.report) {
      return `Análise completa para "${displayName}":

📊 DADOS CADASTRAIS
• Pesquisa realizada com sucesso
• Aguardando processamento de dados

⚖️ SITUAÇÃO JUDICIAL
• Verificando tribunais...

💼 VÍNCULOS EMPRESARIAIS
• Analisando vínculos...

✅ CONCLUSÃO
Relatório em processamento.`;
    }

    const r = reportData.report;
    const dc = r.dadosCadastrais || {};
    const sj = r.situacaoJudicial || {};
    const ve = r.vinculosEmpresariais || {};
    const rp = r.registroPublico || {};
    const conc = r.conclusao || {};
    const risk = r.riskScore || {};

    let text = `Análise completa para "${displayName}":\n\n`;

    text += `📊 DADOS CADASTRAIS\n`;
    text += `• Nome: ${dc.nomeCompleto || 'Não identificado'}\n`;
    text += `• CPF/CNPJ: ${dc.cpfCnpjStatus || 'Não verificado'}\n`;
    text += `• Situação Receita: ${dc.situacaoReceita || 'Não verificado'}\n`;
    text += `• Localização: ${dc.enderecoPublico || 'Não identificado'}\n\n`;

    text += `⚖️ SITUAÇÃO JUDICIAL\n`;
    text += `• Total de processos: ${sj.totalProcessos || 0}\n`;
    text += `• Processos estaduais: ${sj.processosEstaduais || 0}\n`;
    text += `• Processos trabalhistas: ${sj.processosTrabalhistas || 0}\n`;
    text += `• Restrições: ${sj.restricoes || 'Sem restrições identificadas'}\n\n`;

    text += `💼 VÍNCULOS EMPRESARIAIS\n`;
    text += `• Empresas ativas: ${ve.empresasAtivas || 0}\n`;
    text += `• Empresas baixadas: ${ve.empresasBaixa || 0}\n`;
    text += `• Capital social total: ${ve.capitalSocialTotal || 'Não identificado'}\n`;
    if (ve.empresas && ve.empresas.length > 0) {
      ve.empresas.slice(0, 3).forEach((emp: any) => {
        text += `  - ${emp.nome} (${emp.situacao})\n`;
      });
    }
    text += '\n';

    text += `🏛️ REGISTRO PÚBLICO\n`;
    text += `• Certidão negativa: ${rp.certidaoNegativa || 'Não verificado'}\n`;
    text += `• Situação cadastral: ${rp.situacaoCadastral || 'Não verificado'}\n`;
    text += `• Última atualização: ${rp.ultimaAtualizacao || 'Não informado'}\n\n`;

    text += `⚠️ AVALIAÇÃO DE RISCO\n`;
    text += `As informações acima são públicas e foram compiladas para sua análise.\n`;
    text += `A avaliação do nível de risco fica a seu critério.\n\n`;

    text += `✅ CONCLUSÃO\n`;
    text += `Perfil de risco: ${conc.perfilRisco || 'BAIXO'}\n`;
    text += `${conc.recomendacao || 'Análise concluída com sucesso.'}\n`;
    if (conc.pontosAtencao && conc.pontosAtencao.length > 0) {
      text += `\nPontos de atenção:\n`;
      conc.pontosAtencao.forEach((p: string) => {
        text += `• ${p}\n`;
      });
    }

    return text;
  };

  useEffect(() => {
    if (showResults) {
      const fullResponse = formatReportText();
      let index = 0;
      const typingInterval = setInterval(() => {
        if (index <= fullResponse.length) {
          setTypedText(fullResponse.slice(0, index));
          index++;
        } else {
          clearInterval(typingInterval);
        }
      }, 15);

      return () => clearInterval(typingInterval);
    }
  }, [showResults, reportData]);

  const generateSmartSummary = () => {
    const nome = displayName
      .toLowerCase()
      .split(' ')
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    if (!reportData?.report) {
      return `Olá! Vou te apresentar o resumo da análise de ${nome}. Infelizmente, não encontramos informações relevantes nas fontes públicas consultadas. Recomendo realizar uma nova pesquisa com dados mais específicos.`;
    }

    const r = reportData.report;
    const dc = r.dadosCadastrais || {};
    const sj = r.situacaoJudicial || {};
    const ve = r.vinculosEmpresariais || {};
    const conc = r.conclusao || {};
    const risk = r.riskScore || {};

    let summary = `Olá! Aqui está o resumo da análise de ${nome}. `;

    const totalProcessos = parseInt(sj.totalProcessos) || 0;
    if (totalProcessos > 0) {
      summary += `Encontramos ${totalProcessos} processo${totalProcessos > 1 ? 's' : ''} judicial${totalProcessos > 1 ? 'is' : ''} registrado${totalProcessos > 1 ? 's' : ''}`;
      if (sj.processosEstaduais > 0 && sj.processosTrabalhistas > 0) {
        summary += `, sendo ${sj.processosEstaduais} estadual${sj.processosEstaduais > 1 ? 'is' : ''} e ${sj.processosTrabalhistas} trabalhista${sj.processosTrabalhistas > 1 ? 's' : ''}. `;
      } else if (sj.processosEstaduais > 0) {
        summary += `, todos na esfera estadual. `;
      } else if (sj.processosTrabalhistas > 0) {
        summary += `, todos trabalhistas. `;
      } else {
        summary += `. `;
      }
    } else {
      summary += `Não foi encontrado nenhum processo judicial em nome dessa pessoa. `;
    }

    const empresasAtivas = parseInt(ve.empresasAtivas) || 0;
    const empresasBaixa = parseInt(ve.empresasBaixa) || 0;
    if (empresasAtivas > 0) {
      summary += `Quanto a vínculos empresariais, ${nome} possui ${empresasAtivas} empresa${empresasAtivas > 1 ? 's' : ''} ativa${empresasAtivas > 1 ? 's' : ''} em seu nome`;
      if (ve.capitalSocialTotal && ve.capitalSocialTotal !== 'Não identificado') {
        summary += `, com capital social total de ${ve.capitalSocialTotal}`;
      }
      summary += `. `;
    } else if (empresasBaixa > 0) {
      summary += `Não há empresas ativas, mas encontramos ${empresasBaixa} empresa${empresasBaixa > 1 ? 's' : ''} baixada${empresasBaixa > 1 ? 's' : ''}. `;
    } else {
      summary += `Não encontramos nenhuma empresa associada a essa pessoa. `;
    }

    if (dc.situacaoReceita && dc.situacaoReceita !== 'Não verificado') {
      summary += `A situação na Receita Federal está ${dc.situacaoReceita.toLowerCase()}. `;
    }

    summary += `Em conclusão, as informações acima foram compiladas a partir de fontes públicas. A avaliação do nível de risco de ${nome} fica a seu critério, considerando o contexto e a finalidade da sua consulta.`;

    return summary;
  };

  const speakReport = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const summary = generateSmartSummary();
    const utterance = new SpeechSynthesisUtterance(summary);
    utterance.lang = 'pt-BR';
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    
    const voices = window.speechSynthesis.getVoices();
    const ptVoice = voices.find(v => v.lang.includes('pt-BR')) || 
                    voices.find(v => v.lang.includes('pt')) ||
                    voices.find(v => v.lang.includes('Portuguese'));
    if (ptVoice) {
      utterance.voice = ptVoice;
    }
    
    utterance.onend = () => {
      setIsSpeaking(false);
    };
    
    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    speechRef.current = utterance;
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSpeaking]);

  return (
    <div className="min-h-screen bg-[#060411] text-[#FDFDFE] relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#67EDFC] rounded-full mix-blend-screen filter blur-[128px] opacity-20 animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-[#A557FA] rounded-full mix-blend-screen filter blur-[128px] opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-[#5582F3] rounded-full mix-blend-screen filter blur-[128px] opacity-20 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="absolute inset-0 bg-[linear-gradient(rgba(103,237,252,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(103,237,252,0.03)_1px,transparent_1px)] bg-[size:64px_64px]"></div>

      <div className="relative z-10 border-b border-[#67EDFC]/10 backdrop-blur-xl bg-[#060411]/80">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="group relative px-6 py-3 bg-gradient-to-br from-[#190E68]/40 to-[#06406E]/40 backdrop-blur-xl border border-[#67EDFC]/30 rounded-xl hover:border-[#67EDFC]/60 transition-all duration-300 hover:scale-105"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#67EDFC] to-[#5582F3] rounded-xl blur opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              <div className="relative flex items-center gap-2 text-[#67EDFC]">
                <ChevronLeft className="w-5 h-5" />
                <span>Nova Investigação</span>
              </div>
            </button>

            <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
              <div className="w-2 h-2 bg-[#67EDFC] rounded-full animate-pulse"></div>
              <span className="text-[#E3E2E4]/80">{isLoading ? 'IA em Análise' : 'Relatório Completo'}</span>
            </div>

            <div className="w-44"></div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="bg-gradient-to-r from-[#67EDFC] via-[#5582F3] to-[#A557FA] bg-clip-text text-transparent" style={{ fontSize: '2.5rem' }}>
            {displayName
              .toLowerCase()
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')}
          </h1>
          {reportData?.empresa && (
            <p className="text-[#E3E2E4]/70 mt-2">{reportData.empresa}</p>
          )}
          {reportData?.source && (
            <p className="text-[#67EDFC]/50 text-sm mt-1">
              Identificado via: {reportData.source === 'vision_web_detection' ? 'Pesquisa reversa de imagem' : 'Análise de IA'}
            </p>
          )}
        </div>

        {isLoading && (
          <div className="space-y-8">
            <div className="relative">
              <div className="h-2 bg-[#190E68]/40 rounded-full overflow-hidden backdrop-blur-xl border border-[#67EDFC]/20">
                <div
                  className="h-full bg-gradient-to-r from-[#67EDFC] via-[#5582F3] to-[#A557FA] transition-all duration-300 ease-out relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                </div>
              </div>
              <div className="mt-2 text-right text-[#67EDFC] text-sm">{Math.round(progress)}%</div>
            </div>

            <div className="space-y-4">
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;

                return (
                  <div
                    key={index}
                    className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-500 ${
                      isActive
                        ? 'bg-gradient-to-br from-[#190E68]/60 to-[#06406E]/60 backdrop-blur-xl border border-[#67EDFC]/40 scale-105'
                        : isCompleted
                        ? 'bg-[#190E68]/20 border border-[#67EDFC]/10'
                        : 'bg-[#190E68]/10 border border-[#67EDFC]/5 opacity-50'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                        isActive
                          ? 'bg-gradient-to-r from-[#67EDFC] to-[#5582F3] shadow-lg shadow-[#67EDFC]/50'
                          : isCompleted
                          ? 'bg-[#67EDFC]/20 border-2 border-[#67EDFC]'
                          : 'bg-[#67EDFC]/10'
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5 text-[#67EDFC]" />
                      ) : isActive ? (
                        <Loader2 className="w-5 h-5 text-[#060411] animate-spin" />
                      ) : (
                        <StepIcon className="w-5 h-5 text-[#67EDFC]/50" />
                      )}
                    </div>
                    <span className={`flex-1 ${isActive ? 'text-[#FDFDFE]' : 'text-[#E3E2E4]'}`}>
                      {step.text}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {showResults && (
          <div className="space-y-6 animate-fadeIn">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#67EDFC] via-[#5582F3] to-[#A557FA] rounded-2xl blur-lg opacity-20"></div>

              <div className="relative bg-gradient-to-br from-[#190E68]/40 to-[#06406E]/40 backdrop-blur-xl border border-[#67EDFC]/30 rounded-2xl p-8">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#67EDFC] to-[#5582F3] flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-6 h-6 text-[#060411]" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-[#FDFDFE] mb-2" style={{ fontSize: '1.5rem' }}>
                      Relatório de Inteligência
                    </h2>
                    <p className="text-[#E3E2E4]/70">
                      {reportData?.report?.sourcesCount ? 
                        `Fontes: ${reportData.report.sourcesCount.cse || 0} web, ${reportData.report.sourcesCount.datajud || 0} judiciais` :
                        'Análise gerada por IA'
                      }
                    </p>
                  </div>
                </div>

                <div className="bg-[#060411]/60 rounded-xl p-6 border border-[#67EDFC]/10">
                  <pre className="whitespace-pre-wrap text-[#E3E2E4] leading-relaxed" style={{ fontFamily: 'monospace', fontSize: '0.95rem' }}>
                    {typedText}
                    {typedText.length < formatReportText().length && (
                      <span className="inline-block w-2 h-5 bg-[#67EDFC] animate-pulse ml-1"></span>
                    )}
                  </pre>
                </div>

                <div className="mt-6 flex gap-4">
                  <button 
                    onClick={speakReport}
                    className={`flex-1 px-6 py-3 font-medium rounded-xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-3 relative overflow-hidden ${
                      isSpeaking 
                        ? 'bg-gradient-to-r from-[#A557FA] via-[#5582F3] to-[#67EDFC] text-[#060411]' 
                        : 'bg-gradient-to-r from-[#67EDFC] via-[#5582F3] to-[#A557FA] text-[#060411] hover:shadow-lg hover:shadow-[#67EDFC]/50'
                    }`}
                  >
                    {isSpeaking ? (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-r from-[#A557FA]/30 via-[#5582F3]/30 to-[#67EDFC]/30 animate-pulse"></div>
                        <div className="relative flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <div className="w-1 h-4 bg-[#060411] rounded-full animate-sound-wave1"></div>
                            <div className="w-1 h-6 bg-[#060411] rounded-full animate-sound-wave2"></div>
                            <div className="w-1 h-3 bg-[#060411] rounded-full animate-sound-wave3"></div>
                            <div className="w-1 h-5 bg-[#060411] rounded-full animate-sound-wave1"></div>
                            <div className="w-1 h-4 bg-[#060411] rounded-full animate-sound-wave2"></div>
                          </div>
                          <span>Clique para Parar</span>
                          <VolumeX className="w-5 h-5" />
                        </div>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-5 h-5" />
                        <span>Ouvir Relatório</span>
                      </>
                    )}
                  </button>
                  <button className="px-6 py-3 bg-[#190E68]/40 text-[#67EDFC] border border-[#67EDFC]/30 rounded-xl hover:bg-[#190E68]/60 transition-all duration-300">
                    Exportar PDF
                  </button>
                </div>
              </div>
            </div>

            <div className="text-center mt-8">
              <button
                onClick={onBack}
                className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-br from-[#190E68]/60 to-[#06406E]/60 backdrop-blur-xl border border-[#67EDFC]/30 rounded-2xl hover:border-[#67EDFC]/60 transition-all duration-300 hover:scale-105"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-[#67EDFC] via-[#5582F3] to-[#A557FA] rounded-2xl blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
                <Sparkles className="relative w-5 h-5 text-[#67EDFC]" />
                <span className="relative text-[#FDFDFE]">Fazer Nova Investigação</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes soundWave1 {
          0%, 100% { height: 0.5rem; }
          50% { height: 1.25rem; }
        }

        @keyframes soundWave2 {
          0%, 100% { height: 1rem; }
          50% { height: 0.5rem; }
        }

        @keyframes soundWave3 {
          0%, 100% { height: 0.75rem; }
          50% { height: 1.5rem; }
        }

        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }

        .animate-sound-wave1 {
          animation: soundWave1 0.4s ease-in-out infinite;
        }

        .animate-sound-wave2 {
          animation: soundWave2 0.5s ease-in-out infinite;
          animation-delay: 0.1s;
        }

        .animate-sound-wave3 {
          animation: soundWave3 0.3s ease-in-out infinite;
          animation-delay: 0.2s;
        }
      `}</style>
    </div>
  );
}
