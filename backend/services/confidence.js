/**
 * Módulo de Confidence Levels
 * 
 * Calcula níveis de confiança para identidade e dados judiciais
 * baseado no tipo de consulta e qualidade das âncoras encontradas.
 */

/**
 * Calcula confidence de identidade baseado em tipo de consulta e âncoras
 * 
 * @param {Object} params
 * @param {string} params.tipoConsulta - 'cpf', 'cnpj' ou 'nome'
 * @param {string} params.nomeOriginal - Nome pesquisado pelo usuário
 * @param {string} params.nomeEscavador - Nome encontrado no Escavador
 * @param {Array<string>} params.ufsEscavador - UFs dos processos encontrados
 * @param {Array<Object>} params.googleResults - Resultados do Google
 * @param {number} params.totalProcessos - Total de processos encontrados
 * @returns {Object} { level: 'ALTA'|'MEDIA'|'BAIXA', score: 0-1, justificativas: [] }
 */
function calculateIdentityConfidence(params) {
  const {
    tipoConsulta,
    nomeOriginal,
    nomeEscavador,
    ufsEscavador = [],
    googleResults = [],
    totalProcessos = 0
  } = params;

  let score = 0;
  const justificativas = [];

  // 1. Tipo de consulta (peso: 40%)
  if (tipoConsulta === 'cpf') {
    score += 0.4;
    justificativas.push('✓ Consulta por CPF (alta precisão)');
  } else if (tipoConsulta === 'cnpj') {
    score += 0.4;
    justificativas.push('✓ Consulta por CNPJ (alta precisão)');
  } else {
    score += 0.1;
    justificativas.push('⚠ Consulta por nome (risco de homônimos)');
  }

  // 2. Match de nome Escavador (peso: 25%)
  if (nomeEscavador && nomeOriginal) {
    const normalizado1 = normalizeForComparison(nomeOriginal);
    const normalizado2 = normalizeForComparison(nomeEscavador);
    
    if (normalizado1 === normalizado2) {
      score += 0.25;
      justificativas.push('✓ Nome exato confirmado pelo Escavador');
    } else if (normalizado2.includes(normalizado1) || normalizado1.includes(normalizado2)) {
      score += 0.15;
      justificativas.push('⚠ Nome parcialmente compatível');
    } else if (totalProcessos > 0) {
      score += 0.05;
      justificativas.push('⚠ Nome diferente do pesquisado');
    }
  }

  // 3. Consistência de UF (peso: 20%)
  if (ufsEscavador.length > 0) {
    const ufPrincipal = ufsEscavador[0];
    const ufsConsistentes = ufsEscavador.filter(uf => uf === ufPrincipal).length;
    const consistenciaUf = ufsConsistentes / ufsEscavador.length;
    
    if (consistenciaUf >= 0.8) {
      score += 0.2;
      justificativas.push(`✓ Alta concentração em ${ufPrincipal} (${Math.round(consistenciaUf * 100)}% processos)`);
    } else if (consistenciaUf >= 0.5) {
      score += 0.1;
      justificativas.push(`⚠ Moderada dispersão geográfica (${ufsEscavador.length} UFs)`);
    } else {
      score += 0.05;
      justificativas.push(`⚠ Alta dispersão geográfica (possível homônimo)`);
    }
  }

  // 4. Âncoras no Google (peso: 15%)
  const ancorasGoogle = countGoogleAnchors(googleResults, nomeEscavador || nomeOriginal, ufsEscavador);
  if (ancorasGoogle.linkedin || ancorasGoogle.instagram) {
    score += 0.15;
    justificativas.push(`✓ Redes sociais encontradas (LinkedIn: ${ancorasGoogle.linkedin ? 'Sim' : 'Não'}, Instagram: ${ancorasGoogle.instagram ? 'Sim' : 'Não'})`);
  } else if (ancorasGoogle.matchesComUf > 0) {
    score += 0.08;
    justificativas.push(`⚠ ${ancorasGoogle.matchesComUf} fontes com UF compatível`);
  } else if (googleResults.length > 0) {
    score += 0.03;
    justificativas.push(`⚠ Fontes web sem âncoras fortes`);
  }

  // Determinar level
  let level;
  if (score >= 0.75) {
    level = 'ALTA';
  } else if (score >= 0.45) {
    level = 'MEDIA';
  } else {
    level = 'BAIXA';
  }

  return {
    level,
    score: Math.round(score * 100) / 100,
    justificativas,
    detalhes: {
      tipoConsulta,
      temDocumento: tipoConsulta === 'cpf' || tipoConsulta === 'cnpj',
      matchNome: nomeEscavador ? normalizeForComparison(nomeOriginal) === normalizeForComparison(nomeEscavador) : false,
      ufPrincipal: ufsEscavador[0] || null,
      ancorasGoogle
    }
  };
}

/**
 * Calcula confidence judicial baseado na qualidade dos dados do Escavador
 * 
 * @param {Object} escavadorResults
 * @returns {Object} { level: 'ALTA'|'MEDIA'|'BAIXA', score: 0-1, justificativas: [] }
 */
function calculateJudicialConfidence(escavadorResults) {
  let score = 0;
  const justificativas = [];

  if (!escavadorResults || escavadorResults.error) {
    return {
      level: 'BAIXA',
      score: 0,
      justificativas: ['❌ Erro ao consultar Escavador'],
      cobertura: 'Nenhuma',
      limitacoes: ['Consulta judicial não foi possível']
    };
  }

  const totalProcessos = escavadorResults.totalProcessos || 0;
  const processos = escavadorResults.processos || [];
  const envolvido = escavadorResults.envolvido;

  // 1. Consulta bem-sucedida (peso: 30%)
  if (envolvido) {
    score += 0.3;
    justificativas.push(`✓ Envolvido identificado: ${envolvido.nome}`);
    
    if (envolvido.tipo_pessoa) {
      justificativas.push(`✓ Tipo: ${envolvido.tipo_pessoa}`);
    }
  } else if (totalProcessos === 0) {
    score += 0.2;
    justificativas.push('✓ Consulta realizada (0 processos encontrados)');
  }

  // 2. Qualidade dos dados dos processos (peso: 40%)
  if (processos.length > 0) {
    const processosCompletos = processos.filter(p => {
      const capa = p.fontes?.[0]?.capa || {};
      return p.numero_cnj && capa.classe && capa.assunto && p.data_inicio;
    }).length;

    const qualidade = processosCompletos / processos.length;
    
    if (qualidade >= 0.9) {
      score += 0.4;
      justificativas.push(`✓ ${processosCompletos} de ${processos.length} processos com dados completos`);
    } else if (qualidade >= 0.7) {
      score += 0.25;
      justificativas.push(`⚠ ${processosCompletos} de ${processos.length} processos com dados completos`);
    } else {
      score += 0.1;
      justificativas.push(`⚠ Poucos dados detalhados (${Math.round(qualidade * 100)}% completos)`);
    }
  } else {
    score += 0.3;
    justificativas.push('✓ Consulta completa (ausência confirmada de processos)');
  }

  // 3. Cobertura temporal e geográfica (peso: 30%)
  if (processos.length > 0) {
    const anos = processos.map(p => p.ano_inicio).filter(Boolean);
    const ufs = processos.map(p => p.estado_origem?.sigla).filter(Boolean);
    const tribunais = processos.map(p => p.fontes?.[0]?.sigla).filter(Boolean);

    const anoMaisAntigo = Math.min(...anos);
    const anoMaisRecente = Math.max(...anos);
    const rangeAnos = anoMaisRecente - anoMaisAntigo;

    if (rangeAnos >= 5) {
      score += 0.15;
      justificativas.push(`✓ Cobertura temporal ampla (${anoMaisAntigo}-${anoMaisRecente})`);
    } else if (rangeAnos >= 2) {
      score += 0.1;
      justificativas.push(`⚠ Cobertura temporal moderada (${rangeAnos} anos)`);
    }

    const ufsUnicas = [...new Set(ufs)];
    const tribunaisUnicos = [...new Set(tribunais)];
    
    if (ufsUnicas.length >= 2 || tribunaisUnicos.length >= 3) {
      score += 0.15;
      justificativas.push(`✓ Múltiplos tribunais (${tribunaisUnicos.join(', ')})`);
    } else {
      score += 0.1;
      justificativas.push(`✓ Tribunal principal: ${tribunaisUnicos[0] || 'N/A'}`);
    }
  } else {
    score += 0.3;
    justificativas.push('✓ Verificação completa em bases públicas disponíveis');
  }

  // Determinar level
  let level;
  if (score >= 0.8) {
    level = 'ALTA';
  } else if (score >= 0.5) {
    level = 'MEDIA';
  } else {
    level = 'BAIXA';
  }

  // Cobertura e limitações
  const cobertura = totalProcessos > 0 
    ? `Processos em ${[...new Set(processos.map(p => p.fontes?.[0]?.sigla))].filter(Boolean).join(', ')}`
    : 'Bases públicas disponíveis via Escavador';

  const limitacoes = [
    'Ausência de registros não garante inexistência de processos',
    'Pode haver latência de indexação (até 30 dias)',
    totalProcessos === 0 ? 'Processos em segredo de justiça não aparecem' : null,
    'Cobertura limitada a tribunais integrados ao Escavador'
  ].filter(Boolean);

  return {
    level,
    score: Math.round(score * 100) / 100,
    justificativas,
    cobertura,
    limitacoes,
    detalhes: {
      totalProcessos,
      temEnvolvido: !!envolvido,
      qualidadeDados: processos.length > 0 ? 'completa' : 'n/a'
    }
  };
}

/**
 * Normaliza string para comparação (remove acentos, lowercase, etc)
 */
function normalizeForComparison(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Conta âncoras no Google (LinkedIn, Instagram, matches com UF, etc)
 */
function countGoogleAnchors(googleResults, nome, ufs) {
  const anchors = {
    linkedin: false,
    instagram: false,
    facebook: false,
    twitter: false,
    matchesComUf: 0,
    fontesProfissionais: 0
  };

  if (!googleResults || !googleResults.length) {
    return anchors;
  }

  const nomeNorm = normalizeForComparison(nome);

  googleResults.forEach(result => {
    const url = result.url || '';
    const text = `${result.title} ${result.snippet}`.toLowerCase();
    const textNorm = normalizeForComparison(text);

    // Redes sociais
    if (url.includes('linkedin.com/in/')) anchors.linkedin = true;
    if (url.includes('instagram.com/')) anchors.instagram = true;
    if (url.includes('facebook.com/')) anchors.facebook = true;
    if (url.includes('twitter.com/') || url.includes('x.com/')) anchors.twitter = true;

    // Fontes profissionais
    if (url.includes('lattes.cnpq.br') || url.includes('escavador.com')) {
      anchors.fontesProfissionais++;
    }

    // Matches com UF
    if (ufs && ufs.length > 0) {
      const hasUfMatch = ufs.some(uf => 
        text.includes(` ${uf.toLowerCase()} `) || 
        text.includes(`/${uf.toLowerCase()}`) ||
        text.includes(`-${uf.toLowerCase()}`)
      );
      
      if (hasUfMatch && textNorm.includes(nomeNorm)) {
        anchors.matchesComUf++;
      }
    }
  });

  return anchors;
}

/**
 * Calcula cap de score baseado em confidence
 * 
 * @param {number} originalScore - Score original (0-100)
 * @param {Object} identityConfidence - Resultado de calculateIdentityConfidence
 * @param {Object} judicialConfidence - Resultado de calculateJudicialConfidence
 * @returns {Object} { score: number, capped: boolean, reason: string }
 */
function applyScoreCap(originalScore, identityConfidence, judicialConfidence) {
  let maxScore = 100;
  const reasons = [];

  // Cap por identidade baixa
  if (identityConfidence.level === 'BAIXA') {
    maxScore = Math.min(maxScore, 40);
    reasons.push('Limitado a 40 por baixa confiança de identidade (risco de homônimo)');
  } else if (identityConfidence.level === 'MEDIA') {
    maxScore = Math.min(maxScore, 70);
    reasons.push('Limitado a 70 por confiança média de identidade');
  }

  // Cap por judicial baixa (só se não tiver processos e identidade também for baixa)
  if (judicialConfidence.level === 'BAIXA' && identityConfidence.level === 'BAIXA') {
    maxScore = Math.min(maxScore, 35);
    reasons.push('Limitado a 35 por baixa confiança judicial E de identidade');
  }

  const cappedScore = Math.min(originalScore, maxScore);
  const wasCapped = cappedScore < originalScore;

  return {
    score: cappedScore,
    capped: wasCapped,
    originalScore: wasCapped ? originalScore : null,
    maxAllowed: maxScore,
    reasons: wasCapped ? reasons : []
  };
}

module.exports = {
  calculateIdentityConfidence,
  calculateJudicialConfidence,
  applyScoreCap,
  normalizeForComparison
};
