const { config } = require('./config');
const { searchCse } = require('./searchCse');
const { advancedPersonSearch } = require('./googleAdvancedSearch');
const { fetchPageText } = require('./fetchPage');
const { runGemini } = require('./gemini');
const { generateHtmlReport } = require('./report');
const { searchEscavador, formatEscavadorForReport } = require('./escavador');
const { executeQuery } = require('../../supabase');
const { calculateIdentityConfidence, calculateJudicialConfidence, applyScoreCap } = require('./confidence');
const { filterEvidence, getFilterStats } = require('./evidenceFilter');
const { redactForLogs } = require('./redact');

function formatCpf(cpf) {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `${cleaned.slice(0,3)}.${cleaned.slice(3,6)}.${cleaned.slice(6,9)}-${cleaned.slice(9,11)}`;
  }
  return cpf;
}

function formatCnpj(cnpj) {
  const cleaned = cnpj.replace(/\D/g, '');
  if (cleaned.length === 14) {
    return `${cleaned.slice(0,2)}.${cleaned.slice(2,5)}.${cleaned.slice(5,8)}/${cleaned.slice(8,12)}-${cleaned.slice(12,14)}`;
  }
  return cnpj;
}

function detectCpfCnpj(input) {
  const cleaned = input.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return { type: 'cpf', value: cleaned, formatted: formatCpf(cleaned) };
  }
  if (cleaned.length === 14) {
    return { type: 'cnpj', value: cleaned, formatted: formatCnpj(cleaned) };
  }
  return null;
}

function normalizeIdentifier(input) {
  const docInfo = detectCpfCnpj(input);
  if (docInfo) {
    return docInfo.value;
  }
  return input.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

async function checkCache(identificador) {
  try {
    const result = await executeQuery(
      `SELECT c.*, 
        (SELECT json_agg(p.*) FROM vyntara_processos p WHERE p.consulta_id = c.id) as processos,
        (SELECT json_agg(f.*) FROM vyntara_fontes_google f WHERE f.consulta_id = c.id) as fontes_google
       FROM vyntara_consultas c 
       WHERE c.identificador = $1 
       AND c.created_at > NOW() - INTERVAL '7 days'
       ORDER BY c.created_at DESC 
       LIMIT 1`,
      [identificador]
    );
    
    if (result.rows.length > 0) {
      console.log(`[Vyntara] Cache encontrado para: ${identificador}`);
      return result.rows[0];
    }
    return null;
  } catch (error) {
    console.log(`[Vyntara] Erro ao verificar cache: ${error.message}`);
    return null;
  }
}

async function saveToDatabase(identificador, tipo, nomeCompleto, escavadorResults, googleResults, analiseIA, confidenceData) {
  try {
    const consultaResult = await executeQuery(
      `INSERT INTO vyntara_consultas (identificador, tipo, nome_pesquisado, cpf_cnpj, total_processos, creditos_utilizados, analise_ia, confidence_identity, confidence_judicial)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (identificador) DO UPDATE SET
         total_processos = $5,
         creditos_utilizados = $6,
         analise_ia = $7,
         confidence_identity = $8,
         confidence_judicial = $9,
         updated_at = NOW()
       RETURNING id`,
      [
        identificador,
        tipo,
        escavadorResults.envolvido?.nome || nomeCompleto,
        tipo === 'nome' ? null : identificador,
        escavadorResults.totalProcessos || 0,
        parseInt(escavadorResults.creditos) || 0,
        JSON.stringify(analiseIA),
        confidenceData?.identity?.level || null,
        confidenceData?.judicial?.level || null
      ]
    );
    
    const consultaId = consultaResult.rows[0].id;
    
    if (escavadorResults.processos && escavadorResults.processos.length > 0) {
      await executeQuery(`DELETE FROM vyntara_processos WHERE consulta_id = $1`, [consultaId]);
      
      for (const processo of escavadorResults.processos) {
        const capa = processo.fontes?.[0]?.capa || {};
        const valorCausa = capa.valor_causa?.valor ? parseFloat(capa.valor_causa.valor) : null;
        
        await executeQuery(
          `INSERT INTO vyntara_processos 
           (consulta_id, numero_cnj, titulo_polo_ativo, titulo_polo_passivo, ano_inicio, data_inicio, 
            estado_sigla, tribunal_sigla, classe, assunto, valor_causa, valor_causa_formatado, 
            status_predito, quantidade_movimentacoes, data_ultima_movimentacao, dados_completos)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
          [
            consultaId,
            processo.numero_cnj,
            processo.titulo_polo_ativo,
            processo.titulo_polo_passivo,
            processo.ano_inicio,
            processo.data_inicio,
            processo.estado_origem?.sigla,
            processo.fontes?.[0]?.sigla,
            capa.classe,
            capa.assunto,
            valorCausa,
            capa.valor_causa?.valor_formatado,
            processo.fontes?.[0]?.status_predito,
            processo.quantidade_movimentacoes,
            processo.data_ultima_movimentacao,
            JSON.stringify(processo)
          ]
        );
      }
    }
    
    if (googleResults && googleResults.length > 0) {
      await executeQuery(`DELETE FROM vyntara_fontes_google WHERE consulta_id = $1`, [consultaId]);
      
      for (const fonte of googleResults) {
        await executeQuery(
          `INSERT INTO vyntara_fontes_google (consulta_id, url, titulo, snippet, conteudo_extraido)
           VALUES ($1, $2, $3, $4, $5)`,
          [consultaId, fonte.url, fonte.title, fonte.snippet, fonte.fetchedText || null]
        );
      }
    }
    
    console.log(`[Vyntara] Dados salvos no banco: ${escavadorResults.totalProcessos || 0} processos, ${googleResults?.length || 0} fontes Google`);
    return consultaId;
  } catch (error) {
    console.log(`[Vyntara] Erro ao salvar no banco: ${error.message}`);
  }
}

async function generateOsintReport(fullName, context, notes = '') {
  const cleanContext = context?.trim() || '';
  console.log(`[Vyntara] Iniciando análise para: ${fullName}${cleanContext ? ` (${cleanContext})` : ''}`);
  
  const docInfo = detectCpfCnpj(fullName);
  const isCpfSearch = docInfo?.type === 'cpf';
  const isCnpjSearch = docInfo?.type === 'cnpj';
  const tipo = isCpfSearch ? 'cpf' : (isCnpjSearch ? 'cnpj' : 'nome');
  
  const identificador = normalizeIdentifier(fullName);
  
  const cachedData = await checkCache(identificador);
  
  if (cachedData && cachedData.analise_ia) {
    console.log(`[Vyntara] Usando dados do cache (${cachedData.total_processos} processos)`);
    
    const cachedAnalise = typeof cachedData.analise_ia === 'string' 
      ? JSON.parse(cachedData.analise_ia) 
      : cachedData.analise_ia;
    
    const additionalContext = {
      escavador: {
        success: true,
        totalProcessos: cachedData.total_processos,
        processos: cachedData.processos || [],
        envolvido: { nome: cachedData.nome_pesquisado }
      },
      escavadorFormatted: formatEscavadorForReport({
        success: true,
        totalProcessos: cachedData.total_processos,
        processos: cachedData.processos || []
      }),
      fromCache: true
    };
    
    const html = generateHtmlReport({ fullName, context, notes }, cachedAnalise, additionalContext);
    
    return {
      ...cachedAnalise,
      html,
      fromCache: true,
      sourcesCount: {
        escavador: cachedData.total_processos || 0,
        cse: cachedData.fontes_google?.length || 0
      }
    };
  }
  
  if (isCpfSearch) {
    console.log(`[Vyntara] Detectado CPF: ${docInfo.formatted}`);
  } else if (isCnpjSearch) {
    console.log(`[Vyntara] Detectado CNPJ: ${docInfo.formatted}`);
  }
  
  let escavadorResults;
  let advancedSearchResults;
  let nomeDescoberto = fullName;
  
  // FLUXO ENRIQUECIDO PARA CPF/CNPJ
  if (isCpfSearch || isCnpjSearch) {
    console.log(`[Vyntara] Fluxo enriquecido: Escavador primeiro para descobrir nome`);
    
    // ETAPA 1: Escavador para descobrir o nome real
    escavadorResults = await searchEscavador(fullName).catch(err => {
      console.log(`[Vyntara] Erro Escavador: ${err.message}`);
      return { error: err.message, totalProcessos: 0 };
    });
    
    // Extrai o nome descoberto
    if (escavadorResults.envolvido?.nome) {
      nomeDescoberto = escavadorResults.envolvido.nome;
      console.log(`[Vyntara] Nome descoberto pelo Escavador: ${nomeDescoberto}`);
    }
    
    // ETAPA 2: Busca no Google com o nome descoberto
    console.log(`[Vyntara] Buscando no Google com nome: ${nomeDescoberto}`);
    const contextoBusca = isCnpjSearch ? 'empresa' : 'pessoa';
    
    advancedSearchResults = await advancedPersonSearch(nomeDescoberto, contextoBusca).catch(err => {
      console.log(`[Vyntara] Erro Google Avançado: ${err.message}`);
      return { results: [], extractedData: {}, socialProfiles: {} };
    });
    
  } else {
    // FLUXO NORMAL PARA NOMES (paralelo)
    console.log(`[Vyntara] Buscando dados: Escavador + Google Avançado (paralelo)`);
    
    const [escRes, advRes] = await Promise.all([
      searchEscavador(fullName).catch(err => {
        console.log(`[Vyntara] Erro Escavador: ${err.message}`);
        return { error: err.message, totalProcessos: 0 };
      }),
      advancedPersonSearch(fullName, cleanContext).catch(err => {
        console.log(`[Vyntara] Erro Google Avançado: ${err.message}`);
        return { results: [], extractedData: {}, socialProfiles: {} };
      })
    ]);
    
    escavadorResults = escRes;
    advancedSearchResults = advRes;
  }
  
  const totalProcessos = escavadorResults.totalProcessos || 0;
  
  // ============================================
  // FLUXO ADAPTATIVO: Ajusta esforço baseado em processos judiciais
  // ============================================
  
  let allCseResults = advancedSearchResults.results || [];
  const extractedPersonData = advancedSearchResults.extractedData || {};
  const socialProfiles = advancedSearchResults.socialProfiles || {};
  
  console.log(`[Vyntara] ========================================`);
  console.log(`[Vyntara] Escavador: ${totalProcessos} processos`);
  console.log(`[Vyntara] Google Avançado: ${allCseResults.length} fontes iniciais`);
  console.log(`[Vyntara] Redes sociais encontradas: ${Object.keys(socialProfiles).join(', ') || 'nenhuma'}`);
  
  // FLUXO ADAPTATIVO: Se 0 processos, aumentar esforço na busca web
  if (totalProcessos === 0 && allCseResults.length < 15) {
    console.log(`[Vyntara] ⚠️  SEM PROCESSOS JUDICIAIS - Aumentando esforço de busca web`);
    console.log(`[Vyntara] Executando buscas adicionais para compensar ausência de âncora judicial...`);
    
    // Buscar mais categorias e aumentar profundidade
    const buscasAdicionais = [
      { categoria: 'noticias-ampliado', query: `"${nomeDescoberto}" (notícia OR reportagem OR matéria)` },
      { categoria: 'empresas', query: `"${nomeDescoberto}" (empresa OR CEO OR sócio OR diretor)` },
      { categoria: 'academico', query: `site:lattes.cnpq.br OR site:scholar.google.com "${nomeDescoberto}"` },
      { categoria: 'governo', query: `site:.gov.br "${nomeDescoberto}"` }
    ];
    
    const buscasExtrasResults = [];
    for (const busca of buscasAdicionais) {
      try {
        const extras = await searchCse(busca.query, 5);
        if (extras && extras.length > 0) {
          console.log(`[Vyntara]   ✓ ${busca.categoria}: +${extras.length} fontes`);
          buscasExtrasResults.push(...extras);
        }
      } catch (err) {
        console.log(`[Vyntara]   ✗ ${busca.categoria}: ${err.message}`);
      }
    }
    
    allCseResults = [...allCseResults, ...buscasExtrasResults];
    console.log(`[Vyntara] Total após busca ampliada: ${allCseResults.length} fontes`);
  } else {
    console.log(`[Vyntara] ✓ Processos encontrados - Mantendo busca web padrão`);
  }
  
  // ============================================
  // CONFIDENCE LEVELS
  // ============================================
  
  const ufsEscavador = escavadorResults.processos?.map(p => p.estado_origem?.sigla).filter(Boolean) || [];
  
  const identityConfidence = calculateIdentityConfidence({
    tipoConsulta: tipo,
    nomeOriginal: fullName,
    nomeEscavador: escavadorResults.envolvido?.nome,
    ufsEscavador: ufsEscavador,
    googleResults: allCseResults,
    totalProcessos: totalProcessos
  });
  
  const judicialConfidence = calculateJudicialConfidence(escavadorResults);
  
  console.log(`[Vyntara] ----------------------------------------`);
  console.log(`[Vyntara] CONFIDENCE IDENTITY: ${identityConfidence.level} (${identityConfidence.score})`);
  identityConfidence.justificativas.forEach(j => console.log(`[Vyntara]   ${j}`));
  console.log(`[Vyntara] CONFIDENCE JUDICIAL: ${judicialConfidence.level} (${judicialConfidence.score})`);
  judicialConfidence.justificativas.forEach(j => console.log(`[Vyntara]   ${j}`));
  console.log(`[Vyntara] ----------------------------------------`);
  
  // ============================================
  // EVIDENCE FILTER
  // ============================================
  
  const baseProfile = {
    nome: nomeDescoberto,
    ufsAtuacao: ufsEscavador,
    cidadesAtuacao: escavadorResults.processos?.map(p => p.unidade_origem?.cidade).filter(Boolean) || [],
    empresas: extractedPersonData.companies || []
  };
  
  const seen = new Set();
  const sourcesUnique = allCseResults.filter(r => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });
  
  const sourcesClassified = filterEvidence(sourcesUnique, baseProfile);
  const filterStats = getFilterStats(sourcesClassified);
  
  console.log(`[Vyntara] ========================================`);
  console.log(`[Vyntara] EVIDENCE FILTER:`);
  console.log(`[Vyntara]   Total fontes: ${filterStats.total}`);
  console.log(`[Vyntara]   ✓ Aceitas: ${filterStats.aceitas}`);
  console.log(`[Vyntara]   ⚠ Sinais fracos: ${filterStats.sinaisFracos}`);
  console.log(`[Vyntara]   ✗ Descartadas: ${filterStats.descartadas} (${filterStats.percentualDescarte}%)`);
  console.log(`[Vyntara]   Compatibilidade média: ${filterStats.compatibilidadeMedia}`);
  console.log(`[Vyntara] ========================================`);
  
  // Fetch apenas fontes ACEITAS (prioridade) e SINAIS_FRACOS (se necessário)
  const fontesParaFetch = sourcesClassified.filter(s => 
    s.status === 'ACEITA' || (s.status === 'SINAL_FRACO' && totalProcessos === 0)
  );
  
  const maxToFetch = totalProcessos === 0 ? 15 : 10; // Mais fetch se sem processos
  const fetchPromises = fontesParaFetch.slice(0, maxToFetch).map(async (s) => {
    try {
      const text = await fetchPageText(s.url);
      if (text) s.fetchedText = text;
    } catch (err) {
      console.log(`[Vyntara] Erro ao buscar ${s.url}: ${redactForLogs(err.message)}`);
    }
  });
  
  await Promise.all(fetchPromises);
  
  // Sources final = apenas ACEITAS + SINAIS_FRACOS com fetch bem-sucedido
  const sources = sourcesClassified.filter(s => 
    (s.status === 'ACEITA' || s.status === 'SINAL_FRACO') && 
    (s.fetchedText || s.snippet)
  );
  
  console.log(`[Vyntara] Fontes enviadas para IA: ${sources.length} (após filter + fetch)`);
  
  const confidenceData = {
    identity: identityConfidence,
    judicial: judicialConfidence
  };
  
  const additionalContext = {
    escavador: escavadorResults,
    escavadorFormatted: formatEscavadorForReport(escavadorResults),
    extractedPersonData: extractedPersonData,
    socialProfiles: socialProfiles,
    nomeDescoberto: nomeDescoberto,
    documentoPesquisado: (isCpfSearch || isCnpjSearch) ? docInfo.formatted : null,
    tipoDocumento: tipo,
    confidence: confidenceData,
    filterStats: filterStats,
    totalProcessos: totalProcessos
  };
  
  // Passa o nome descoberto para a IA quando for CPF/CNPJ
  const queryForGemini = {
    fullName: nomeDescoberto,
    context: cleanContext || (isCnpjSearch ? 'empresa CNPJ' : (isCpfSearch ? 'pessoa CPF' : '')),
    notes,
    originalQuery: fullName,
    documentoFormatado: (isCpfSearch || isCnpjSearch) ? docInfo.formatted : null
  };
  
  const modelOut = await runGemini(queryForGemini, sources, additionalContext);
  
  // APLICAR CAP DE SCORE baseado em confidence
  if (modelOut.riskScore && modelOut.riskScore.value !== undefined) {
    const scoreCapped = applyScoreCap(
      modelOut.riskScore.value,
      identityConfidence,
      judicialConfidence
    );
    
    if (scoreCapped.capped) {
      console.log(`[Vyntara] ⚠️  Score limitado: ${scoreCapped.originalScore} → ${scoreCapped.score}`);
      scoreCapped.reasons.forEach(r => console.log(`[Vyntara]   ${r}`));
    }
    
    modelOut.riskScore.value = scoreCapped.score;
    modelOut.riskScore.capped = scoreCapped.capped;
    modelOut.riskScore.originalScore = scoreCapped.originalScore;
    modelOut.riskScore.capReasons = scoreCapped.reasons;
  }
  
  // Adicionar confidence ao output
  modelOut.confidence = confidenceData;
  
  await saveToDatabase(identificador, tipo, fullName, escavadorResults, sources, modelOut, confidenceData);
  
  const html = generateHtmlReport({ fullName, context, notes }, modelOut, additionalContext);
  
  return {
    ...modelOut,
    html,
    fromCache: false,
    sourcesCount: {
      escavador: escavadorResults.totalProcessos || 0,
      cse: allCseResults.length
    }
  };
}

module.exports = { generateOsintReport };
