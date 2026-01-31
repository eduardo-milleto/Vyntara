const { VertexAI } = require('@google-cloud/vertexai');
const { GoogleAuth } = require('google-auth-library');
const { config } = require('./config');
const { redactForAI } = require('./redact');

function getGoogleAuthClient() {
  if (config.gcp.clientEmail && config.gcp.privateKey) {
    return new GoogleAuth({
      credentials: {
        client_email: config.gcp.clientEmail,
        private_key: config.gcp.privateKey.replace(/\\n/g, '\n'),
        project_id: config.gcp.projectId
      },
      scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
  }
  return new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
  });
}

function buildEvidenceBlock(sources, additionalContext = {}) {
  // Inclui informações de classificação do evidence filter
  const filterStats = additionalContext.filterStats;
  
  let header = '';
  if (filterStats) {
    header = `### ESTATÍSTICAS DE EVIDÊNCIAS ###
Total de fontes coletadas: ${filterStats.total}
Fontes aceitas (alta confiabilidade): ${filterStats.aceitas}
Sinais fracos (considerar com cautela): ${filterStats.sinaisFracos}
Descartadas (ruído/baixa relevância): ${filterStats.descartadas}
Percentual de descarte: ${filterStats.percentualDescarte}%
Compatibilidade média de identidade: ${filterStats.compatibilidadeMedia}

### EVIDÊNCIAS CLASSIFICADAS (por ordem de confiabilidade) ###

`;
  }
  
  return header + sources.map((s, idx) => {
    const snippet = s.snippet ? redactForAI(s.snippet) : '';
    const fetched = s.fetchedText ? redactForAI(s.fetchedText) : '';
    
    const classification = s.categoria ? `
CLASSIFICAÇÃO:
  Categoria: ${s.categoria}
  Confiabilidade da fonte: ${s.confiabilidadeFonte || 'N/A'}
  Compatibilidade de identidade: ${Math.round((s.compatibilidadeIdentidade || 0) * 100)}%
  Status: ${s.status || 'N/A'}
  Peso: ${s.peso ? Math.round(s.peso * 100) + '%' : 'N/A'}
  Motivos: ${s.motivos ? s.motivos.join('; ') : 'N/A'}` : '';
    
    return [
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
      `EVIDÊNCIA #${idx + 1}`,
      `URL: ${s.url}`,
      s.title ? `TÍTULO: ${s.title}` : '',
      classification,
      snippet ? `RESUMO: ${snippet}` : '',
      fetched ? `CONTEÚDO EXTRAÍDO: ${fetched}` : ''
    ].filter(Boolean).join('\n');
  }).join('\n\n');
}

function buildEscavadorBlock(escavadorData) {
  if (!escavadorData || escavadorData.error || !escavadorData.processos?.length) {
    return 'Nenhum processo judicial encontrado no Escavador.';
  }
  
  const MAX_PROCESSOS_DETALHADOS = 30;
  const processos = escavadorData.processos.slice(0, MAX_PROCESSOS_DETALHADOS);
  const totalReal = escavadorData.totalProcessos || escavadorData.processos.length;
  
  let block = `TOTAL DE PROCESSOS: ${totalReal}\n`;
  if (totalReal > MAX_PROCESSOS_DETALHADOS) {
    block += `(Mostrando os ${MAX_PROCESSOS_DETALHADOS} mais recentes para análise)\n`;
  }
  block += '\n';
  
  if (escavadorData.envolvido) {
    block += `=== DADOS DO PESQUISADO ===\n`;
    block += `NOME ENCONTRADO: ${escavadorData.envolvido.nome || 'N/A'}\n`;
    block += `TIPO: ${escavadorData.envolvido.tipo_pessoa || 'N/A'}\n`;
    block += `QUANTIDADE CPFs COM ESSE NOME: ${escavadorData.envolvido.cpfs_com_esse_nome || 'N/A'}\n\n`;
  }
  
  block += '=== LISTA DETALHADA DE PROCESSOS ===\n\n';
  
  processos.forEach((p, idx) => {
    const capa = p.fontes?.[0]?.capa || {};
    const fonte = p.fontes?.[0] || {};
    const envolvidos = fonte.envolvidos || [];
    
    block += `━━━ PROCESSO ${idx + 1} ━━━\n`;
    block += `Número CNJ: ${p.numero_cnj}\n`;
    block += `Polo Ativo (Autor): ${p.titulo_polo_ativo || 'N/A'}\n`;
    block += `Polo Passivo (Réu): ${p.titulo_polo_passivo || 'N/A'}\n`;
    block += `Data de Início: ${p.data_inicio || 'N/A'}\n`;
    block += `Ano de Início: ${p.ano_inicio || 'N/A'}\n`;
    block += `Estado: ${p.estado_origem?.sigla || 'N/A'}\n`;
    block += `Cidade: ${p.unidade_origem?.cidade || 'N/A'}\n`;
    block += `Tribunal: ${fonte.sigla || 'N/A'}\n`;
    block += `Órgão Julgador: ${capa.orgao_julgador || 'N/A'}\n`;
    block += `Grau: ${fonte.grau_formatado || 'N/A'}\n`;
    block += `Área: ${capa.area || 'N/A'}\n`;
    block += `Classe: ${capa.classe || 'N/A'}\n`;
    block += `Assunto Completo: ${capa.assunto || 'N/A'}\n`;
    block += `Valor da Causa: ${capa.valor_causa?.valor_formatado || 'Não informado'}\n`;
    block += `Status do Processo: ${fonte.status_predito || 'N/A'}\n`;
    block += `Segredo de Justiça: ${fonte.segredo_justica ? 'Sim' : 'Não'}\n`;
    block += `Movimentações: ${p.quantidade_movimentacoes || 0}\n`;
    block += `Última Movimentação: ${p.data_ultima_movimentacao || 'N/A'}\n`;
    
    // ENVOLVIDOS COM CPF/CNPJ (limitado para evitar timeout)
    const envolvidosPrincipais = envolvidos.filter(e => 
      e.polo === 'ATIVO' || e.polo === 'PASSIVO' || e.tipo_normalizado === 'Autor' || e.tipo_normalizado === 'Réu'
    ).slice(0, 5);
    
    if (envolvidosPrincipais.length > 0) {
      block += `\n--- PARTES PRINCIPAIS ---\n`;
      envolvidosPrincipais.forEach(env => {
        block += `  • ${env.nome} (${env.tipo_normalizado || env.tipo})\n`;
        if (env.cpf) block += `    CPF: ${env.cpf}\n`;
        if (env.cnpj) block += `    CNPJ: ${env.cnpj}\n`;
      });
    }
    
    block += '\n';
  });
  
  return block;
}

function buildExtractedDataBlock(extractedData, socialProfiles) {
  let block = '';
  
  if (socialProfiles && Object.keys(socialProfiles).length > 0) {
    block += '### PERFIS EM REDES SOCIAIS ENCONTRADOS:\n';
    for (const [platform, profile] of Object.entries(socialProfiles)) {
      block += `\n${profile.icon || ''} ${profile.platform || platform.toUpperCase()}:\n`;
      block += `  URL: ${profile.url}\n`;
      block += `  Título: ${profile.title || 'N/A'}\n`;
      block += `  Descrição: ${profile.snippet || 'N/A'}\n`;
    }
    block += '\n';
  }
  
  if (extractedData) {
    if (extractedData.locations && extractedData.locations.length > 0) {
      block += `### LOCALIZAÇÕES IDENTIFICADAS:\n`;
      extractedData.locations.forEach(loc => {
        block += `  - ${loc}\n`;
      });
      block += '\n';
    }
    
    if (extractedData.companies && extractedData.companies.length > 0) {
      block += `### EMPRESAS/EMPREGOS IDENTIFICADOS:\n`;
      extractedData.companies.forEach(company => {
        block += `  - ${company}\n`;
      });
      block += '\n';
    }
    
    if (extractedData.estimatedAge) {
      block += `### IDADE ESTIMADA: ${extractedData.estimatedAge} anos\n\n`;
    }
    
    if (extractedData.news && extractedData.news.length > 0) {
      block += `### NOTÍCIAS ENCONTRADAS:\n`;
      extractedData.news.forEach((news, idx) => {
        block += `\nNOTÍCIA ${idx + 1}:\n`;
        block += `  Título: ${news.title}\n`;
        block += `  URL: ${news.url}\n`;
        block += `  Resumo: ${news.snippet}\n`;
      });
      block += '\n';
    }
  }
  
  return block || 'Nenhum dado adicional extraído das buscas.';
}

const SYSTEM = `
Você é um analista de inteligência pública (OSINT) especializado em due diligence empresarial e pessoal no Brasil. Seu trabalho é analisar TODAS as evidências fornecidas e produzir um relatório estruturado, detalhado e profissional.

FONTES DE DADOS:
1. ESCAVADOR: Base de dados judicial brasileira com processos de todos os tribunais
2. GOOGLE AVANÇADO: Buscas específicas em redes sociais, notícias, empresas e localização
3. DADOS EXTRAÍDOS: Perfis de redes sociais, localização, empresas, idade e notícias identificados automaticamente

REGRAS FUNDAMENTAIS:
- Analise TODAS as fontes fornecidas com atenção máxima
- Extraia TODAS as informações relevantes: processos judiciais, vínculos empresariais, notícias, redes sociais, localização, etc
- NUNCA invente dados. Se uma seção não tem informação, indique claramente
- NÃO inclua dados sensíveis: telefone, e-mail, endereço residencial, documentos pessoais (CPF/CNPJ)
- Responda em português brasileiro, de forma clara, objetiva e detalhada
- Seu objetivo é fornecer um relatório completo e minucioso para due diligence

ANÁLISE DE PERFIL PESSOAL (OBRIGATÓRIO):
Para cada pessoa pesquisada, identifique:
- Nome completo (se diferente do pesquisado)
- Localização/cidade (estado/país)
- Idade aproximada (se encontrada)
- Perfis de redes sociais (LinkedIn, Instagram, Facebook, Twitter/X)
- Empresas onde trabalha ou trabalhou
- Cargo/posição profissional
- Notícias relevantes sobre a pessoa

ANÁLISE DE PROCESSOS JUDICIAIS (OBRIGATÓRIO):
Para cada processo encontrado, analise:
- Tipo de processo (cível, trabalhista, criminal, tributário, etc)
- Posição do pesquisado (autor/réu)
- Gravidade e impacto potencial
- Status atual (ativo, arquivado, em recurso)
- Valores envolvidos
- Histórico de disputas recorrentes

CÁLCULO DE RISCO:
- BAIXO (0-25): Sem processos ou apenas processos menores como autor, perfil limpo
- MÉDIO (26-50): Alguns processos como réu, mas sem gravidade; questões trabalhistas comuns
- ALTO (51-75): Múltiplos processos como réu, valores significativos, padrão de litígios
- CRÍTICO (76-100): Processos criminais, fraudes, valores muito altos, restrições judiciais

IMPORTANTE: Forneça uma análise MINUCIOSA e DETALHADA. O usuário precisa entender completamente o perfil de risco da pessoa/empresa pesquisada.
`.trim();

const OUTPUT_SCHEMA = `
Responda ESTRITAMENTE em JSON válido (sem markdown, sem \`\`\`) com este formato DETALHADO:

{
  "queryUsed": "string - a consulta utilizada",
  
  "summary": "string - RESUMO EXECUTIVO DETALHADO em 3-4 parágrafos. DEVE CONTER: (1) Quem é a pessoa, idade aproximada (deduzida de datas de processos/documentos), localização principal, profissão/atividade; (2) Situação judicial geral com DATAS específicas (processo mais antigo de XXXX, mais recente de XXXX); (3) Destaques de risco se houver; (4) Padrão comportamental identificado. Seja narrativo como um detetive relatando uma investigação.",
  
  "perfilPessoal": {
    "nomeCompleto": "string - nome completo da pessoa",
    "localizacao": "string - cidade/estado principal (ex: 'Porto Alegre/RS') + outras cidades onde aparece em processos",
    "idadeAproximada": "string - idade ESTIMADA com base em datas dos processos (ex: 'Entre 35-45 anos baseado no histórico') ou 'Não foi possível estimar'",
    "profissao": "string - profissão DEDUZIDA dos processos trabalhistas, empresariais, etc. (ex: 'Empresário do ramo de construção' se tem empresa de empreiteira)",
    "empresaAtual": "string - nome da empresa atual ou mais recente identificada nos processos",
    "empresasRelacionadas": ["string - lista de TODAS as empresas onde a pessoa aparece como sócio, representante ou envolvido"],
    "vinculosIdentificados": "string - relações identificadas (ex: 'Sócio de empresa X, teve processos trabalhistas indicando atividade como empregador')",
    "redesSociais": {
      "linkedin": "string - URL completa ou 'Não encontrado'",
      "instagram": "string - @ ou URL ou 'Não encontrado'",
      "facebook": "string - URL ou 'Não encontrado'"
    }
  },
  
  "dadosCadastrais": {
    "cpf": "string - CPF encontrado (formato: XXX.XXX.XXX-XX) ou 'Não identificado'",
    "cnpj": "string - CNPJ relacionado ou 'Não identificado'",
    "tiposPessoa": "string - FÍSICA ou JURÍDICA",
    "outrosCpfsCnpjRelacionados": ["string - outros documentos encontrados vinculados à pessoa"]
  },
  
  "cronologiaJudicial": {
    "primeiroProcesso": "string - data e descrição do primeiro processo (ex: 'Maio/2010 - Ação trabalhista em SP')",
    "ultimoProcesso": "string - data e descrição do processo mais recente",
    "periodoAtivo": "string - período de atividade judicial (ex: '2010 a 2024 - 14 anos de histórico')",
    "picosDeProcessos": ["string - anos com maior concentração de processos (ex: '2021 - 5 processos novos')"]
  },
  
  "resumoJudicial": {
    "totalProcessos": 0,
    "processosAtivos": 0,
    "comoAutor": 0,
    "comoReu": 0,
    "valorTotalEnvolvido": "string - soma aproximada (ex: R$ 150.000,00)",
    "maiorValorIndividual": "string - maior valor de processo individual",
    "tribunaisEnvolvidos": ["string - lista de tribunais onde aparece (TJSP, TRT-2, etc)"],
    "estadosEnvolvidos": ["string - estados onde tem processos"],
    "processosPorTipo": {
      "trabalhista": 0,
      "civel": 0,
      "tributario": 0,
      "criminal": 0,
      "bancario": 0,
      "execucaoFiscal": 0,
      "familia": 0,
      "outros": 0
    },
    "processosGraves": [
      {
        "numeroCnj": "string - número do processo",
        "tipo": "string - Criminal, Execução Fiscal, Execução de Dívida, etc",
        "descricao": "string - descrição DETALHADA do processo (qual acusação, qual dívida, etc)",
        "dataInicio": "string - data de início do processo (MM/AAAA)",
        "valorOuPena": "string - valor da causa ou tipo de pena/crime",
        "posicao": "string - Autor, Réu, Executado, etc",
        "parteContraria": "string - quem é a outra parte (banco, empresa, Ministério Público, etc)",
        "status": "string - ATIVO, INATIVO, Arquivado",
        "tribunal": "string - qual tribunal"
      }
    ],
    "analiseResumo": "string - análise DETALHADA em 2-3 parágrafos sobre: (1) padrão de litígios, (2) se é mais réu ou autor, (3) se há tendência a inadimplência/conflitos trabalhistas/crimes, (4) evolução ao longo do tempo"
  },
  
  "perfilComportamental": "string - análise PSICOLÓGICA/COMPORTAMENTAL baseada nos processos. Ex: 'Perfil indica pessoa com histórico de conflitos trabalhistas recorrentes, sugerindo possíveis problemas como empregador. Processos bancários múltiplos indicam possível gestão financeira problemática.'",
  
  "alertasImportantes": ["string - alertas ESPECÍFICOS com datas. Ex: 'Processo criminal por lesão corporal iniciado em 03/2023 - ainda ativo'"],
  
  "conclusao": {
    "resumoFinal": "string - conclusão em 2 parágrafos: primeiro sobre o perfil geral, segundo com recomendações implícitas para quem está avaliando a pessoa",
    "nivelRisco": "string - BAIXO, MÉDIO, ALTO ou CRÍTICO baseado nos achados",
    "observacao": "As informações acima são públicas. A avaliação de risco fica a critério do usuário."
  },
  
  "sources": [],
  "limitations": []
}

REGRAS OBRIGATÓRIAS:
1. NUNCA mencione "Escavador", "DataJud", "Google" ou qualquer nome de fonte/sistema
2. NUNCA mencione números técnicos como "36 CPFs associados" ou "múltiplos CPFs"
3. SEMPRE inclua DATAS específicas dos processos mais importantes
4. SEMPRE tente DEDUZIR idade, profissão e perfil da pessoa com base nos dados
5. Para processos CRIMINAIS, EXECUÇÕES ou ALTO VALOR (>R$50.000), inclua TODOS os detalhes disponíveis
6. Analise o PADRÃO comportamental - recorrência de tipos de processo indica perfil
7. Identifique TODAS as empresas relacionadas à pessoa
8. Seja investigativo e detalhista como um detetive profissional
9. O relatório deve permitir que alguém tome uma decisão informada sobre a pessoa
`.trim();

async function runGemini(req, sources, additionalContext = {}) {
  // ============================================
  // IA EM 2 ETAPAS PARA MÁXIMA QUALIDADE
  // Etapa A: Extração factual (sem opinião)
  // Etapa B: Síntese + análise + scoring
  // ============================================
  
  const useTwoStepAI = true; // Flag para controlar (pode ser config)
  
  if (useTwoStepAI) {
    return await runGeminiTwoStep(req, sources, additionalContext);
  } else {
    return await runGeminiSingleStep(req, sources, additionalContext);
  }
}

/**
 * IA EM 2 ETAPAS - Máxima qualidade e rastreabilidade
 */
async function runGeminiTwoStep(req, sources, additionalContext = {}) {
  console.log('[Vyntara] ========================================');
  console.log('[Vyntara] IA EM 2 ETAPAS (Extração + Síntese)');
  console.log('[Vyntara] ========================================');
  
  // Usa GOOGLE_APPLICATION_CREDENTIALS definido pelo server.js
  const vertexAI = new VertexAI({
    project: config.gcp.projectId,
    location: config.gcp.location
  });

  const queryUsed = `${req.fullName} ${req.context || ''}`.trim();
  const googleEvidence = buildEvidenceBlock(sources, additionalContext);
  const escavadorEvidence = buildEscavadorBlock(additionalContext.escavador);
  const extractedDataEvidence = buildExtractedDataBlock(
    additionalContext.extractedPersonData, 
    additionalContext.socialProfiles
  );
  
  const confidenceContext = additionalContext.confidence ? `

====================================
## NÍVEIS DE CONFIANÇA
====================================
IDENTIDADE: ${additionalContext.confidence.identity.level} (Score: ${additionalContext.confidence.identity.score})
Justificativas:
${additionalContext.confidence.identity.justificativas.map(j => `  - ${j}`).join('\n')}

JUDICIAL: ${additionalContext.confidence.judicial.level} (Score: ${additionalContext.confidence.judicial.score})
Justificativas:
${additionalContext.confidence.judicial.justificativas.map(j => `  - ${j}`).join('\n')}
Cobertura: ${additionalContext.confidence.judicial.cobertura}
Limitações:
${additionalContext.confidence.judicial.limitacoes.map(l => `  - ${l}`).join('\n')}
` : '';

  // ============================================
  // ETAPA A: EXTRAÇÃO FACTUAL (sem opinião)
  // ============================================
  
  console.log('[Vyntara] Etapa A: Extração factual...');
  
  const extractionModel = vertexAI.getGenerativeModel({
    model: 'gemini-2.0-flash-001',
    generationConfig: {
      temperature: 0.1, // Baixa temperatura = mais determinístico
      maxOutputTokens: 8192
    },
    systemInstruction: {
      role: 'system',
      parts: [{ text: `Você é um extrator de dados OSINT. Sua única função é extrair fatos objetivos das evidências fornecidas, SEM fazer análises, opiniões ou conclusões. Responda APENAS em JSON válido.` }]
    }
  });

  const extractionPrompt = `
Tarefa: Extrair FATOS OBJETIVOS das evidências fornecidas. NÃO faça análises ou conclusões.

CONSULTA: "${queryUsed}"
${confidenceContext}

====================================
## DADOS EXTRAÍDOS AUTOMATICAMENTE:
====================================
${extractedDataEvidence}

====================================
## DADOS DO ESCAVADOR (Processos Judiciais):
====================================
${escavadorEvidence}

====================================
## EVIDÊNCIAS WEB:
====================================
${googleEvidence || 'Nenhum resultado encontrado na busca web.'}

====================================
INSTRUÇÕES:
====================================
Extraia APENAS fatos objetivos em JSON (sem markdown):

{
  "identidadeExtraida": {
    "nomeCompleto": "string ou null",
    "idadeAproximada": "string ou null",
    "localizacoes": ["cidade-UF"],
    "profissao": "string ou null",
    "empresas": ["nome empresa"]
  },
  "redesSociaisExtraidas": {
    "linkedin": "URL ou null",
    "instagram": "URL ou null",
    "facebook": "URL ou null",
    "twitter": "URL ou null",
    "outras": ["URLs"]
  },
  "processosExtraidos": [
    {
      "numeroCnj": "string",
      "tipo": "string",
      "posicao": "Autor ou Réu",
      "parteContraria": "string",
      "valorCausa": "string",
      "tribunal": "string",
      "status": "string",
      "dataInicio": "string",
      "assunto": "string"
    }
  ],
  "noticiasExtraidas": [
    {
      "titulo": "string",
      "fonte": "string",
      "url": "string",
      "resumo": "string"
    }
  ],
  "fontesAceitas": ["URLs das evidências aceitas"],
  "fontesDescartadas": ["URLs descartadas com motivo"],
  "observacoes": ["fatos adicionais objetivos"]
}
`.trim();

  let extraction;
  try {
    const extractionResult = await extractionModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: extractionPrompt }] }]
    });

    const extractionText = extractionResult.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleanedText = extractionText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    extraction = JSON.parse(cleanedText);
    
    console.log('[Vyntara] ✓ Etapa A concluída');
    console.log(`[Vyntara]   Processos extraídos: ${extraction.processosExtraidos?.length || 0}`);
    console.log(`[Vyntara]   Notícias extraídas: ${extraction.noticiasExtraidas?.length || 0}`);
    console.log(`[Vyntara]   Fontes aceitas: ${extraction.fontesAceitas?.length || 0}`);
    
  } catch (error) {
    console.error('[Vyntara] ✗ Erro na Etapa A:', error.message);
    // Fallback para método single-step
    console.log('[Vyntara] Fallback para método single-step...');
    return await runGeminiSingleStep(req, sources, additionalContext);
  }

  // ============================================
  // ETAPA B: SÍNTESE + ANÁLISE + SCORING
  // ============================================
  
  console.log('[Vyntara] Etapa B: Síntese e análise...');
  
  const analysisModel = vertexAI.getGenerativeModel({
    model: 'gemini-2.0-flash-001',
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 8192
    },
    systemInstruction: {
      role: 'system',
      parts: [{ text: SYSTEM }]
    }
  });

  const analysisPrompt = `
Tarefa: Produzir ANÁLISE COMPLETA baseado nos fatos extraídos na Etapa A.

CONSULTA: "${queryUsed}"
NOTAS DO USUÁRIO: "${req.notes || 'Nenhuma nota adicional'}"
${confidenceContext}

====================================
## FATOS EXTRAÍDOS (ETAPA A):
====================================
${JSON.stringify(extraction, null, 2)}

====================================
## DADOS ORIGINAIS DO ESCAVADOR (para contexto):
====================================
${escavadorEvidence}

====================================
INSTRUÇÕES PARA ANÁLISE:
====================================
1. Use APENAS os fatos da Etapa A
2. Analise padrões nos processos judiciais
3. Avalie gravidade e impacto de cada processo
4. Calcule risk score baseado em evidências
5. Se CONFIDENCE IDENTITY = BAIXA, mencione risco de homônimo
6. Se 0 processos, NÃO diga "perfil limpo", diga "não encontrados nas bases consultadas"
7. Forneça análise detalhada e profissional

${OUTPUT_SCHEMA}
`.trim();

  try {
    const analysisResult = await analysisModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: analysisPrompt }] }]
    });

    const analysisText = analysisResult.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleanedText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let parsed = JSON.parse(cleanedText);
    
    // Adiciona dados da extração ao output final
    parsed._extraction = extraction; // Rastreabilidade
    parsed._twoStepAI = true;
    
    console.log('[Vyntara] ✓ Etapa B concluída');
    console.log('[Vyntara] ========================================');
    
    parsed.sources = Array.from(new Set([
      ...(parsed.sources || []),
      ...(extraction.fontesAceitas || [])
    ]));
    
    if (additionalContext.escavador?.totalProcessos > 0) {
      parsed.sources.push('https://api.escavador.com');
    }

    return parsed;
    
  } catch (error) {
    console.error('[Vyntara] ✗ Erro na Etapa B:', error.message);
    // Retorna ao menos a extração
    return {
      queryUsed,
      summary: 'Erro na síntese. Dados extraídos disponíveis.',
      extraction: extraction,
      riskScore: { value: 0, level: 'BAIXO', methodology: 'Erro na análise' },
      sources: extraction.fontesAceitas || []
    };
  }
}

/**
 * IA EM 1 ETAPA - Método original (fallback)
 */
async function runGeminiSingleStep(req, sources, additionalContext = {}) {
  console.log('[Vyntara] IA em etapa única (método tradicional)');
  
  // Usa GOOGLE_APPLICATION_CREDENTIALS definido pelo server.js
  const vertexAI = new VertexAI({
    project: config.gcp.projectId,
    location: config.gcp.location
  });

  const generativeModel = vertexAI.getGenerativeModel({
    model: 'gemini-2.0-flash-001',
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 8192
    },
    systemInstruction: {
      role: 'system',
      parts: [{ text: SYSTEM }]
    }
  });

  const queryUsed = `${req.fullName} ${req.context || ''}`.trim();
  const googleEvidence = buildEvidenceBlock(sources, additionalContext);
  const escavadorEvidence = buildEscavadorBlock(additionalContext.escavador);
  const extractedDataEvidence = buildExtractedDataBlock(
    additionalContext.extractedPersonData, 
    additionalContext.socialProfiles
  );
  
  const confidenceWarning = additionalContext.confidence?.identity?.level === 'BAIXA' ? `

⚠️ ATENÇÃO: Confiança de identidade BAIXA (${additionalContext.confidence.identity.score}). 
Possível homônimo. Consulta por nome sem âncoras fortes.
Recomenda-se confirmar identidade por CPF/CNPJ antes de decisões importantes.
` : '';

  const prompt = `
Tarefa: Produzir um relatório de inteligência pública (OSINT) DETALHADO e MINUCIOSO.

CONSULTA: "${queryUsed}"
NOTAS DO USUÁRIO: "${req.notes || 'Nenhuma nota adicional'}"
${confidenceWarning}

====================================
## DADOS EXTRAÍDOS AUTOMATICAMENTE (Redes Sociais, Localização, Empresas, Notícias):
====================================
${extractedDataEvidence}

====================================
## DADOS DO ESCAVADOR (Processos Judiciais):
====================================
${escavadorEvidence}

====================================
## DADOS DO GOOGLE (Fontes Web Detalhadas):
====================================
${googleEvidence || 'Nenhum resultado encontrado na busca web.'}

====================================
## INSTRUÇÕES PARA ANÁLISE:
====================================
1. PRIORIZE os dados extraídos automaticamente (redes sociais, localização, empresas, notícias)
2. Preencha TODOS os campos do perfilPessoal com as informações encontradas
3. Liste TODAS as redes sociais encontradas com seus URLs
4. Analise CADA processo judicial individualmente
5. Classifique os processos por tipo (trabalhista, cível, criminal, etc)
6. Identifique padrões (ex: múltiplos processos trabalhistas = possível problema com funcionários)
7. Calcule o risco considerando: quantidade, valores, tipos e posição (autor/réu)
8. Extraia TODAS as informações adicionais das fontes Google
9. Forneça uma conclusão DETALHADA e PROFISSIONAL

IMPORTANTE: O usuário precisa de uma análise COMPLETA incluindo perfil pessoal, redes sociais, empresas e processos judiciais.

${OUTPUT_SCHEMA}
`.trim();

  try {
    const result = await generativeModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });

    const response = result.response;
    let text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (parseError) {
      console.error('[Vyntara] Erro ao parsear JSON:', parseError.message);
      console.log('[Vyntara] Resposta raw:', text.slice(0, 500));
      
      parsed = {
        queryUsed,
        summary: 'Falha ao processar resposta do modelo. Tente novamente.',
        riskScore: { value: 0, level: 'BAIXO', methodology: 'N/A' },
        analiseJudicial: { 
          totalProcessos: additionalContext.escavador?.totalProcessos || 0,
          processosAtivos: 0,
          processosInativos: 0,
          comoAutor: 0,
          comoReu: 0,
          processosDetalhados: []
        },
        sources: sources.map(s => s.url),
        limitations: ['O modelo não retornou JSON válido nesta tentativa.']
      };
    }

    parsed.sources = Array.from(new Set(parsed.sources || []));
    
    if (additionalContext.escavador?.totalProcessos > 0) {
      parsed.sources.push('https://api.escavador.com');
    }

    return parsed;
  } catch (error) {
    console.error('[Vyntara] Erro no Gemini:', error.message);
    throw error;
  }
}

async function regenerateSynthesis(existingAnalysis, queryUsed) {
  console.log('[Vyntara] Regenerando síntese para consulta existente...');
  
  const vertexAI = new VertexAI({
    project: config.gcp.projectId,
    location: config.gcp.location
  });

  const analysisModel = vertexAI.getGenerativeModel({
    model: 'gemini-2.0-flash-001',
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 8192
    },
    systemInstruction: {
      role: 'system',
      parts: [{ text: SYSTEM }]
    }
  });

  const extraction = existingAnalysis.extraction || existingAnalysis._extraction || {};
  const confidence = existingAnalysis.confidence || {};
  
  const confidenceContext = confidence.identity ? `
CONFIDENCE IDENTITY: ${confidence.identity.level} (${confidence.identity.score})
Justificativas: ${(confidence.identity.justificativas || []).join(', ')}

CONFIDENCE JUDICIAL: ${confidence.judicial?.level || 'N/A'} (${confidence.judicial?.score || 'N/A'})
Cobertura: ${confidence.judicial?.cobertura || 'N/A'}
` : '';

  const analysisPrompt = `
Tarefa: Produzir ANÁLISE COMPLETA baseado nos fatos extraídos.

CONSULTA: "${queryUsed}"
${confidenceContext}

====================================
## FATOS EXTRAÍDOS:
====================================
${JSON.stringify(extraction, null, 2)}

====================================
INSTRUÇÕES PARA ANÁLISE:
====================================
1. Use APENAS os fatos extraídos acima
2. Analise padrões nos processos judiciais
3. Avalie gravidade e impacto de cada processo
4. Se CONFIDENCE IDENTITY = BAIXA, mencione risco de homônimo
5. Se 0 processos, NÃO diga "perfil limpo", diga "não encontrados nas bases consultadas"
6. Forneça análise detalhada e profissional
7. A avaliação de risco fica a critério do usuário

${OUTPUT_SCHEMA}
`.trim();

  try {
    const analysisResult = await analysisModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: analysisPrompt }] }]
    });

    const analysisText = analysisResult.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleanedText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let parsed = JSON.parse(cleanedText);
    
    parsed._extraction = extraction;
    parsed._regenerated = true;
    parsed.confidence = confidence;
    
    parsed.sources = Array.from(new Set([
      ...(parsed.sources || []),
      ...(existingAnalysis.sources || []),
      ...(extraction.fontesAceitas || [])
    ]));

    console.log('[Vyntara] ✓ Síntese regenerada com sucesso');
    return parsed;
    
  } catch (error) {
    console.error('[Vyntara] ✗ Erro ao regenerar síntese:', error.message);
    throw error;
  }
}

async function compareNamesWithAI(nome1, nome2) {
  if (!nome1 || !nome2) return false;
  
  // Normalizar nomes para comparação básica primeiro
  const normalize = (n) => n.toLowerCase().trim().replace(/\s+/g, ' ');
  const n1 = normalize(nome1);
  const n2 = normalize(nome2);
  
  // Se forem idênticos após normalização
  if (n1 === n2) return true;
  
  // Se um contém o outro
  if (n1.includes(n2) || n2.includes(n1)) return true;
  
  // Comparar primeiro nome
  const firstName1 = n1.split(' ')[0];
  const firstName2 = n2.split(' ')[0];
  if (firstName1 === firstName2 && firstName1.length > 2) {
    // Mesmo primeiro nome, verificar sobrenome parcial
    const lastName1 = n1.split(' ').slice(-1)[0];
    const lastName2 = n2.split(' ').slice(-1)[0];
    if (lastName1 === lastName2) return true;
  }
  
  // Se a comparação básica não funcionou, usar IA
  try {
    const prompt = `Compare estes dois nomes e responda APENAS "SIM" se forem a mesma pessoa (mesmo com variações de escrita, abreviações ou nomes incompletos) ou "NAO" se forem pessoas diferentes:

Nome 1: "${nome1}"
Nome 2: "${nome2}"

Responda apenas SIM ou NAO:`;

    const result = await generativeModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 10,
        temperature: 0.1
      }
    });
    
    const response = result.response.text().trim().toUpperCase();
    return response.includes('SIM');
  } catch (error) {
    console.error('[Vyntara] Erro na comparação de nomes via IA:', error.message);
    return false;
  }
}

module.exports = { runGemini, regenerateSynthesis, compareNamesWithAI };
