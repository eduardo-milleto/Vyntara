const axios = require('axios');
const { config } = require('./config');

async function searchDatajud(query, options = {}) {
  if (!config.datajud.enabled) {
    console.log('[Vyntara DataJud] Serviço desabilitado');
    return { results: [], source: 'datajud', enabled: false };
  }

  const { tipo = 'pessoa', limit = 10 } = options;
  
  try {
    console.log(`[Vyntara DataJud] Buscando processos para: ${query}`);
    
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    if (config.datajud.apiKey) {
      headers['Authorization'] = `APIKey ${config.datajud.apiKey}`;
    }

    const tribunais = [
      'api_publica_tjsp',
      'api_publica_tjrj', 
      'api_publica_tjmg',
      'api_publica_tjrs',
      'api_publica_tjpr',
      'api_publica_tjsc',
      'api_publica_tjba',
      'api_publica_tjpe',
      'api_publica_tjce',
      'api_publica_tjgo'
    ];

    const allResults = [];
    
    for (const tribunal of tribunais) {
      try {
        // Dividir query para buscas mais flexíveis
        const parts = query.split(' ').filter(p => p.length > 0);
        const shouldClauses = [
          { match: { "numeroProcesso": query } }
        ];
        
        // Adicionar buscas por wildcard para cada palavra-chave
        parts.forEach(part => {
          if (part.length > 2) {
            shouldClauses.push(
              { wildcard: { "dadosBasicos.polo_ativo": `*${part.toLowerCase()}*` } },
              { wildcard: { "dadosBasicos.polo_passivo": `*${part.toLowerCase()}*` } }
            );
          }
        });

        const response = await axios({
          method: 'POST',
          url: `${config.datajud.baseUrl}/${tribunal}/_search`,
          headers,
          timeout: config.fetch.timeoutMs,
          data: {
            query: {
              bool: {
                should: shouldClauses,
                minimum_should_match: 1
              }
            },
            size: limit,
            _source: [
              "numeroProcesso",
              "classe.nome",
              "orgaoJulgador.nome",
              "dataAjuizamento",
              "grau",
              "assuntos",
              "movimentos"
            ]
          }
        });

        if (response.data?.hits?.hits) {
          const hits = response.data.hits.hits.map(hit => ({
            numero: hit._source?.numeroProcesso,
            classe: hit._source?.classe?.nome,
            orgao: hit._source?.orgaoJulgador?.nome,
            dataAjuizamento: hit._source?.dataAjuizamento,
            grau: hit._source?.grau,
            assuntos: hit._source?.assuntos?.map(a => a.nome).join(', '),
            tribunal: tribunal.replace('api_publica_', '').toUpperCase(),
            movimentos: hit._source?.movimentos?.slice(0, 3)
          }));
          allResults.push(...hits);
        }
      } catch (err) {
        console.log(`[Vyntara DataJud] Erro no ${tribunal}: ${err.message}`);
      }
    }

    console.log(`[Vyntara DataJud] Encontrados ${allResults.length} processos`);

    return {
      results: allResults.slice(0, limit),
      source: 'datajud',
      enabled: true,
      total: allResults.length
    };

  } catch (error) {
    console.error('[Vyntara DataJud] Erro na busca:', error.message);
    return {
      results: [],
      source: 'datajud',
      enabled: true,
      error: error.message
    };
  }
}

async function getProcessoDetalhes(numeroProcesso) {
  if (!config.datajud.enabled) {
    return null;
  }

  try {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    if (config.datajud.apiKey) {
      headers['Authorization'] = `APIKey ${config.datajud.apiKey}`;
    }

    const response = await axios({
      method: 'POST',
      url: `${config.datajud.baseUrl}/api_publica_tjsp/_search`,
      headers,
      timeout: config.fetch.timeoutMs,
      data: {
        query: {
          match: { "numeroProcesso": numeroProcesso }
        },
        size: 1
      }
    });

    if (response.data?.hits?.hits?.[0]) {
      return response.data.hits.hits[0]._source;
    }

    return null;
  } catch (error) {
    console.error('[Vyntara DataJud] Erro ao buscar detalhes:', error.message);
    return null;
  }
}

function formatProcessosForReport(processos) {
  if (!processos || processos.length === 0) {
    return 'Nenhum processo judicial público encontrado nos tribunais consultados.';
  }

  let report = `### Processos Judiciais Encontrados (${processos.length})\n\n`;

  processos.forEach((p, i) => {
    report += `**${i + 1}. Processo ${p.numero || 'N/A'}**\n`;
    report += `- Tribunal: ${p.tribunal || 'N/A'}\n`;
    report += `- Classe: ${p.classe || 'N/A'}\n`;
    report += `- Órgão Julgador: ${p.orgao || 'N/A'}\n`;
    report += `- Data de Ajuizamento: ${p.dataAjuizamento || 'N/A'}\n`;
    report += `- Grau: ${p.grau || 'N/A'}\n`;
    if (p.assuntos) {
      report += `- Assuntos: ${p.assuntos}\n`;
    }
    report += '\n';
  });

  return report;
}

module.exports = {
  searchDatajud,
  getProcessoDetalhes,
  formatProcessosForReport
};
