const axios = require('axios');
const { generateOsintReport } = require('./vyntara');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Estado temporário para aguardar seleção de análise
const pendingSelections = new Map();

async function sendWhatsAppMessage(to, message) {
  try {
    const phoneNumberId = process.env.meta_phone_vyntara;
    const accessToken = process.env.WHATSAPP_BUSINESS_TOKEN;

    if (!phoneNumberId || !accessToken) {
      console.error('❌ [Vyntara WA] Credenciais não configuradas');
      return false;
    }

    const response = await axios.post(
      `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: { body: message }
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ [Vyntara WA] Mensagem enviada:', response.data?.messages?.[0]?.id);
    return true;
  } catch (error) {
    console.error('❌ [Vyntara WA] Erro ao enviar:', error.response?.data || error.message);
    return false;
  }
}

function formatReportForWhatsApp(report, fullName) {
  const sections = [];
  
  sections.push(`📋 *INFORMAÇÕES PÚBLICAS*\n🔎 Investigação: ${fullName}\n${'─'.repeat(25)}`);
  
  // RESUMO EXECUTIVO - O mais importante
  if (report.summary) {
    sections.push(`\n📌 *RESUMO EXECUTIVO*\n${report.summary}`);
  }

  // PERFIL PESSOAL - Versão DETALHADA
  if (report.perfilPessoal) {
    const pp = report.perfilPessoal;
    let perfil = '\n👤 *PERFIL DETALHADO*';
    perfil += `\n   Nome: ${pp.nomeCompleto || fullName}`;
    
    // Idade aproximada (novo)
    if (pp.idadeAproximada && pp.idadeAproximada !== 'Não foi possível estimar') {
      perfil += `\n   🎂 Idade: ${pp.idadeAproximada}`;
    }
    
    // Localização - SEMPRE mostrar
    if (pp.localizacao && pp.localizacao !== 'Não identificada') {
      perfil += `\n   📍 Localização: ${pp.localizacao}`;
    } else {
      perfil += `\n   📍 Localização: Não identificada`;
    }
    
    if (pp.profissao && pp.profissao !== 'Não identificada') perfil += `\n   💼 Profissão: ${pp.profissao}`;
    if (pp.empresaAtual && pp.empresaAtual !== 'Não identificada') perfil += `\n   🏢 Empresa: ${pp.empresaAtual}`;
    
    // Empresas relacionadas (novo)
    if (pp.empresasRelacionadas && pp.empresasRelacionadas.length > 0) {
      perfil += `\n   🏭 Empresas relacionadas:`;
      pp.empresasRelacionadas.slice(0, 5).forEach(e => {
        perfil += `\n      • ${e}`;
      });
    }
    
    // Vínculos identificados (novo)
    if (pp.vinculosIdentificados && pp.vinculosIdentificados !== 'Não identificado') {
      perfil += `\n   🔗 Vínculos: ${pp.vinculosIdentificados}`;
    }
    
    // REDES SOCIAIS - SEMPRE mostrar a seção
    perfil += `\n\n   📱 *Redes Sociais:*`;
    const rs = pp.redesSociais || {};
    let temRede = false;
    
    if (rs.linkedin && rs.linkedin !== 'Não encontrado') {
      perfil += `\n   LinkedIn: ${rs.linkedin}`;
      temRede = true;
    }
    if (rs.instagram && rs.instagram !== 'Não encontrado') {
      perfil += `\n   Instagram: ${rs.instagram}`;
      temRede = true;
    }
    if (rs.facebook && rs.facebook !== 'Não encontrado') {
      perfil += `\n   Facebook: ${rs.facebook}`;
      temRede = true;
    }
    
    if (!temRede) {
      perfil += `\n   Nenhuma rede social encontrada`;
    }
    
    sections.push(perfil);
  }

  // DADOS CADASTRAIS - Só se encontrou algo
  const dc = report.dadosCadastrais || {};
  if (dc.cpf && dc.cpf !== 'Não identificado') {
    let cadastro = '\n🔐 *DADOS*';
    cadastro += `\n   CPF: ${dc.cpf}`;
    if (dc.cnpj && dc.cnpj !== 'Não identificado') cadastro += `\n   CNPJ: ${dc.cnpj}`;
    sections.push(cadastro);
  }

  // CRONOLOGIA JUDICIAL (novo)
  if (report.cronologiaJudicial) {
    const cj = report.cronologiaJudicial;
    let cronologia = '\n📅 *CRONOLOGIA JUDICIAL*';
    if (cj.primeiroProcesso) cronologia += `\n   Primeiro: ${cj.primeiroProcesso}`;
    if (cj.ultimoProcesso) cronologia += `\n   Último: ${cj.ultimoProcesso}`;
    if (cj.periodoAtivo) cronologia += `\n   Período: ${cj.periodoAtivo}`;
    if (cj.picosDeProcessos && cj.picosDeProcessos.length > 0) {
      cronologia += `\n   Picos: ${cj.picosDeProcessos.slice(0, 3).join(', ')}`;
    }
    sections.push(cronologia);
  }

  // RESUMO JUDICIAL - Versão DETALHADA
  const rj = report.resumoJudicial || report.analiseJudicial || report.situacaoJudicial || {};
  const total = rj.totalProcessos || 0;
  
  let judicial = '\n⚖️ *SITUAÇÃO JUDICIAL*';
  
  if (total > 0) {
    judicial += `\n   Total: *${total} processos*`;
    judicial += `\n   Ativos: ${rj.processosAtivos || 0}`;
    judicial += `\n   Como Autor: ${rj.comoAutor || 0} | Como Réu: ${rj.comoReu || 0}`;
    if (rj.valorTotalEnvolvido) judicial += `\n   Valor Total: *${rj.valorTotalEnvolvido}*`;
    if (rj.maiorValorIndividual) judicial += `\n   Maior Valor: ${rj.maiorValorIndividual}`;
    
    // Estados e Tribunais (novo)
    if (rj.estadosEnvolvidos && rj.estadosEnvolvidos.length > 0) {
      judicial += `\n   Estados: ${rj.estadosEnvolvidos.join(', ')}`;
    }
    if (rj.tribunaisEnvolvidos && rj.tribunaisEnvolvidos.length > 0) {
      judicial += `\n   Tribunais: ${rj.tribunaisEnvolvidos.slice(0, 5).join(', ')}`;
    }
    
    // Tipos de processo
    if (rj.processosPorTipo) {
      const pt = rj.processosPorTipo;
      let tipos = [];
      if (pt.trabalhista > 0) tipos.push(`Trabalhista: ${pt.trabalhista}`);
      if (pt.civel > 0) tipos.push(`Cível: ${pt.civel}`);
      if (pt.criminal > 0) tipos.push(`Criminal: ${pt.criminal}`);
      if (pt.tributario > 0) tipos.push(`Tributário: ${pt.tributario}`);
      if (pt.bancario > 0) tipos.push(`Bancário: ${pt.bancario}`);
      if (pt.execucaoFiscal > 0) tipos.push(`Exec. Fiscal: ${pt.execucaoFiscal}`);
      if (pt.familia > 0) tipos.push(`Família: ${pt.familia}`);
      if (pt.outros > 0) tipos.push(`Outros: ${pt.outros}`);
      if (tipos.length > 0) judicial += `\n   Tipos: ${tipos.join(', ')}`;
    }
    
    // PROCESSOS GRAVES - Mostra detalhes COMPLETOS
    if (rj.processosGraves && rj.processosGraves.length > 0) {
      judicial += `\n\n🚨 *PROCESSOS DE RISCO:*`;
      rj.processosGraves.forEach((pg, i) => {
        judicial += `\n\n   *${i+1}. ${pg.tipo || 'Processo Grave'}*`;
        if (pg.numeroCnj) judicial += `\n   Número: ${pg.numeroCnj}`;
        if (pg.dataInicio) judicial += `\n   Data: ${pg.dataInicio}`;
        if (pg.descricao) judicial += `\n   Descrição: ${pg.descricao}`;
        if (pg.valorOuPena) judicial += `\n   Valor/Pena: ${pg.valorOuPena}`;
        if (pg.posicao) judicial += `\n   Posição: ${pg.posicao}`;
        if (pg.parteContraria) judicial += `\n   Parte Contrária: ${pg.parteContraria}`;
        if (pg.tribunal) judicial += `\n   Tribunal: ${pg.tribunal}`;
        if (pg.status) judicial += `\n   Status: ${pg.status}`;
        // Compatibilidade com formato antigo
        if (pg.motivo && !pg.descricao) judicial += `\n   Motivo: ${pg.motivo}`;
      });
    }
    
    // Análise resumida
    if (rj.analiseResumo) {
      judicial += `\n\n📝 *Análise:*\n${rj.analiseResumo}`;
    }
  } else {
    judicial += `\n   ✅ Nenhum processo judicial encontrado`;
  }
  
  sections.push(judicial);
  
  // PERFIL COMPORTAMENTAL (novo)
  if (report.perfilComportamental) {
    sections.push(`\n🧠 *PERFIL COMPORTAMENTAL*\n${report.perfilComportamental}`);
  }

  // ALERTAS IMPORTANTES
  if (report.alertasImportantes && report.alertasImportantes.length > 0) {
    let alertas = '\n🚨 *ALERTAS*';
    report.alertasImportantes.forEach(a => {
      alertas += `\n   • ${a}`;
    });
    sections.push(alertas);
  }

  // CONCLUSÃO
  if (report.conclusao) {
    const concl = report.conclusao;
    let conclusaoText = '\n💡 *CONCLUSÃO*';
    
    if (concl.resumoFinal) {
      conclusaoText += `\n${concl.resumoFinal}`;
    } else if (typeof concl === 'string') {
      conclusaoText += `\n${concl}`;
    } else if (concl.resumoExecutivo) {
      conclusaoText += `\n${concl.resumoExecutivo}`;
    }
    if (concl.observacao) {
      conclusaoText += `\n\n_${concl.observacao}_`;
    }
    sections.push(conclusaoText);
  }

  sections.push(`\n${'─'.repeat(25)}\n✅ *Relatório Vyntara*\n🔒 Dados 100% públicos`);

  return sections.join('\n');
}

// Função legada para compatibilidade com relatórios antigos
function formatReportForWhatsAppLegacy(report, fullName) {
  const sections = [];
  
  sections.push(`📋 *INFORMAÇÕES PÚBLICAS*\n🔎 Investigação: ${fullName}\n${'─'.repeat(25)}`);
  
  if (report.summary) {
    sections.push(`\n📌 *RESUMO EXECUTIVO*\n${report.summary}`);
  }

  if (report.perfilPessoal) {
    const pp = report.perfilPessoal;
    let perfil = '\n👤 *PERFIL PESSOAL*';
    perfil += `\n   📝 Nome: ${pp.nomeCompleto || fullName}`;
    if (pp.localizacao) perfil += `\n   📍 Localização: ${pp.localizacao}`;
    if (pp.profissao && pp.profissao !== 'Não identificada') perfil += `\n   💼 Profissão: ${pp.profissao}`;
    if (pp.empresaAtual && pp.empresaAtual !== 'Não identificada') perfil += `\n   🏢 Empresa: ${pp.empresaAtual}`;
    const rs = pp.redesSociais || {};
    if (rs.linkedin && rs.linkedin !== 'Não encontrado') perfil += `\n   💼 LinkedIn: ${rs.linkedin}`;
    if (rs.instagram && rs.instagram !== 'Não encontrado') perfil += `\n   📸 Instagram: ${rs.instagram}`;
    sections.push(perfil);
  }

  const sj = report.situacaoJudicial || report.analiseJudicial || {};
  const total = sj.totalProcessos || 0;
  let judicial = '\n⚖️ *SITUAÇÃO JUDICIAL*';
  
  if (total > 0) {
    judicial += `\n   Total: *${total} processos*`;
    judicial += `\n   Ativos: ${sj.processosAtivos || 0}`;
    if (sj.valorTotalEnvolvido) judicial += `\n   Valor: *${sj.valorTotalEnvolvido}*`;
    if (sj.analiseCompleta) judicial += `\n\n${sj.analiseCompleta}`;
  } else {
    judicial += `\n   ✅ Nenhum processo encontrado`;
  }
  sections.push(judicial);

  if (report.conclusao) {
    const concl = typeof report.conclusao === 'string' ? report.conclusao : (report.conclusao.resumoExecutivo || report.conclusao.resumoFinal || '');
    if (concl) sections.push(`\n💡 *CONCLUSÃO*\n${concl}`);
  }

  sections.push(`\n${'─'.repeat(25)}\n✅ *Relatório Vyntara*\n🔒 Dados 100% públicos`);
  return sections.join('\n');
}

function formatReportForWhatsAppOld(report, fullName) {
  const sections = [];
  
  sections.push(`📋 *INFORMAÇÕES PÚBLICAS*\n🔎 Investigação: ${fullName}\n${'─'.repeat(25)}`);
  
  if (report.summary) {
    sections.push(`\n📌 *RESUMO EXECUTIVO*\n${report.summary}`);
  }

  // PERFIL PESSOAL COMPLETO - SEMPRE MOSTRAR
  if (report.perfilPessoal) {
    const pp = report.perfilPessoal;
    let perfil = '\n👤 *PERFIL PESSOAL*';
    
    // Nome
    perfil += `\n   📝 Nome: ${pp.nomeCompleto || fullName}`;
    
    // Localização - SEMPRE MOSTRAR se existir
    if (pp.localizacao) {
      perfil += `\n   📍 Localização: ${pp.localizacao}`;
    }
    
    // Idade
    if (pp.idadeAproximada && pp.idadeAproximada !== 'Não identificada') {
      perfil += `\n   🎂 Idade: ${pp.idadeAproximada}`;
    }
    
    // Profissão
    if (pp.profissao && pp.profissao !== 'Não identificada') {
      perfil += `\n   💼 Profissão: ${pp.profissao}`;
    }
    
    // Empresa Atual
    if (pp.empresaAtual && pp.empresaAtual !== 'Não identificada') {
      perfil += `\n   🏢 Empresa: ${pp.empresaAtual}`;
    }
    
    // Histórico de Empresas
    if (pp.historicoEmpresas && pp.historicoEmpresas.length > 0) {
      perfil += `\n   📋 Empresas Anteriores:`;
      pp.historicoEmpresas.slice(0, 3).forEach(emp => {
        perfil += `\n      • ${emp}`;
      });
    }
    
    // REDES SOCIAIS - SEMPRE MOSTRAR SEÇÃO
    perfil += '\n\n   📱 *Redes Sociais:*';
    const rs = pp.redesSociais || {};
    let temRede = false;
    
    if (rs.linkedin && rs.linkedin !== 'Não encontrado') {
      perfil += `\n   💼 LinkedIn: ${rs.linkedin}`;
      temRede = true;
    }
    if (rs.instagram && rs.instagram !== 'Não encontrado') {
      perfil += `\n   📸 Instagram: ${rs.instagram}`;
      temRede = true;
    }
    if (rs.facebook && rs.facebook !== 'Não encontrado') {
      perfil += `\n   👤 Facebook: ${rs.facebook}`;
      temRede = true;
    }
    if (rs.twitter && rs.twitter !== 'Não encontrado') {
      perfil += `\n   🐦 Twitter/X: ${rs.twitter}`;
      temRede = true;
    }
    if (rs.outras && rs.outras.length > 0) {
      rs.outras.forEach(r => {
        perfil += `\n   🔗 ${r}`;
        temRede = true;
      });
    }
    
    if (!temRede) {
      perfil += `\n   ℹ️ Nenhuma rede social encontrada`;
    }
    
    // OBSERVAÇÕES DE PERFIL - IMPORTANTE
    if (pp.observacoesPerfil && pp.observacoesPerfil.length > 0) {
      perfil += '\n\n   📋 *Informações Encontradas:*';
      pp.observacoesPerfil.forEach(obs => {
        perfil += `\n   • ${obs}`;
      });
    }
    
    sections.push(perfil);
  }

  // DADOS CADASTRAIS - SEMPRE MOSTRAR
  let cadastro = '\n🔐 *DADOS CADASTRAIS*';
  const dc = report.dadosCadastrais || {};
  
  cadastro += `\n   👤 Tipo: ${dc.tiposPessoa || 'FÍSICA'}`;
  cadastro += `\n   📍 Estado: ${dc.localizacao || 'Não identificado'}`;
  
  // CPF - SEMPRE MOSTRAR SE EXISTIR
  if (dc.cpf && dc.cpf !== 'Não identificado') {
    cadastro += `\n   🆔 CPF: ${dc.cpf}`;
  }
  
  // CNPJ - SEMPRE MOSTRAR SE EXISTIR
  if (dc.cnpj && dc.cnpj !== 'Não identificado') {
    cadastro += `\n   🏢 CNPJ: ${dc.cnpj}`;
  }
  
  // Telefone
  if (dc.telefone && dc.telefone !== 'Não identificado') {
    cadastro += `\n   📞 Telefone: ${dc.telefone}`;
  }
  
  // Email
  if (dc.email && dc.email !== 'Não identificado') {
    cadastro += `\n   📧 Email: ${dc.email}`;
  }
  
  sections.push(cadastro);

  // NOTÍCIAS - SEMPRE MOSTRAR SE HOUVER
  if (report.noticias && report.noticias.length > 0) {
    let noticias = '\n📰 *NOTÍCIAS/PUBLICAÇÕES*';
    report.noticias.slice(0, 3).forEach((n, i) => {
      noticias += `\n   ${i+1}. ${n.titulo || 'Sem título'}`;
      if (n.fonte) noticias += `\n      📍 Fonte: ${n.fonte}`;
      if (n.resumo) noticias += `\n      📝 ${n.resumo.substring(0, 150)}${n.resumo.length > 150 ? '...' : ''}`;
      if (n.url) noticias += `\n      🔗 ${n.url}`;
    });
    sections.push(noticias);
  }

  // INFORMAÇÕES ADICIONAIS
  if (report.informacoesAdicionais) {
    const ia = report.informacoesAdicionais;
    let adicional = '';
    
    if (ia.vinculosEmpresariais && ia.vinculosEmpresariais.length > 0) {
      adicional += '\n🏢 *VÍNCULOS EMPRESARIAIS*';
      ia.vinculosEmpresariais.slice(0, 5).forEach(emp => {
        adicional += `\n   • ${emp}`;
      });
    }
    
    if (ia.redeSocial && ia.redeSocial.length > 0) {
      adicional += '\n\n📱 *MENÇÕES EM REDES SOCIAIS*';
      ia.redeSocial.slice(0, 3).forEach(rs => {
        adicional += `\n   • ${rs}`;
      });
    }
    
    if (ia.outrasInformacoes && ia.outrasInformacoes.length > 0) {
      adicional += '\n\n📋 *OUTRAS INFORMAÇÕES*';
      ia.outrasInformacoes.slice(0, 3).forEach(info => {
        adicional += `\n   • ${info}`;
      });
    }
    
    if (adicional) sections.push(adicional);
  }

  // FONTES CONSULTADAS - Removido a pedido do cliente

  if (report.situacaoJudicial || report.analiseJudicial) {
    const sj = report.situacaoJudicial || report.analiseJudicial || {};
    const total = sj.totalProcessos || 0;
    let judicial = '\n⚖️ *ANÁLISE JUDICIAL COMPLETA*';
    
    if (total > 0) {
      judicial += `\n\n📊 *RESUMO JUDICIAL*`;
      judicial += `\n   • Total de Processos: *${total}*`;
      judicial += `\n   • Processos Ativos: ${sj.processosAtivos || 0}`;
      judicial += `\n   • Como Autor: ${sj.comoAutor || 0}`;
      judicial += `\n   • Como Réu: ${sj.comoReu || 0}`;
      if (sj.valorTotalEnvolvido) judicial += `\n   • 💰 Valor Total: *${sj.valorTotalEnvolvido}*`;
      
      // Processos por tipo
      if (sj.processosPorTipo) {
        const pt = sj.processosPorTipo;
        judicial += `\n\n📋 *POR TIPO:*`;
        if (pt.civel > 0) judicial += `\n   • Cível: ${pt.civel}`;
        if (pt.trabalhista > 0) judicial += `\n   • Trabalhista: ${pt.trabalhista}`;
        if (pt.criminal > 0) judicial += `\n   • ⚠️ Criminal: ${pt.criminal}`;
        if (pt.tributario > 0) judicial += `\n   • Tributário: ${pt.tributario}`;
        if (pt.bancario > 0) judicial += `\n   • Bancário: ${pt.bancario}`;
        if (pt.outros > 0) judicial += `\n   • Outros: ${pt.outros}`;
      }
      
      // Análise completa da IA
      if (sj.analiseCompleta) {
        judicial += `\n\n📝 *ANÁLISE DA IA:*\n${sj.analiseCompleta}`;
      }
      
      // Padrão de litígios
      if (sj.padraoLitigios && sj.padraoLitigios !== 'Nenhum padrão identificado') {
        judicial += `\n\n🔍 *PADRÃO IDENTIFICADO:*\n${sj.padraoLitigios}`;
      }
      
      // PROCESSOS DETALHADOS - Mostra todos os processos
      if (sj.processosDetalhados && sj.processosDetalhados.length > 0) {
        judicial += `\n\n${'─'.repeat(20)}\n📁 *DETALHAMENTO DOS PROCESSOS* (${sj.processosDetalhados.length} total)`;
        
        sj.processosDetalhados.forEach((p, i) => {
          const gravidadeEmoji = p.gravidade === 'CRÍTICA' ? '🔴' : 
                                  p.gravidade === 'ALTA' ? '🟠' : 
                                  p.gravidade === 'MÉDIA' ? '🟡' : '🟢';
          
          judicial += `\n\n${gravidadeEmoji} *PROCESSO ${i+1}*`;
          judicial += `\n   📋 Número: ${p.numeroCnj}`;
          judicial += `\n   ⚖️ Tipo: ${p.tipo || 'N/A'}`;
          judicial += `\n   👤 Posição: ${p.posicao || 'N/A'}`;
          judicial += `\n   🆚 Parte Contrária: ${p.parteContraria || 'N/A'}`;
          judicial += `\n   📍 Tribunal: ${p.tribunal || 'N/A'}`;
          if (p.orgaoJulgador) judicial += `\n   🏛️ Vara: ${p.orgaoJulgador}`;
          if (p.cidade) judicial += `\n   📍 Cidade: ${p.cidade}`;
          judicial += `\n   💰 Valor: ${p.valorCausa || 'Não informado'}`;
          judicial += `\n   📅 Data Início: ${p.dataInicio || p.ano || 'N/A'}`;
          judicial += `\n   🔄 Status: ${p.status || 'N/A'}`;
          if (p.ultimaMovimentacao) judicial += `\n   📅 Última Mov.: ${p.ultimaMovimentacao}`;
          if (p.quantidadeMovimentacoes) judicial += `\n   📊 Movimentações: ${p.quantidadeMovimentacoes}`;
          
          if (p.advogadoPesquisado && p.advogadoPesquisado !== 'Não informado') {
            judicial += `\n   👔 Advogado: ${p.advogadoPesquisado}`;
            if (p.oabAdvogado) judicial += ` (${p.oabAdvogado})`;
          }
          
          judicial += `\n   📝 Assunto: ${p.assunto || 'N/A'}`;
          judicial += `\n   ⚠️ Gravidade: ${p.gravidade || 'N/A'}`;
          
          if (p.observacao) {
            judicial += `\n\n   💡 *Análise:* ${p.observacao}`;
          }
        });
      }
      
      // Alertas
      if (sj.alertas && sj.alertas.length > 0) {
        judicial += `\n\n⚠️ *ALERTAS IMPORTANTES:*`;
        sj.alertas.forEach(alerta => {
          judicial += `\n   ❗ ${alerta}`;
        });
      }
      
      // Recomendações
      if (sj.recomendacoesJudiciais && sj.recomendacoesJudiciais.length > 0) {
        judicial += `\n\n💡 *RECOMENDAÇÕES:*`;
        sj.recomendacoesJudiciais.forEach(rec => {
          judicial += `\n   ✔️ ${rec}`;
        });
      }
      
    } else {
      judicial += `\n   ✅ Nenhum processo judicial identificado`;
    }
    
    sections.push(judicial);
  }

  if (report.vinculosEmpresariais && report.vinculosEmpresariais.hasEmpresas) {
    const ve = report.vinculosEmpresariais;
    let empresas = '\n🏢 *PARTICIPAÇÕES SOCIETÁRIAS*';
    empresas += `\n   🟢 Empresas Ativas: ${ve.empresasAtivas || 0}`;
    if (ve.empresasBaixa > 0) empresas += `\n   🔴 Empresas Baixadas: ${ve.empresasBaixa}`;
    if (ve.capitalSocialTotal && ve.capitalSocialTotal !== 'Não identificado') {
      empresas += `\n   💰 Capital Social Total: ${ve.capitalSocialTotal}`;
    }
    if (ve.empresas && ve.empresas.length > 0) {
      empresas += `\n\n   📊 *Empresas Vinculadas:*`;
      ve.empresas.slice(0, 3).forEach(e => {
        const emoji = e.situacao === 'Ativa' ? '🟢' : '🔴';
        empresas += `\n   ${emoji} ${e.nome}`;
        if (e.cargo) empresas += ` (${e.cargo})`;
      });
    }
    sections.push(empresas);
  }

  // Score de risco removido - a decisão fica a critério do usuário
  sections.push(`\n${'─'.repeat(25)}\n⚠️ *AVALIAÇÃO DE RISCO*\n   As informações acima são públicas e foram compiladas para sua análise.\n   A avaliação do nível de risco fica a seu critério, considerando o contexto e a finalidade da sua consulta.`);

  if (report.conclusao) {
    const concl = typeof report.conclusao === 'string' ? report.conclusao : (report.conclusao.resumoExecutivo || '');
    if (concl) {
      sections.push(`\n💡 *CONCLUSÃO DA IA*\n${concl}`);
    }
  }

  if (report.sourcesCount) {
    const sc = report.sourcesCount;
    sections.push(`\n📡 *FONTES CONSULTADAS*\n   🌐 Web: ${sc.cse || 0} fontes\n   ⚖️ Judiciárias: ${sc.datajud || 0} registros\n   🏛️ Governamentais: ${sc.transparencia || 0} bases`);
  }

  sections.push(`\n${'─'.repeat(25)}\n✅ *Relatório Vyntara*\n🔒 Dados 100% públicos e legais`);

  return sections.join('\n');
}

function getRiskBar(score) {
  const filled = Math.round(score / 10);
  const empty = 10 - filled;
  return '▓'.repeat(filled) + '░'.repeat(empty);
}

// Função para dividir mensagens longas em chunks
function splitMessageIntoChunks(message, maxLength = 3500) {
  if (message.length <= maxLength) {
    return [message];
  }
  
  const chunks = [];
  let currentChunk = '';
  const lines = message.split('\n');
  
  for (const line of lines) {
    if ((currentChunk + '\n' + line).length > maxLength) {
      if (currentChunk) chunks.push(currentChunk);
      currentChunk = line;
    } else {
      currentChunk += (currentChunk ? '\n' : '') + line;
    }
  }
  if (currentChunk) chunks.push(currentChunk);
  
  return chunks;
}

// Função para enviar análise dividida em partes
async function sendAnaliseEmPartes(from, formattedReport, pedido) {
  const MAX_MESSAGE_LENGTH = 3500;
  const chunks = splitMessageIntoChunks(formattedReport, MAX_MESSAGE_LENGTH);
  const totalParts = chunks.length;
  
  // Envia cabeçalho
  const headerMsg = totalParts > 1 
    ? `📋 *ANÁLISE COMPLETA*\n\n🔍 Pesquisa: ${pedido.nome_pesquisado}\n📧 Email: ${pedido.email}\n🔖 Pedido: #${pedido.id}\n📄 Total: ${totalParts} mensagens\n\n${'─'.repeat(20)}`
    : `📋 *ANÁLISE COMPLETA*\n\n🔍 Pesquisa: ${pedido.nome_pesquisado}\n📧 Email: ${pedido.email}\n🔖 Pedido: #${pedido.id}\n\n${'─'.repeat(20)}`;
  
  await sendWhatsAppMessage(from, headerMsg);
  await new Promise(r => setTimeout(r, 800));
  
  // Envia cada parte
  for (let i = 0; i < chunks.length; i++) {
    const partHeader = totalParts > 1 ? `📄 *Parte ${i + 1}/${totalParts}*\n\n` : '';
    await sendWhatsAppMessage(from, partHeader + chunks[i]);
    if (i < chunks.length - 1) {
      await new Promise(r => setTimeout(r, 1000)); // Delay maior entre mensagens
    }
  }
  
  console.log(`✅ [Vyntara WA] Análise #${pedido.id} enviada em ${totalParts} parte(s) para ${from}`);
}

async function getAnalisesByPhone(from) {
  try {
    const telefoneCompleto = from.replace(/\D/g, '');
    const telefoneSem55 = telefoneCompleto.replace(/^55/, '');
    
    // Gera variantes com e sem o 9
    let telefoneSem9, telefoneCom9;
    if (telefoneSem55.length === 11) {
      // Tem 11 dígitos (com 9): DDD + 9 + número
      telefoneSem9 = telefoneSem55.slice(0, 2) + telefoneSem55.slice(3); // Remove o 9
      telefoneCom9 = telefoneSem55;
    } else if (telefoneSem55.length === 10) {
      // Tem 10 dígitos (sem 9): DDD + número
      telefoneSem9 = telefoneSem55;
      telefoneCom9 = telefoneSem55.slice(0, 2) + '9' + telefoneSem55.slice(2); // Adiciona o 9
    } else {
      telefoneSem9 = telefoneSem55;
      telefoneCom9 = telefoneSem55;
    }
    
    const variantes = [
      telefoneCompleto,           // Original: 5551986317625
      telefoneSem55,              // Sem 55: 51986317625
      telefoneSem9,               // Sem 9: 5186317625
      telefoneCom9,               // Com 9: 51986317625
      '55' + telefoneSem9,        // Com 55, sem 9: 555186317625
      '55' + telefoneCom9,        // Com 55, com 9: 5551986317625
    ];
    
    console.log(`[Vyntara WA] Buscando análises - Variantes:`, variantes);
    
    const result = await pool.query(
      `SELECT p.id, p.nome_pesquisado, p.email, p.created_at, c.analise_ia 
       FROM vyntara_pedidos p
       LEFT JOIN vyntara_consultas c ON c.id = p.consulta_id
       WHERE p.telefone = ANY($1)
       AND p.status = 'approved'
       AND p.analise_concluida = true
       ORDER BY p.created_at DESC`,
      [variantes]
    );
    
    return result.rows;
  } catch (error) {
    console.error('❌ [Vyntara WA] Erro ao buscar análises:', error.message);
    return [];
  }
}

async function sendAnaliseById(from, pedidoId) {
  try {
    const result = await pool.query(
      `SELECT p.*, c.analise_ia 
       FROM vyntara_pedidos p
       LEFT JOIN vyntara_consultas c ON c.id = p.consulta_id
       WHERE p.id = $1`,
      [pedidoId]
    );
    
    if (result.rows.length === 0) {
      await sendWhatsAppMessage(from, '❌ Análise não encontrada.');
      return;
    }
    
    const pedido = result.rows[0];
    
    if (pedido.analise_ia) {
      const analise = typeof pedido.analise_ia === 'string' ? JSON.parse(pedido.analise_ia) : pedido.analise_ia;
      const formattedReport = formatReportForWhatsApp(analise, pedido.nome_pesquisado);
      await sendAnaliseEmPartes(from, formattedReport, pedido);
    } else {
      await sendWhatsAppMessage(from, '❌ Esta análise ainda não foi processada. Aguarde de 1 a 3 minutos.');
    }
  } catch (error) {
    console.error('❌ [Vyntara WA] Erro ao enviar análise:', error.message);
    await sendWhatsAppMessage(from, '❌ Erro ao buscar análise. Tente novamente.');
  }
}

async function handleIncomingMessage(from, messageText, messageId) {
  try {
    console.log(`📩 [Vyntara WA] Mensagem de ${from}: ${messageText}`);

    const normalizedMessage = messageText.trim().toLowerCase();
    
    // Verifica se está aguardando seleção de análise
    if (pendingSelections.has(from)) {
      const selection = pendingSelections.get(from);
      const selectedNumber = parseInt(normalizedMessage, 10);
      
      if (!isNaN(selectedNumber) && selectedNumber >= 1 && selectedNumber <= selection.analises.length) {
        const selectedAnalise = selection.analises[selectedNumber - 1];
        pendingSelections.delete(from);
        await sendAnaliseById(from, selectedAnalise.id);
        return 'Análise enviada';
      } else {
        await sendWhatsAppMessage(from, `❌ Opção inválida. Digite um número de 1 a ${selection.analises.length}.`);
        return 'Opção inválida';
      }
    }
    
    // Busca análises anteriores deste número
    const analises = await getAnalisesByPhone(from);
    
    if (analises.length > 0) {
      // Usuário tem análises, mostra lista para selecionar
      let message = `📋 *SUAS ANÁLISES VYNTARA*\n\nEncontramos ${analises.length} análise(s) vinculada(s) a este número:\n\n`;
      
      analises.forEach((a, index) => {
        const data = new Date(a.created_at).toLocaleDateString('pt-BR');
        message += `*${index + 1}.* ${a.nome_pesquisado}\n   📅 ${data}\n\n`;
      });
      
      message += `\n📲 *Digite o número* da análise que deseja receber novamente.`;
      
      // Armazena estado para aguardar resposta
      pendingSelections.set(from, {
        analises: analises,
        timestamp: Date.now()
      });
      
      // Limpa seleções antigas após 10 minutos
      setTimeout(() => {
        if (pendingSelections.has(from)) {
          pendingSelections.delete(from);
        }
      }, 600000);
      
      await sendWhatsAppMessage(from, message);
      return 'Lista de análises enviada';
    }
    
    // Se não tem análises, direciona para o site
    console.log(`[Vyntara WA] ℹ️ Usuário ${from} sem análises - direcionando ao site`);
    const noAnalysisMessage = `🔎 *VYNTARA*

Olá! Não encontramos nenhuma análise vinculada a este número.

Para realizar uma investigação completa de pessoas ou empresas, acesse nosso site:

🌐 *https://vyntaraapp.com*

Nossa análise inclui:
📋 Histórico judicial completo
💼 Vínculos empresariais
📰 Notícias e menções públicas
📊 Score de risco detalhado

Após a compra, o relatório será enviado automaticamente para este WhatsApp! 📲`;
    
    await sendWhatsAppMessage(from, noAnalysisMessage);
    return 'Usuário direcionado ao site';

  } catch (error) {
    console.error('❌ [Vyntara WA] Erro ao processar:', error.message);
    const errorMsg = '❌ Desculpe, ocorreu um erro ao processar sua investigação. Verifique se o nome/CPF/CNPJ está correto e tente novamente.';
    await sendWhatsAppMessage(from, errorMsg);
    return errorMsg;
  }
}

async function handleAnaliseRequest(from) {
  try {
    // Normaliza telefone - aceita com ou sem 9
    const telefoneCompleto = from.replace(/\D/g, ''); // Ex: 555186317625
    const telefoneSem55 = telefoneCompleto.replace(/^55/, ''); // Ex: 5186317625
    const telefoneSemNono = telefoneSem55.length === 11 ? telefoneSem55.slice(0, 2) + telefoneSem55.slice(3) : telefoneSem55; // Remove o 9
    const telefoneCom55Sem9 = '55' + telefoneSemNono; // Ex: 555186317625 -> 5551XXXXXXXX
    
    console.log(`[Vyntara WA] Buscando análise - Original: ${from}, Variantes: ${telefoneCompleto}, ${telefoneSem55}, ${telefoneSemNono}, ${telefoneCom55Sem9}`);
    
    const pedidoResult = await pool.query(
      `SELECT p.*, c.analise_ia 
       FROM vyntara_pedidos p
       LEFT JOIN vyntara_consultas c ON c.id = p.consulta_id
       WHERE (p.telefone = $1 OR p.telefone = $2 OR p.telefone = $3 OR p.telefone = $4)
       AND p.status = 'approved'
       AND p.analise_concluida = true
       ORDER BY p.created_at DESC
       LIMIT 1`,
      [telefoneCompleto, telefoneSem55, telefoneSemNono, telefoneCom55Sem9]
    );
    
    if (pedidoResult.rows.length === 0) {
      await sendWhatsAppMessage(from, '❌ Não encontramos nenhuma análise paga vinculada a este número.\n\nSe você já fez o pagamento, aguarde de 1 a 3 minutos e tente novamente. Se o problema persistir, entre em contato com nosso suporte.');
      return 'Análise não encontrada';
    }
    
    const pedido = pedidoResult.rows[0];
    
    if (pedido.analise_ia) {
      const analise = typeof pedido.analise_ia === 'string' ? JSON.parse(pedido.analise_ia) : pedido.analise_ia;
      const formattedReport = formatReportForWhatsApp(analise, pedido.nome_pesquisado);
      
      await sendWhatsAppMessage(from, `📋 *ANÁLISE COMPLETA*\n\n🔍 Pesquisa: ${pedido.nome_pesquisado}\n📧 Email: ${pedido.email}\n🔖 Pedido: #${pedido.id}\n\n${'─'.repeat(20)}`);
      
      const MAX_MESSAGE_LENGTH = 4000;
      if (formattedReport.length > MAX_MESSAGE_LENGTH) {
        const chunks = [];
        let currentChunk = '';
        const lines = formattedReport.split('\n');
        
        for (const line of lines) {
          if ((currentChunk + '\n' + line).length > MAX_MESSAGE_LENGTH) {
            chunks.push(currentChunk);
            currentChunk = line;
          } else {
            currentChunk += (currentChunk ? '\n' : '') + line;
          }
        }
        if (currentChunk) chunks.push(currentChunk);

        for (let i = 0; i < chunks.length; i++) {
          await sendWhatsAppMessage(from, chunks[i]);
          if (i < chunks.length - 1) {
            await new Promise(r => setTimeout(r, 500));
          }
        }
      } else {
        await sendWhatsAppMessage(from, formattedReport);
      }
      
      console.log(`✅ [Vyntara WA] Análise completa enviada para ${from} (Pedido #${pedido.id})`);
      return formattedReport;
    } else {
      const report = await generateOsintReport(pedido.nome_pesquisado, 'pessoa', '');
      const formattedReport = formatReportForWhatsApp(report, pedido.nome_pesquisado);
      
      await sendWhatsAppMessage(from, `📋 *ANÁLISE COMPLETA*\n\n🔍 Pesquisa: ${pedido.nome_pesquisado}\n📧 Email: ${pedido.email}\n🔖 Pedido: #${pedido.id}\n\n${'─'.repeat(20)}`);
      
      const MAX_MESSAGE_LENGTH = 4000;
      if (formattedReport.length > MAX_MESSAGE_LENGTH) {
        const chunks = [];
        let currentChunk = '';
        const lines = formattedReport.split('\n');
        
        for (const line of lines) {
          if ((currentChunk + '\n' + line).length > MAX_MESSAGE_LENGTH) {
            chunks.push(currentChunk);
            currentChunk = line;
          } else {
            currentChunk += (currentChunk ? '\n' : '') + line;
          }
        }
        if (currentChunk) chunks.push(currentChunk);

        for (let i = 0; i < chunks.length; i++) {
          await sendWhatsAppMessage(from, chunks[i]);
          if (i < chunks.length - 1) {
            await new Promise(r => setTimeout(r, 500));
          }
        }
      } else {
        await sendWhatsAppMessage(from, formattedReport);
      }
      
      return formattedReport;
    }
    
  } catch (error) {
    console.error('❌ [Vyntara WA] Erro ao processar análise:', error.message);
    await sendWhatsAppMessage(from, '❌ Ocorreu um erro ao buscar sua análise. Tente novamente em alguns minutos.');
    return 'Erro ao processar';
  }
}

console.log('✅ Vyntara WhatsApp Service carregado');

module.exports = {
  handleIncomingMessage,
  sendWhatsAppMessage
};
