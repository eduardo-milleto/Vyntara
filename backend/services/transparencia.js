const axios = require('axios');
const { config } = require('./config');

async function searchTransparencia(query, options = {}) {
  if (!config.transparencia.enabled) {
    console.log('[Vyntara Transparência] Serviço desabilitado');
    return { results: [], source: 'transparencia', enabled: false };
  }

  if (!config.transparencia.apiKey) {
    console.log('[Vyntara Transparência] API Key não configurada');
    return { results: [], source: 'transparencia', enabled: true, error: 'API Key não configurada' };
  }

  const { tipo = 'pessoa', cpfCnpj = null } = options;
  
  try {
    console.log(`[Vyntara Transparência] Buscando dados para: ${query}`);
    
    const headers = {
      'Accept': 'application/json',
      'chave-api-dados': config.transparencia.apiKey
    };

    const allResults = {
      servidores: [],
      contratos: [],
      convenios: [],
      licitacoes: [],
      sancoes: [],
      ceisEntries: [],
      cnepEntries: []
    };

    if (cpfCnpj) {
      const cpfCnpjLimpo = cpfCnpj.replace(/\D/g, '');
      
      try {
        const servidoresResponse = await axios({
          method: 'GET',
          url: `${config.transparencia.baseUrl}/servidores/cpf/${cpfCnpjLimpo}`,
          headers,
          timeout: config.fetch.timeoutMs
        });
        if (servidoresResponse.data) {
          allResults.servidores = Array.isArray(servidoresResponse.data) 
            ? servidoresResponse.data 
            : [servidoresResponse.data];
        }
      } catch (err) {
        if (err.response?.status !== 404) {
          console.log('[Vyntara Transparência] Erro servidores:', err.message);
        }
      }

      try {
        const ceisResponse = await axios({
          method: 'GET',
          url: `${config.transparencia.baseUrl}/ceis/cpf/${cpfCnpjLimpo}`,
          headers,
          timeout: config.fetch.timeoutMs
        });
        if (ceisResponse.data) {
          allResults.ceisEntries = Array.isArray(ceisResponse.data) 
            ? ceisResponse.data 
            : [ceisResponse.data];
        }
      } catch (err) {
        if (err.response?.status !== 404) {
          console.log('[Vyntara Transparência] Erro CEIS:', err.message);
        }
      }

      try {
        const cnepResponse = await axios({
          method: 'GET',
          url: `${config.transparencia.baseUrl}/cnep/cpf/${cpfCnpjLimpo}`,
          headers,
          timeout: config.fetch.timeoutMs
        });
        if (cnepResponse.data) {
          allResults.cnepEntries = Array.isArray(cnepResponse.data) 
            ? cnepResponse.data 
            : [cnepResponse.data];
        }
      } catch (err) {
        if (err.response?.status !== 404) {
          console.log('[Vyntara Transparência] Erro CNEP:', err.message);
        }
      }

      if (cpfCnpjLimpo.length === 14) {
        try {
          const contratosResponse = await axios({
            method: 'GET',
            url: `${config.transparencia.baseUrl}/contratos/cnpj/${cpfCnpjLimpo}`,
            headers,
            timeout: config.fetch.timeoutMs,
            params: { pagina: 1, quantidade: 10 }
          });
          if (contratosResponse.data) {
            allResults.contratos = Array.isArray(contratosResponse.data) 
              ? contratosResponse.data 
              : [contratosResponse.data];
          }
        } catch (err) {
          if (err.response?.status !== 404) {
            console.log('[Vyntara Transparência] Erro contratos:', err.message);
          }
        }

        try {
          const licitacoesResponse = await axios({
            method: 'GET',
            url: `${config.transparencia.baseUrl}/licitacoes/cnpj/${cpfCnpjLimpo}`,
            headers,
            timeout: config.fetch.timeoutMs,
            params: { pagina: 1, quantidade: 10 }
          });
          if (licitacoesResponse.data) {
            allResults.licitacoes = Array.isArray(licitacoesResponse.data) 
              ? licitacoesResponse.data 
              : [licitacoesResponse.data];
          }
        } catch (err) {
          if (err.response?.status !== 404) {
            console.log('[Vyntara Transparência] Erro licitações:', err.message);
          }
        }
      }
    }

    const totalResults = 
      allResults.servidores.length + 
      allResults.contratos.length + 
      allResults.convenios.length +
      allResults.licitacoes.length +
      allResults.sancoes.length +
      allResults.ceisEntries.length +
      allResults.cnepEntries.length;

    console.log(`[Vyntara Transparência] Encontrados ${totalResults} registros`);

    return {
      results: allResults,
      source: 'transparencia',
      enabled: true,
      total: totalResults
    };

  } catch (error) {
    console.error('[Vyntara Transparência] Erro na busca:', error.message);
    return {
      results: {},
      source: 'transparencia',
      enabled: true,
      error: error.message
    };
  }
}

async function searchServidorPorNome(nome) {
  if (!config.transparencia.enabled || !config.transparencia.apiKey) {
    return [];
  }

  try {
    const headers = {
      'Accept': 'application/json',
      'chave-api-dados': config.transparencia.apiKey
    };

    const response = await axios({
      method: 'GET',
      url: `${config.transparencia.baseUrl}/servidores`,
      headers,
      timeout: config.fetch.timeoutMs,
      params: {
        nome: nome,
        pagina: 1,
        quantidade: 10
      }
    });

    return response.data || [];
  } catch (error) {
    console.error('[Vyntara Transparência] Erro busca servidor:', error.message);
    return [];
  }
}

function formatTransparenciaForReport(data) {
  if (!data || !data.results) {
    return 'Nenhum dado encontrado no Portal da Transparência.';
  }

  const r = data.results;
  let report = '';

  if (r.servidores && r.servidores.length > 0) {
    report += `### Vínculos com o Serviço Público (${r.servidores.length})\n\n`;
    r.servidores.forEach((s, i) => {
      report += `**${i + 1}. ${s.nome || 'N/A'}**\n`;
      report += `- Órgão: ${s.orgaoExercicio || s.orgao || 'N/A'}\n`;
      report += `- Cargo: ${s.cargo || 'N/A'}\n`;
      report += `- Situação: ${s.situacaoVinculo || 'N/A'}\n`;
      if (s.remuneracaoBasicaBruta) {
        report += `- Remuneração Bruta: R$ ${parseFloat(s.remuneracaoBasicaBruta).toLocaleString('pt-BR')}\n`;
      }
      report += '\n';
    });
  }

  if (r.ceisEntries && r.ceisEntries.length > 0) {
    report += `### ⚠️ Cadastro de Empresas Inidôneas e Suspensas - CEIS (${r.ceisEntries.length})\n\n`;
    r.ceisEntries.forEach((c, i) => {
      report += `**${i + 1}. Sanção**\n`;
      report += `- Tipo: ${c.tipoSancao || 'N/A'}\n`;
      report += `- Órgão Sancionador: ${c.orgaoSancionador?.nome || 'N/A'}\n`;
      report += `- Data Início: ${c.dataInicioSancao || 'N/A'}\n`;
      report += `- Data Fim: ${c.dataFimSancao || 'N/A'}\n`;
      report += '\n';
    });
  }

  if (r.cnepEntries && r.cnepEntries.length > 0) {
    report += `### ⚠️ Cadastro Nacional de Empresas Punidas - CNEP (${r.cnepEntries.length})\n\n`;
    r.cnepEntries.forEach((c, i) => {
      report += `**${i + 1}. Punição**\n`;
      report += `- Tipo: ${c.tipoSancao || 'N/A'}\n`;
      report += `- Fundamentação: ${c.fundamentacao || 'N/A'}\n`;
      report += `- Data: ${c.dataPublicacao || 'N/A'}\n`;
      report += '\n';
    });
  }

  if (r.contratos && r.contratos.length > 0) {
    report += `### Contratos com o Governo Federal (${r.contratos.length})\n\n`;
    r.contratos.forEach((c, i) => {
      report += `**${i + 1}. Contrato ${c.numero || 'N/A'}**\n`;
      report += `- Órgão: ${c.unidadeGestora?.nome || 'N/A'}\n`;
      report += `- Objeto: ${c.objeto || 'N/A'}\n`;
      report += `- Valor: R$ ${c.valorInicial ? parseFloat(c.valorInicial).toLocaleString('pt-BR') : 'N/A'}\n`;
      report += '\n';
    });
  }

  if (r.licitacoes && r.licitacoes.length > 0) {
    report += `### Participação em Licitações (${r.licitacoes.length})\n\n`;
    r.licitacoes.forEach((l, i) => {
      report += `**${i + 1}. Licitação ${l.numero || 'N/A'}**\n`;
      report += `- Modalidade: ${l.modalidadeLicitacao || 'N/A'}\n`;
      report += `- Situação: ${l.situacao || 'N/A'}\n`;
      report += '\n';
    });
  }

  if (!report) {
    return 'Nenhum registro encontrado no Portal da Transparência para os dados informados.';
  }

  return report;
}

module.exports = {
  searchTransparencia,
  searchServidorPorNome,
  formatTransparenciaForReport
};
