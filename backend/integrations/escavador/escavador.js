const axios = require('axios');

const ESCAVADOR_API_BASE = 'https://api.escavador.com/api/v2';

async function getEscavadorToken() {
  const token = process.env.escavador_api;
  if (!token) {
    console.log('[Escavador] Token não configurado');
    return null;
  }
  return token;
}

async function searchProcessosByDocument(cpfCnpj) {
  const token = await getEscavadorToken();
  if (!token) {
    return { error: 'Token não configurado', total: 0 };
  }

  try {
    const cleanDoc = cpfCnpj.replace(/\D/g, '');
    console.log(`[Escavador] ========================================`);
    console.log(`[Escavador] Buscando processos para documento: ${cleanDoc}`);
    console.log(`[Escavador] Endpoint: ${ESCAVADOR_API_BASE}/envolvido/processos`);
    
    const response = await axios.get(`${ESCAVADOR_API_BASE}/envolvido/processos`, {
      params: { cpf_cnpj: cleanDoc },
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    const data = response.data;
    const creditosUsados = response.headers['creditos-utilizados'] || 'N/A';
    
    console.log(`[Escavador] Status: ${response.status}`);
    console.log(`[Escavador] Créditos utilizados: ${creditosUsados}`);
    console.log(`[Escavador] Payload Response:`, JSON.stringify(data, null, 2));
    console.log(`[Escavador] ========================================`);
    
    const processos = data.items || [];
    const envolvido = data.envolvido_encontrado || null;
    
    return {
      success: true,
      envolvido: envolvido,
      totalProcessos: envolvido?.quantidade_processos || processos.length,
      processos: processos,
      paginacao: data.links || null,
      creditos: creditosUsados
    };
  } catch (error) {
    console.log(`[Escavador] ========================================`);
    console.log(`[Escavador] ERRO na requisição`);
    console.log(`[Escavador] Status: ${error.response?.status}`);
    console.log(`[Escavador] Payload Response:`, JSON.stringify(error.response?.data || error.message, null, 2));
    console.log(`[Escavador] ========================================`);
    
    if (error.response?.status === 404) {
      console.log(`[Escavador] Nenhum processo encontrado para: ${cpfCnpj}`);
      return { success: true, totalProcessos: 0, envolvido: null, processos: [] };
    }
    if (error.response?.status === 402) {
      console.log(`[Escavador] Sem saldo de créditos`);
      return { error: 'Sem saldo de créditos', totalProcessos: 0 };
    }
    console.error(`[Escavador] Erro na busca:`, error.message);
    return { error: error.message, totalProcessos: 0 };
  }
}

async function searchProcessosByName(nome) {
  const token = await getEscavadorToken();
  if (!token) {
    return { error: 'Token não configurado', total: 0 };
  }

  try {
    console.log(`[Escavador] ========================================`);
    console.log(`[Escavador] Buscando processos para nome: ${nome}`);
    console.log(`[Escavador] Endpoint: ${ESCAVADOR_API_BASE}/envolvido/processos`);
    
    const response = await axios.get(`${ESCAVADOR_API_BASE}/envolvido/processos`, {
      params: { nome: nome },
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    const data = response.data;
    const creditosUsados = response.headers['creditos-utilizados'] || 'N/A';
    
    console.log(`[Escavador] Status: ${response.status}`);
    console.log(`[Escavador] Créditos utilizados: ${creditosUsados}`);
    console.log(`[Escavador] Payload Response:`, JSON.stringify(data, null, 2));
    console.log(`[Escavador] ========================================`);
    
    const processos = data.items || [];
    const envolvido = data.envolvido_encontrado || null;
    
    return {
      success: true,
      envolvido: envolvido,
      totalProcessos: envolvido?.quantidade_processos || processos.length,
      processos: processos,
      paginacao: data.links || null,
      creditos: creditosUsados
    };
  } catch (error) {
    console.log(`[Escavador] ========================================`);
    console.log(`[Escavador] ERRO na requisição`);
    console.log(`[Escavador] Status: ${error.response?.status}`);
    console.log(`[Escavador] Payload Response:`, JSON.stringify(error.response?.data || error.message, null, 2));
    console.log(`[Escavador] ========================================`);
    
    if (error.response?.status === 404) {
      console.log(`[Escavador] Nenhum processo encontrado para: ${nome}`);
      return { success: true, totalProcessos: 0, envolvido: null, processos: [] };
    }
    if (error.response?.status === 402) {
      console.log(`[Escavador] Sem saldo de créditos`);
      return { error: 'Sem saldo de créditos', totalProcessos: 0 };
    }
    console.error(`[Escavador] Erro na busca:`, error.message);
    return { error: error.message, totalProcessos: 0 };
  }
}

async function getResumoEnvolvido(query) {
  const token = await getEscavadorToken();
  if (!token) {
    return { error: 'Token não configurado', totalProcessos: 0 };
  }

  try {
    const cleanQuery = query.replace(/\D/g, '');
    const isCpfCnpj = cleanQuery.length === 11 || cleanQuery.length === 14;
    
    const params = isCpfCnpj ? { cpf_cnpj: cleanQuery } : { nome: query };
    
    console.log(`[Escavador] ========================================`);
    console.log(`[Escavador] Buscando RESUMO para: ${query}`);
    console.log(`[Escavador] Endpoint: ${ESCAVADOR_API_BASE}/envolvido/resumo`);
    console.log(`[Escavador] Params:`, JSON.stringify(params));
    
    const response = await axios.get(`${ESCAVADOR_API_BASE}/envolvido/resumo`, {
      params: params,
      headers: {
        'Authorization': `Bearer ${token}`,
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json'
      },
      timeout: 30000
    });

    const data = response.data;
    const creditosUsados = response.headers['creditos-utilizados'] || 'N/A';
    
    console.log(`[Escavador] Status: ${response.status}`);
    console.log(`[Escavador] Créditos utilizados: ${creditosUsados}`);
    console.log(`[Escavador] Payload Response:`, JSON.stringify(data, null, 2));
    console.log(`[Escavador] ========================================`);
    
    return {
      success: true,
      nome: data.nome || null,
      tipoPessoa: data.tipo_pessoa || null,
      totalProcessos: data.quantidade_processos || 0,
      creditos: creditosUsados
    };
  } catch (error) {
    console.log(`[Escavador] ========================================`);
    console.log(`[Escavador] ERRO na requisição de resumo`);
    console.log(`[Escavador] Status: ${error.response?.status}`);
    console.log(`[Escavador] Payload Response:`, JSON.stringify(error.response?.data || error.message, null, 2));
    console.log(`[Escavador] ========================================`);
    
    if (error.response?.status === 404) {
      console.log(`[Escavador] Nenhum envolvido encontrado para: ${query}`);
      return { success: true, totalProcessos: 0, nome: null };
    }
    if (error.response?.status === 402) {
      console.log(`[Escavador] Sem saldo de créditos`);
      return { error: 'Sem saldo de créditos', totalProcessos: 0 };
    }
    console.error(`[Escavador] Erro na busca:`, error.message);
    return { error: error.message, totalProcessos: 0 };
  }
}

async function searchEscavador(query, options = {}) {
  const cleanQuery = query.replace(/\D/g, '');
  
  if (cleanQuery.length === 11) {
    console.log(`[Escavador] Detectado CPF: ${cleanQuery}`);
    return await searchProcessosByDocument(cleanQuery);
  }
  
  if (cleanQuery.length === 14) {
    console.log(`[Escavador] Detectado CNPJ: ${cleanQuery}`);
    return await searchProcessosByDocument(cleanQuery);
  }
  
  return await searchProcessosByName(query);
}

function formatEscavadorForReport(result) {
  if (!result || result.error) {
    return {
      hasData: false,
      error: result?.error || 'Erro desconhecido',
      html: `<p class="text-muted">Não foi possível consultar o Escavador: ${result?.error || 'Erro desconhecido'}</p>`
    };
  }

  if (result.totalProcessos === 0) {
    return {
      hasData: false,
      html: `<p class="text-success">Nenhum processo judicial encontrado no Escavador.</p>`
    };
  }

  const envolvido = result.envolvido || {};
  const resumo = result.resumo || {};
  
  let html = `
    <div class="escavador-result">
      <h4>📋 Processos Judiciais (Escavador)</h4>
      <div class="alert alert-warning">
        <strong>⚠️ Encontrados ${result.totalProcessos} processo(s)</strong>
      </div>
  `;

  if (envolvido.nome) {
    html += `<p><strong>Nome encontrado:</strong> ${envolvido.nome}</p>`;
  }
  
  if (envolvido.documento) {
    html += `<p><strong>Documento:</strong> ${envolvido.documento}</p>`;
  }

  if (resumo.polos) {
    html += `<h5>Participação nos Processos:</h5><ul>`;
    if (resumo.polos.ativo) {
      html += `<li>Polo Ativo (autor/requerente): ${resumo.polos.ativo} processo(s)</li>`;
    }
    if (resumo.polos.passivo) {
      html += `<li>Polo Passivo (réu/requerido): ${resumo.polos.passivo} processo(s)</li>`;
    }
    if (resumo.polos.outros) {
      html += `<li>Outras participações: ${resumo.polos.outros} processo(s)</li>`;
    }
    html += `</ul>`;
  }

  if (resumo.tipos_justica) {
    html += `<h5>Tipos de Justiça:</h5><ul>`;
    for (const [tipo, count] of Object.entries(resumo.tipos_justica)) {
      html += `<li>${tipo}: ${count} processo(s)</li>`;
    }
    html += `</ul>`;
  }

  html += `</div>`;

  return {
    hasData: true,
    totalProcessos: result.totalProcessos,
    envolvido,
    resumo,
    html
  };
}

module.exports = {
  searchEscavador,
  searchProcessosByDocument,
  searchProcessosByName,
  getResumoEnvolvido,
  formatEscavadorForReport
};
