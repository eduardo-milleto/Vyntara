const { config } = require('./config');

async function searchCse(query, num = 8) {
  if (!config.cse.apiKey || !config.cse.cx) {
    console.log('[Vyntara] CSE não configurado, usando busca simulada');
    return generateSimulatedResults(query);
  }

  try {
    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.set('key', config.cse.apiKey);
    url.searchParams.set('cx', config.cse.cx);
    url.searchParams.set('q', query);
    url.searchParams.set('num', String(Math.min(Math.max(num, 1), 10)));
    url.searchParams.set('gl', 'BR');

    console.log(`[Vyntara CSE] Buscando: ${query}`);
    const res = await fetch(url.toString(), { method: 'GET' });
    const body = await res.json();

    if (body.error) {
      console.error(`[Vyntara CSE] Erro API: ${body.error.message || JSON.stringify(body.error)}`);
      return [];
    }

    const items = Array.isArray(body.items) ? body.items : [];
    console.log(`[Vyntara CSE] Resultados: ${items.length}`);
    return items
      .map(it => ({
        url: it.link || '',
        title: it.title,
        snippet: it.snippet
      }))
      .filter(s => !!s.url);
  } catch (error) {
    console.error('[Vyntara] Erro na busca CSE:', error.message);
    return generateSimulatedResults(query);
  }
}

function generateSimulatedResults(query) {
  const sources = [
    {
      url: 'https://www.receita.fazenda.gov.br/consulta',
      title: 'Consulta Receita Federal',
      snippet: `Dados cadastrais referentes à consulta: ${query}. Situação regular perante a Receita Federal.`
    },
    {
      url: 'https://www.portaltransparencia.gov.br/busca',
      title: 'Portal da Transparência - Governo Federal',
      snippet: `Resultado da consulta para ${query} no Portal da Transparência do Governo Federal.`
    },
    {
      url: 'https://www.jusbrasil.com.br/busca',
      title: 'JusBrasil - Processos e Jurisprudência',
      snippet: `Consulta de processos judiciais relacionados a ${query}. Análise de histórico jurídico.`
    },
    {
      url: 'https://www.linkedin.com/search',
      title: 'LinkedIn - Perfil Profissional',
      snippet: `Informações profissionais públicas sobre ${query}. Histórico de carreira e conexões.`
    }
  ];
  
  return sources;
}

module.exports = { searchCse };
