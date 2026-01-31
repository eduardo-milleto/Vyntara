import { useState, useEffect } from "react";
import { Loader2, CheckCircle, XCircle, ArrowLeft } from "lucide-react";

interface PagamentoConfirmadoProps {
  pedidoId: string;
  onBack: () => void;
}

export function PagamentoConfirmado({ pedidoId, onBack }: PagamentoConfirmadoProps) {
  const [status, setStatus] = useState("loading" as "loading" | "approved" | "pending" | "error");
  const [analise, setAnalise] = useState(null as any);
  const [attempts, setAttempts] = useState(0);
  const MAX_ATTEMPTS = 60;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const checkPayment = async () => {
      try {
        const response = await fetch(`https://vendassemlimite.com.br/api/vyntara/verificar-pagamento/${pedidoId}`);
        const data = await response.json();
        
        if (data.status === 'completed' && data.analise) {
          setStatus("approved");
          setAnalise(data.analise);
          clearInterval(interval);
        } else if (data.status === 'approved' && !data.analise_concluida) {
          setStatus("pending");
        } else if (data.status === 'rejected' || data.status === 'cancelled') {
          setStatus("error");
          clearInterval(interval);
        } else if (data.status === 'pending') {
          setAttempts(prev => prev + 1);
          if (attempts >= MAX_ATTEMPTS) {
            setStatus("error");
            clearInterval(interval);
          }
        } else {
          setAttempts(prev => prev + 1);
          if (attempts >= MAX_ATTEMPTS) {
            setStatus("error");
            clearInterval(interval);
          }
        }
      } catch (error) {
        console.error('Erro ao verificar pagamento:', error);
        setAttempts(prev => prev + 1);
      }
    };

    checkPayment();
    interval = setInterval(checkPayment, 3000);

    return () => clearInterval(interval);
  }, [pedidoId, attempts]);

  const formatAnalise = (data: any) => {
    if (!data) return null;
    
    const report = typeof data === 'string' ? JSON.parse(data) : data;
    return report;
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
        <div className="w-full max-w-2xl mx-auto bg-gradient-to-br from-[#190E68]/90 to-[#06406E]/90 border border-[#67EDFC]/30 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-sm">
          
          {status === "loading" && (
            <div className="text-center py-12">
              <Loader2 className="w-20 h-20 text-[#67EDFC] animate-spin mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#67EDFC' }}>Verificando pagamento...</h2>
              <p className="text-[#E3E2E4]/80 mb-4">
                Estamos confirmando seu pagamento. Isso pode levar alguns segundos.
              </p>
              <p className="text-[#E3E2E4]/60 text-sm">
                Tentativa {attempts + 1} de {MAX_ATTEMPTS}
              </p>
            </div>
          )}

          {status === "pending" && (
            <div className="text-center py-12">
              <Loader2 className="w-20 h-20 text-[#A557FA] animate-spin mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#A557FA' }}>Pagamento aprovado!</h2>
              <p className="text-[#E3E2E4]/80 mb-4">
                Sua análise está sendo gerada pela nossa IA. Este processo pode levar de 1 a 3 minutos...
              </p>
              <div className="flex justify-center gap-2 mt-6">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-3 h-3 bg-gradient-to-br from-[#67EDFC] to-[#A557FA] rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  ></div>
                ))}
              </div>
            </div>
          )}

          {status === "approved" && analise && (
            <div className="py-6">
              <div className="flex flex-col items-center justify-center gap-3 mb-6 text-center">
                <CheckCircle className="w-12 h-12" style={{ color: '#4ade80' }} />
                <h2 className="text-2xl font-bold" style={{ color: '#67EDFC' }}>Análise Concluída!</h2>
              </div>
              
              <div className="bg-[#0a0a1a]/50 rounded-xl p-6 border border-[#67EDFC]/20 max-h-[70vh] overflow-y-auto">
                {(() => {
                  const report = formatAnalise(analise);
                  if (!report) return <p className="text-[#E3E2E4]/60">Erro ao carregar análise</p>;
                  
                  const rj = report.resumoJudicial || report.analiseJudicial || report.situacaoJudicial || {};
                  const pp = report.perfilPessoal || {};
                  const dc = report.dadosCadastrais || {};
                  const cj = report.cronologiaJudicial || {};
                  
                  return (
                    <div className="space-y-6 text-[#E3E2E4]">
                      {report.summary && (
                        <div>
                          <h3 className="text-lg font-bold text-[#67EDFC] mb-2">📌 Resumo Executivo</h3>
                          <p className="text-[#E3E2E4]/90 whitespace-pre-line">{report.summary}</p>
                        </div>
                      )}
                      
                      <div>
                        <h3 className="text-lg font-bold text-[#67EDFC] mb-3">👤 Perfil Detalhado</h3>
                        <div className="space-y-2 text-sm">
                          <p><span className="text-[#E3E2E4]/60">📝 Nome:</span> {pp.nomeCompleto || 'N/A'}</p>
                          {pp.idadeAproximada && pp.idadeAproximada !== 'Não foi possível estimar' && (
                            <p><span className="text-[#E3E2E4]/60">🎂 Idade:</span> {pp.idadeAproximada}</p>
                          )}
                          <p><span className="text-[#E3E2E4]/60">📍 Localização:</span> {pp.localizacao || 'Não identificada'}</p>
                          {pp.profissao && pp.profissao !== 'Não identificada' && (
                            <p><span className="text-[#E3E2E4]/60">💼 Profissão:</span> {pp.profissao}</p>
                          )}
                          {pp.empresaAtual && pp.empresaAtual !== 'Não identificada' && (
                            <p><span className="text-[#E3E2E4]/60">🏢 Empresa:</span> {pp.empresaAtual}</p>
                          )}
                          {pp.empresasRelacionadas && pp.empresasRelacionadas.length > 0 && (
                            <div className="mt-2">
                              <p className="text-[#E3E2E4]/60">🏭 Empresas relacionadas:</p>
                              <ul className="pl-4 mt-1">
                                {pp.empresasRelacionadas.slice(0, 5).map((e: string, i: number) => (
                                  <li key={i}>• {e}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {pp.vinculosIdentificados && pp.vinculosIdentificados !== 'Não identificado' && (
                            <p><span className="text-[#E3E2E4]/60">🔗 Vínculos:</span> {pp.vinculosIdentificados}</p>
                          )}
                          <div className="mt-3 pt-3 border-t border-[#67EDFC]/10">
                            <p className="text-[#E3E2E4]/80 font-medium mb-2">📱 Redes Sociais:</p>
                            {(() => {
                              const rs = pp.redesSociais || {};
                              const temRede = (rs.linkedin && rs.linkedin !== 'Não encontrado') || 
                                             (rs.instagram && rs.instagram !== 'Não encontrado') || 
                                             (rs.facebook && rs.facebook !== 'Não encontrado');
                              if (!temRede) return <p className="pl-4 text-[#E3E2E4]/60">Nenhuma rede social encontrada</p>;
                              return (
                                <div className="pl-4 space-y-1">
                                  {rs.linkedin && rs.linkedin !== 'Não encontrado' && <p>LinkedIn: {rs.linkedin}</p>}
                                  {rs.instagram && rs.instagram !== 'Não encontrado' && <p>Instagram: {rs.instagram}</p>}
                                  {rs.facebook && rs.facebook !== 'Não encontrado' && <p>Facebook: {rs.facebook}</p>}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>

                      {dc.cpf && dc.cpf !== 'Não identificado' && (
                        <div>
                          <h3 className="text-lg font-bold text-[#67EDFC] mb-3">🔐 Dados</h3>
                          <div className="space-y-2 text-sm">
                            <p><span className="text-[#E3E2E4]/60">CPF:</span> {dc.cpf}</p>
                            {dc.cnpj && dc.cnpj !== 'Não identificado' && (
                              <p><span className="text-[#E3E2E4]/60">CNPJ:</span> {dc.cnpj}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {(cj.primeiroProcesso || cj.ultimoProcesso) && (
                        <div>
                          <h3 className="text-lg font-bold text-[#67EDFC] mb-3">📅 Cronologia Judicial</h3>
                          <div className="space-y-2 text-sm">
                            {cj.primeiroProcesso && <p><span className="text-[#E3E2E4]/60">Primeiro:</span> {cj.primeiroProcesso}</p>}
                            {cj.ultimoProcesso && <p><span className="text-[#E3E2E4]/60">Último:</span> {cj.ultimoProcesso}</p>}
                            {cj.periodoAtivo && <p><span className="text-[#E3E2E4]/60">Período:</span> {cj.periodoAtivo}</p>}
                            {cj.picosDeProcessos && cj.picosDeProcessos.length > 0 && (
                              <p><span className="text-[#E3E2E4]/60">Picos:</span> {cj.picosDeProcessos.slice(0, 3).join(', ')}</p>
                            )}
                          </div>
                        </div>
                      )}

                      <div>
                        <h3 className="text-lg font-bold text-[#67EDFC] mb-3">⚖️ Situação Judicial</h3>
                        {(rj.totalProcessos || 0) > 0 ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div className="bg-[#190E68]/50 p-3 rounded-lg text-center">
                                <span className="text-[#E3E2E4]/60 text-xs">Total</span>
                                <p className="text-2xl font-bold">{rj.totalProcessos || 0}</p>
                              </div>
                              <div className="bg-[#190E68]/50 p-3 rounded-lg text-center">
                                <span className="text-[#E3E2E4]/60 text-xs">Ativos</span>
                                <p className="text-2xl font-bold">{rj.processosAtivos || 0}</p>
                              </div>
                              <div className="bg-[#190E68]/50 p-3 rounded-lg text-center">
                                <span className="text-[#E3E2E4]/60 text-xs">Como Autor</span>
                                <p className="text-2xl font-bold">{rj.comoAutor || 0}</p>
                              </div>
                              <div className="bg-[#190E68]/50 p-3 rounded-lg text-center">
                                <span className="text-[#E3E2E4]/60 text-xs">Como Réu</span>
                                <p className="text-2xl font-bold">{rj.comoReu || 0}</p>
                              </div>
                            </div>
                            
                            {rj.valorTotalEnvolvido && <p className="text-sm"><span className="text-[#E3E2E4]/60">💰 Valor Total:</span> <span className="font-bold">{rj.valorTotalEnvolvido}</span></p>}
                            {rj.maiorValorIndividual && <p className="text-sm"><span className="text-[#E3E2E4]/60">💵 Maior Valor:</span> {rj.maiorValorIndividual}</p>}
                            {rj.estadosEnvolvidos && rj.estadosEnvolvidos.length > 0 && <p className="text-sm"><span className="text-[#E3E2E4]/60">📍 Estados:</span> {rj.estadosEnvolvidos.join(', ')}</p>}
                            {rj.tribunaisEnvolvidos && rj.tribunaisEnvolvidos.length > 0 && <p className="text-sm"><span className="text-[#E3E2E4]/60">🏛️ Tribunais:</span> {rj.tribunaisEnvolvidos.slice(0, 5).join(', ')}</p>}
                            
                            {rj.processosPorTipo && (
                              <div className="mt-3 pt-3 border-t border-[#67EDFC]/10">
                                <p className="text-[#E3E2E4]/80 font-medium mb-2">📋 Por Tipo:</p>
                                <div className="grid grid-cols-2 gap-2 text-sm pl-4">
                                  {rj.processosPorTipo.civel > 0 && <p>• Cível: {rj.processosPorTipo.civel}</p>}
                                  {rj.processosPorTipo.trabalhista > 0 && <p>• Trabalhista: {rj.processosPorTipo.trabalhista}</p>}
                                  {rj.processosPorTipo.criminal > 0 && <p className="text-red-400">⚠️ Criminal: {rj.processosPorTipo.criminal}</p>}
                                  {rj.processosPorTipo.tributario > 0 && <p>• Tributário: {rj.processosPorTipo.tributario}</p>}
                                  {rj.processosPorTipo.bancario > 0 && <p>• Bancário: {rj.processosPorTipo.bancario}</p>}
                                  {rj.processosPorTipo.execucaoFiscal > 0 && <p>• Exec. Fiscal: {rj.processosPorTipo.execucaoFiscal}</p>}
                                  {rj.processosPorTipo.familia > 0 && <p>• Família: {rj.processosPorTipo.familia}</p>}
                                </div>
                              </div>
                            )}

                            {rj.processosGraves && rj.processosGraves.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-[#67EDFC]/10">
                                <p className="text-red-400 font-medium mb-3">🚨 Processos de Risco:</p>
                                <div className="space-y-3">
                                  {rj.processosGraves.map((pg: any, i: number) => (
                                    <div key={i} className="bg-red-900/20 border border-red-500/30 p-3 rounded-lg text-sm">
                                      <p className="font-bold text-red-300">{i+1}. {pg.tipo || 'Processo Grave'}</p>
                                      {pg.numeroCnj && <p className="text-xs mt-1">Número: {pg.numeroCnj}</p>}
                                      {pg.dataInicio && <p className="text-xs">Data: {pg.dataInicio}</p>}
                                      {pg.descricao && <p className="text-xs">Descrição: {pg.descricao}</p>}
                                      {pg.valorOuPena && <p className="text-xs">Valor/Pena: {pg.valorOuPena}</p>}
                                      {pg.posicao && <p className="text-xs">Posição: {pg.posicao}</p>}
                                      {pg.parteContraria && <p className="text-xs">Parte Contrária: {pg.parteContraria}</p>}
                                      {pg.tribunal && <p className="text-xs">Tribunal: {pg.tribunal}</p>}
                                      {pg.status && <p className="text-xs">Status: {pg.status}</p>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {rj.analiseResumo && (
                              <div className="mt-3 pt-3 border-t border-[#67EDFC]/10">
                                <p className="text-[#E3E2E4]/80 font-medium mb-2">📝 Análise:</p>
                                <p className="text-sm text-[#E3E2E4]/80 whitespace-pre-line">{rj.analiseResumo}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-green-400">✅ Nenhum processo judicial encontrado</p>
                        )}
                      </div>

                      {report.perfilComportamental && (
                        <div>
                          <h3 className="text-lg font-bold text-[#67EDFC] mb-2">🧠 Perfil Comportamental</h3>
                          <p className="text-[#E3E2E4]/90 whitespace-pre-line">{report.perfilComportamental}</p>
                        </div>
                      )}

                      {report.alertasImportantes && report.alertasImportantes.length > 0 && (
                        <div>
                          <h3 className="text-lg font-bold text-red-400 mb-2">🚨 Alertas</h3>
                          <ul className="text-sm space-y-1">
                            {report.alertasImportantes.map((a: string, i: number) => (
                              <li key={i}>• {a}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {report.conclusao && (
                        <div>
                          <h3 className="text-lg font-bold text-[#67EDFC] mb-2">💡 Conclusão</h3>
                          <p className="text-[#E3E2E4]/90 whitespace-pre-line">
                            {typeof report.conclusao === 'string' ? report.conclusao : (report.conclusao.resumoFinal || report.conclusao.resumoExecutivo || '')}
                          </p>
                          {report.conclusao.observacao && (
                            <p className="text-[#E3E2E4]/60 text-sm mt-3 italic">{report.conclusao.observacao}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
              
              <p className="text-center text-[#E3E2E4]/60 text-sm mt-6">
                A análise completa também foi enviada para seu WhatsApp.
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="text-center py-12">
              <XCircle className="w-20 h-20 text-red-400 mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-4 text-red-400">Erro ao verificar pagamento</h2>
              <p className="text-[#E3E2E4]/80 mb-6">
                Não foi possível confirmar seu pagamento. Se você já pagou, entre em contato com nosso suporte.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-gradient-to-r from-[#67EDFC] to-[#A557FA] text-[#060411] font-bold rounded-xl"
              >
                Tentar Novamente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
