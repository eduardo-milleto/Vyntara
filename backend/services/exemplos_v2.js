/**
 * VYNTARA V2 - Exemplos de Uso
 * 
 * Demonstra como usar os novos módulos de segurança e qualidade
 */

const { calculateIdentityConfidence, calculateJudicialConfidence, applyScoreCap } = require('./confidence');
const { filterEvidence, getFilterStats } = require('./evidenceFilter');
const { redactForAI, redactForLogs, detectSensitiveData } = require('./redact');
const { generateDisclaimers, formatDisclaimersForWhatsApp } = require('./disclaimers');

// ============================================
// EXEMPLO 1: Confidence Levels
// ============================================

function exemploConfidence() {
  console.log('\n=== EXEMPLO 1: CONFIDENCE LEVELS ===\n');
  
  // Cenário A: Consulta por CPF (confiança ALTA esperada)
  const confidenceCPF = calculateIdentityConfidence({
    tipoConsulta: 'cpf',
    nomeOriginal: '036.568.590-94',
    nomeEscavador: 'CARLOS EDUARDO PEDROSO MILLETO',
    ufsEscavador: ['RS', 'RS', 'RS'],
    googleResults: [
      { url: 'https://linkedin.com/in/carlos-milleto', title: 'Carlos Milleto - RS' }
    ],
    totalProcessos: 3
  });
  
  console.log('Consulta por CPF:');
  console.log(`  Nível: ${confidenceCPF.level}`); // Esperado: ALTA
  console.log(`  Score: ${confidenceCPF.score}`);
  console.log('  Justificativas:');
  confidenceCPF.justificativas.forEach(j => console.log(`    - ${j}`));
  
  // Cenário B: Consulta por nome comum (confiança BAIXA esperada)
  const confidenceNome = calculateIdentityConfidence({
    tipoConsulta: 'nome',
    nomeOriginal: 'João Silva',
    nomeEscavador: 'JOAO DA SILVA',
    ufsEscavador: ['SP', 'RJ', 'MG', 'RS', 'BA'], // Muito disperso
    googleResults: [
      { url: 'https://facebook.com/joao.silva.123', title: 'João Silva' }
    ],
    totalProcessos: 10
  });
  
  console.log('\nConsulta por nome comum:');
  console.log(`  Nível: ${confidenceNome.level}`); // Esperado: BAIXA
  console.log(`  Score: ${confidenceNome.score}`);
  console.log('  Justificativas:');
  confidenceNome.justificativas.forEach(j => console.log(`    - ${j}`));
}

// ============================================
// EXEMPLO 2: Evidence Filter
// ============================================

function exemploEvidenceFilter() {
  console.log('\n=== EXEMPLO 2: EVIDENCE FILTER ===\n');
  
  const fontesMock = [
    {
      url: 'https://www.tjrs.jus.br/processo/123',
      title: 'Processo 123 - TJRS',
      snippet: 'Processo de Carlos Eduardo Milleto em Porto Alegre'
    },
    {
      url: 'https://linkedin.com/in/carlos-milleto',
      title: 'Carlos Milleto - LinkedIn',
      snippet: 'Empresário em Porto Alegre, RS'
    },
    {
      url: 'https://archive.org/download/random.pdf',
      title: 'Download PDF grátis',
      snippet: 'Baixe agora'
    },
    {
      url: 'https://studocu.com/documento-123',
      title: 'Documento compartilhado',
      snippet: 'Arquivo de estudante'
    },
    {
      url: 'https://g1.globo.com/rs/noticia-carlos-milleto',
      title: 'Empresário de Porto Alegre inaugura nova sede',
      snippet: 'Carlos Milleto, empresário gaúcho...'
    }
  ];
  
  const baseProfile = {
    nome: 'Carlos Eduardo Milleto',
    ufsAtuacao: ['RS'],
    cidadesAtuacao: ['Porto Alegre'],
    empresas: ['Incomum Treinamentos']
  };
  
  const fontesClassificadas = filterEvidence(fontesMock, baseProfile);
  const stats = getFilterStats(fontesClassificadas);
  
  console.log('Estatísticas do filtro:');
  console.log(`  Total: ${stats.total}`);
  console.log(`  ✓ Aceitas: ${stats.aceitas}`);
  console.log(`  ⚠ Sinais fracos: ${stats.sinaisFracos}`);
  console.log(`  ✗ Descartadas: ${stats.descartadas} (${stats.percentualDescarte}%)`);
  console.log(`  Compatibilidade média: ${stats.compatibilidadeMedia}`);
  
  console.log('\nDetalhamento por fonte:');
  fontesClassificadas.forEach((fonte, idx) => {
    console.log(`\n  Fonte ${idx + 1}: ${fonte.url}`);
    console.log(`    Categoria: ${fonte.categoria}`);
    console.log(`    Confiabilidade: ${fonte.confiabilidadeFonte}`);
    console.log(`    Compatibilidade: ${Math.round((fonte.compatibilidadeIdentidade || 0) * 100)}%`);
    console.log(`    Status: ${fonte.status}`);
    console.log(`    Peso: ${fonte.peso ? Math.round(fonte.peso * 100) + '%' : 'N/A'}`);
    if (fonte.motivos) {
      console.log(`    Motivos:`);
      fonte.motivos.forEach(m => console.log(`      - ${m}`));
    }
  });
}

// ============================================
// EXEMPLO 3: Redact de Dados Sensíveis
// ============================================

function exemploRedact() {
  console.log('\n=== EXEMPLO 3: REDACT DE DADOS SENSÍVEIS ===\n');
  
  const textoComDados = `
    Nome: Carlos Eduardo Milleto
    CPF: 036.568.590-94
    Telefone: (51) 99999-8888
    Email: carlos@exemplo.com.br
    Endereço: Rua dos Andradas, 1234, Porto Alegre-RS
    CEP: 90020-001
    Chave PIX: 03656859094
    Nascimento: 15/03/1980
  `;
  
  // Detectar dados sensíveis
  const deteccao = detectSensitiveData(textoComDados);
  console.log('Dados sensíveis detectados:');
  console.log(`  Encontrados: ${deteccao.hasSensitive ? 'Sim' : 'Não'}`);
  console.log(`  Tipos: ${deteccao.types.join(', ')}`);
  console.log(`  Quantidade: ${deteccao.count}`);
  
  // Redact para IA (preserva algum contexto)
  const textoRedactAI = redactForAI(textoComDados);
  console.log('\nTexto para IA (com contexto preservado):');
  console.log(textoRedactAI);
  
  // Redact para logs (mais agressivo)
  const textoRedactLogs = redactForLogs(textoComDados);
  console.log('\nTexto para logs (agressivo):');
  console.log(textoRedactLogs);
}

// ============================================
// EXEMPLO 4: Score Cap
// ============================================

function exemploScoreCap() {
  console.log('\n=== EXEMPLO 4: SCORE CAP ===\n');
  
  // Cenário: IA calculou score 85, mas confiança é BAIXA
  const identityConf = {
    level: 'BAIXA',
    score: 0.35
  };
  
  const judicialConf = {
    level: 'MEDIA',
    score: 0.65
  };
  
  const scoreOriginal = 85;
  
  const scoreCapped = applyScoreCap(scoreOriginal, identityConf, judicialConf);
  
  console.log('Aplicação de Score Cap:');
  console.log(`  Score original da IA: ${scoreOriginal}`);
  console.log(`  Confiança Identity: ${identityConf.level}`);
  console.log(`  Confiança Judicial: ${judicialConf.level}`);
  console.log(`  Score final (após cap): ${scoreCapped.score}`);
  console.log(`  Foi limitado? ${scoreCapped.capped ? 'Sim' : 'Não'}`);
  console.log(`  Máximo permitido: ${scoreCapped.maxAllowed}`);
  if (scoreCapped.capped) {
    console.log('  Razões:');
    scoreCapped.reasons.forEach(r => console.log(`    - ${r}`));
  }
}

// ============================================
// EXEMPLO 5: Disclaimers
// ============================================

function exemploDisclaimers() {
  console.log('\n=== EXEMPLO 5: DISCLAIMERS ===\n');
  
  // Mock de resultado da IA com confiança baixa
  const resultadoMock = {
    riskScore: {
      value: 40,
      level: 'MEDIO',
      capped: true,
      originalScore: 75,
      capReasons: ['Limitado a 40 por baixa confiança de identidade']
    },
    confidence: {
      identity: {
        level: 'BAIXA',
        score: 0.25,
        justificativas: ['⚠ Consulta por nome (risco de homônimos)']
      },
      judicial: {
        level: 'ALTA',
        score: 0.95,
        justificativas: ['✓ Consulta realizada (3 processos encontrados)'],
        cobertura: 'Processos em TJRS',
        limitacoes: ['Ausência de registros não garante inexistência']
      }
    }
  };
  
  const additionalContext = {
    totalProcessos: 3,
    filterStats: {
      total: 20,
      aceitas: 6,
      sinaisFracos: 2,
      descartadas: 12,
      percentualDescarte: 60
    }
  };
  
  const disclaimers = generateDisclaimers(resultadoMock, additionalContext);
  
  console.log(`Total de disclaimers: ${disclaimers.length}\n`);
  
  disclaimers.forEach((d, idx) => {
    console.log(`${d.icon} ${d.title} ${d.critical ? '⚠️ CRÍTICO' : ''}`);
    console.log(`   ${d.text.replace(/<[^>]*>/g, '')}\n`); // Remove HTML tags
  });
  
  // Formato WhatsApp
  console.log('\n--- FORMATO WHATSAPP ---\n');
  const whatsappText = formatDisclaimersForWhatsApp(disclaimers);
  console.log(whatsappText);
}

// ============================================
// EXECUTAR EXEMPLOS
// ============================================

if (require.main === module) {
  console.log('\n╔════════════════════════════════════════╗');
  console.log('║   VYNTARA V2 - EXEMPLOS DE USO        ║');
  console.log('╚════════════════════════════════════════╝');
  
  try {
    exemploConfidence();
    exemploEvidenceFilter();
    exemploRedact();
    exemploScoreCap();
    exemploDisclaimers();
    
    console.log('\n✅ Todos os exemplos executados com sucesso!\n');
  } catch (error) {
    console.error('\n❌ Erro ao executar exemplos:', error.message);
    console.error(error.stack);
  }
}

module.exports = {
  exemploConfidence,
  exemploEvidenceFilter,
  exemploRedact,
  exemploScoreCap,
  exemploDisclaimers
};
