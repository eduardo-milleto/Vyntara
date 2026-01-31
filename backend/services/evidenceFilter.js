/**
 * Evidence Filter - Classificação e filtragem de fontes OSINT
 * 
 * Filtra ruído e classifica confiabilidade de cada fonte encontrada
 * para garantir análise de máxima qualidade.
 */

const { normalizeForComparison } = require('./confidence');

/**
 * Filtra e classifica todas as evidências encontradas
 * 
 * @param {Array<Object>} sources - Fontes do Google CSE
 * @param {Object} baseProfile - Perfil base construído a partir do Escavador
 * @returns {Array<Object>} Fontes classificadas com status e confiabilidade
 */
function filterEvidence(sources, baseProfile) {
  if (!sources || !sources.length) {
    return [];
  }

  return sources.map(source => {
    const classification = classifySource(source, baseProfile);
    
    return {
      ...source,
      categoria: classification.categoria,
      confiabilidadeFonte: classification.confiabilidade,
      compatibilidadeIdentidade: classification.compatibilidade,
      status: classification.status,
      motivos: classification.motivos,
      peso: classification.peso
    };
  });
}

/**
 * Classifica uma fonte individual
 */
function classifySource(source, baseProfile) {
  const url = (source.url || '').toLowerCase();
  const title = (source.title || '').toLowerCase();
  const snippet = (source.snippet || '').toLowerCase();
  const fullText = `${title} ${snippet}`;

  // 1. DESCARTE AUTOMÁTICO - Fontes não confiáveis
  const blocklist = checkBlocklist(url, title);
  if (blocklist.blocked) {
    return {
      categoria: 'DESCARTADA',
      confiabilidade: 'MUITO_BAIXA',
      compatibilidade: 0,
      status: 'DESCARTADA',
      motivos: blocklist.motivos,
      peso: 0
    };
  }

  // 2. CATEGORIA DA FONTE
  const categoria = determineCategory(url);

  // 3. CONFIABILIDADE DA FONTE (independente da identidade)
  const confiabilidadeFonte = determineSourceTrust(url, categoria);

  // 4. COMPATIBILIDADE DE IDENTIDADE
  const compatibilidade = calculateIdentityMatch(
    fullText,
    baseProfile.nome,
    baseProfile.ufsAtuacao,
    baseProfile.cidadesAtuacao,
    baseProfile.empresas
  );

  // 5. STATUS FINAL (ACEITA, SINAL_FRACO, DESCARTADA)
  const status = determineStatus(confiabilidadeFonte, compatibilidade, categoria);

  // 6. PESO (para IA considerar)
  const peso = calculateWeight(confiabilidadeFonte, compatibilidade, categoria);

  // 7. MOTIVOS (justificativas)
  const motivos = generateReasons(
    confiabilidadeFonte,
    compatibilidade,
    categoria,
    status,
    url
  );

  return {
    categoria,
    confiabilidade: confiabilidadeFonte,
    compatibilidade,
    status,
    motivos,
    peso
  };
}

/**
 * Verifica blocklist de fontes não confiáveis
 */
function checkBlocklist(url, title) {
  const blocked = [];

  // PDFs aleatórios (exceto tribunais)
  if (url.endsWith('.pdf') && !url.match(/tj[a-z]{2}\.jus\.br|trt\d+\.jus\.br|stf\.jus\.br/)) {
    blocked.push('PDF de fonte não judicial');
  }

  // Sites de compartilhamento de arquivos
  if (url.includes('archive.org') || 
      url.includes('studocu.com') ||
      url.includes('slideshare.net') ||
      url.includes('scribd.com') ||
      url.includes('academia.edu')) {
    blocked.push('Site de compartilhamento de documentos');
  }

  // Agregadores genéricos
  if (url.includes('jusbrasil.com.br') && !url.includes('/artigos/') && !url.includes('/noticias/')) {
    blocked.push('Agregador genérico (preferir fonte primária)');
  }

  // Fóruns e Q&A
  if (url.includes('stackoverflow.com') ||
      url.includes('reddit.com') ||
      url.includes('quora.com') ||
      url.includes('yahoo.com/answers')) {
    blocked.push('Fórum/Q&A não confiável para OSINT');
  }

  // Spam/SEO
  if (title.includes('download') && title.includes('grátis')) {
    blocked.push('Possível spam/SEO');
  }

  return {
    blocked: blocked.length > 0,
    motivos: blocked
  };
}

/**
 * Determina categoria da fonte
 */
function determineCategory(url) {
  // JUDICIAL (máxima confiança)
  if (url.match(/tj[a-z]{2}\.jus\.br|trt\d+\.jus\.br|stf\.jus\.br|stj\.jus\.br|trf\d+\.jus\.br/)) {
    return 'JUDICIAL';
  }
  if (url.includes('escavador.com')) {
    return 'JUDICIAL';
  }

  // PROFISSIONAL (alta confiança)
  if (url.includes('linkedin.com/in/')) {
    return 'PROFISSIONAL';
  }
  if (url.includes('lattes.cnpq.br')) {
    return 'ACADEMICO';
  }

  // MÍDIA (confiança variável)
  if (url.match(/\.com\.br\/(noticias|noticia|n\/)|\/news\/|\/artigos\//)) {
    return 'MIDIA';
  }
  if (url.includes('g1.globo.com') || 
      url.includes('folha.uol.com.br') ||
      url.includes('estadao.com.br') ||
      url.includes('uol.com.br')) {
    return 'MIDIA_GRANDE';
  }

  // REDES SOCIAIS (confiança baixa-média)
  if (url.includes('instagram.com/')) {
    return 'SOCIAL_INSTAGRAM';
  }
  if (url.includes('facebook.com/')) {
    return 'SOCIAL_FACEBOOK';
  }
  if (url.includes('twitter.com/') || url.includes('x.com/')) {
    return 'SOCIAL_TWITTER';
  }

  // EMPRESARIAL
  if (url.includes('cnpj.biz') || 
      url.includes('empresascnpj.com') ||
      url.includes('consultasocio.com')) {
    return 'EMPRESARIAL';
  }

  // GOVERNO/TRANSPARÊNCIA
  if (url.includes('.gov.br')) {
    return 'GOVERNO';
  }

  return 'OUTRO';
}

/**
 * Determina confiabilidade da fonte (independente da identidade)
 */
function determineSourceTrust(url, categoria) {
  const trustMap = {
    'JUDICIAL': 'MUITO_ALTA',
    'GOVERNO': 'MUITO_ALTA',
    'ACADEMICO': 'ALTA',
    'PROFISSIONAL': 'ALTA',
    'MIDIA_GRANDE': 'ALTA',
    'EMPRESARIAL': 'MEDIA',
    'MIDIA': 'MEDIA',
    'SOCIAL_INSTAGRAM': 'BAIXA',
    'SOCIAL_FACEBOOK': 'BAIXA',
    'SOCIAL_TWITTER': 'BAIXA',
    'OUTRO': 'MUITO_BAIXA'
  };

  return trustMap[categoria] || 'MUITO_BAIXA';
}

/**
 * Calcula compatibilidade de identidade (0.0 a 1.0)
 */
function calculateIdentityMatch(text, nome, ufs = [], cidades = [], empresas = []) {
  if (!text || !nome) return 0;

  let score = 0;
  const textNorm = normalizeForComparison(text);
  const nomeNorm = normalizeForComparison(nome);

  // 1. Nome completo presente (40%)
  if (textNorm.includes(nomeNorm)) {
    score += 0.4;
  } else {
    // Nome parcial (primeiro + último nome)
    const partesNome = nomeNorm.split(' ').filter(p => p.length > 2);
    if (partesNome.length >= 2) {
      const primeiroUltimo = `${partesNome[0]} ${partesNome[partesNome.length - 1]}`;
      if (textNorm.includes(primeiroUltimo)) {
        score += 0.2;
      }
    }
  }

  // 2. UF/Estado presente (30%)
  if (ufs && ufs.length > 0) {
    const hasUfMatch = ufs.some(uf => {
      const ufLower = uf.toLowerCase();
      return textNorm.includes(` ${ufLower} `) || 
             textNorm.includes(`/${ufLower}`) ||
             textNorm.includes(`-${ufLower}`) ||
             textNorm.includes(`, ${ufLower}`);
    });
    if (hasUfMatch) score += 0.3;
  }

  // 3. Cidade presente (20%)
  if (cidades && cidades.length > 0) {
    const hasCidadeMatch = cidades.some(cidade => {
      const cidadeNorm = normalizeForComparison(cidade);
      return textNorm.includes(cidadeNorm);
    });
    if (hasCidadeMatch) score += 0.2;
  }

  // 4. Empresa mencionada (10%)
  if (empresas && empresas.length > 0) {
    const hasEmpresaMatch = empresas.some(empresa => {
      const empresaNorm = normalizeForComparison(empresa);
      return textNorm.includes(empresaNorm);
    });
    if (hasEmpresaMatch) score += 0.1;
  }

  return Math.min(score, 1.0);
}

/**
 * Determina status final (ACEITA, SINAL_FRACO, DESCARTADA)
 */
function determineStatus(confiabilidade, compatibilidade, categoria) {
  // Fontes judiciais sempre aceitas (são a âncora)
  if (categoria === 'JUDICIAL' || categoria === 'GOVERNO') {
    return 'ACEITA';
  }

  // Alta confiabilidade + compatibilidade razoável
  if ((confiabilidade === 'MUITO_ALTA' || confiabilidade === 'ALTA') && compatibilidade >= 0.3) {
    return 'ACEITA';
  }

  // Confiabilidade média + compatibilidade alta
  if (confiabilidade === 'MEDIA' && compatibilidade >= 0.5) {
    return 'ACEITA';
  }

  // LinkedIn/redes profissionais sempre aceitas se tiver match de nome
  if (categoria === 'PROFISSIONAL' && compatibilidade >= 0.2) {
    return 'ACEITA';
  }

  // Mídia grande com match mínimo
  if (categoria === 'MIDIA_GRANDE' && compatibilidade >= 0.4) {
    return 'ACEITA';
  }

  // Sinal fraco: pode ter informação útil mas baixa certeza
  if (compatibilidade >= 0.3 && compatibilidade < 0.5) {
    return 'SINAL_FRACO';
  }

  if (confiabilidade === 'MEDIA' && compatibilidade >= 0.2) {
    return 'SINAL_FRACO';
  }

  // Descartar o resto
  return 'DESCARTADA';
}

/**
 * Calcula peso da evidência para a IA (0.0 a 1.0)
 */
function calculateWeight(confiabilidade, compatibilidade, categoria) {
  const trustWeights = {
    'MUITO_ALTA': 1.0,
    'ALTA': 0.8,
    'MEDIA': 0.5,
    'BAIXA': 0.3,
    'MUITO_BAIXA': 0.1
  };

  const baseWeight = trustWeights[confiabilidade] || 0.1;
  
  // Peso final é média ponderada de confiabilidade (60%) e compatibilidade (40%)
  return (baseWeight * 0.6) + (compatibilidade * 0.4);
}

/**
 * Gera motivos/justificativas da classificação
 */
function generateReasons(confiabilidade, compatibilidade, categoria, status, url) {
  const reasons = [];

  // Categoria
  const categoryLabels = {
    'JUDICIAL': 'Fonte judicial oficial',
    'GOVERNO': 'Portal governamental',
    'PROFISSIONAL': 'Rede profissional (LinkedIn/Lattes)',
    'ACADEMICO': 'Fonte acadêmica',
    'MIDIA_GRANDE': 'Mídia de grande circulação',
    'MIDIA': 'Veículo de notícias',
    'EMPRESARIAL': 'Base empresarial',
    'SOCIAL_INSTAGRAM': 'Rede social (Instagram)',
    'SOCIAL_FACEBOOK': 'Rede social (Facebook)',
    'SOCIAL_TWITTER': 'Rede social (Twitter/X)',
    'OUTRO': 'Fonte web genérica'
  };
  reasons.push(categoryLabels[categoria] || 'Fonte não classificada');

  // Confiabilidade
  if (confiabilidade === 'MUITO_ALTA' || confiabilidade === 'ALTA') {
    reasons.push(`Confiabilidade ${confiabilidade.toLowerCase().replace('_', ' ')}`);
  } else if (confiabilidade === 'MUITO_BAIXA' || confiabilidade === 'BAIXA') {
    reasons.push(`⚠ Confiabilidade ${confiabilidade.toLowerCase().replace('_', ' ')}`);
  }

  // Compatibilidade
  if (compatibilidade >= 0.7) {
    reasons.push(`Alta compatibilidade de identidade (${Math.round(compatibilidade * 100)}%)`);
  } else if (compatibilidade >= 0.4) {
    reasons.push(`Compatibilidade moderada (${Math.round(compatibilidade * 100)}%)`);
  } else if (compatibilidade > 0) {
    reasons.push(`⚠ Baixa compatibilidade (${Math.round(compatibilidade * 100)}%)`);
  } else {
    reasons.push('⚠ Sem match de identidade');
  }

  // Status
  if (status === 'ACEITA') {
    reasons.push('✓ Aceita para análise');
  } else if (status === 'SINAL_FRACO') {
    reasons.push('⚠ Sinal fraco (considerar com cautela)');
  } else {
    reasons.push('✗ Descartada (ruído/baixa relevância)');
  }

  return reasons;
}

/**
 * Retorna estatísticas do filtro
 */
function getFilterStats(filteredSources) {
  const stats = {
    total: filteredSources.length,
    aceitas: 0,
    sinaisFracos: 0,
    descartadas: 0,
    porCategoria: {},
    porConfiabilidade: {},
    compatibilidadeMedia: 0
  };

  let somaCompatibilidade = 0;

  filteredSources.forEach(source => {
    // Status
    if (source.status === 'ACEITA') stats.aceitas++;
    else if (source.status === 'SINAL_FRACO') stats.sinaisFracos++;
    else if (source.status === 'DESCARTADA') stats.descartadas++;

    // Categoria
    stats.porCategoria[source.categoria] = (stats.porCategoria[source.categoria] || 0) + 1;

    // Confiabilidade
    stats.porConfiabilidade[source.confiabilidadeFonte] = (stats.porConfiabilidade[source.confiabilidadeFonte] || 0) + 1;

    // Compatibilidade
    somaCompatibilidade += source.compatibilidadeIdentidade || 0;
  });

  stats.compatibilidadeMedia = filteredSources.length > 0 
    ? Math.round((somaCompatibilidade / filteredSources.length) * 100) / 100
    : 0;

  stats.percentualDescarte = filteredSources.length > 0
    ? Math.round((stats.descartadas / filteredSources.length) * 100)
    : 0;

  return stats;
}

module.exports = {
  filterEvidence,
  classifySource,
  getFilterStats
};
