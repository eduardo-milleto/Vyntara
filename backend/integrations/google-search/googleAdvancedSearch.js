const { config } = require('./config');

const SOCIAL_NETWORKS = {
  linkedin: {
    site: 'linkedin.com/in',
    label: 'LinkedIn',
    icon: '💼'
  },
  instagram: {
    site: 'instagram.com',
    label: 'Instagram',
    icon: '📸'
  },
  facebook: {
    site: 'facebook.com',
    label: 'Facebook',
    icon: '👤'
  },
  twitter: {
    site: 'twitter.com OR x.com',
    label: 'Twitter/X',
    icon: '🐦'
  }
};

async function searchGoogle(query, num = 10) {
  if (!config.cse.apiKey || !config.cse.cx) {
    console.log('[Vyntara] CSE não configurado');
    return [];
  }

  try {
    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.set('key', config.cse.apiKey);
    url.searchParams.set('cx', config.cse.cx);
    url.searchParams.set('q', query);
    url.searchParams.set('num', String(Math.min(Math.max(num, 1), 10)));
    url.searchParams.set('gl', 'BR');

    const res = await fetch(url.toString(), { method: 'GET' });
    const body = await res.json();

    if (body.error) {
      console.error(`[Vyntara CSE] Erro: ${body.error.message}`);
      return [];
    }

    return (body.items || []).map(it => ({
      url: it.link || '',
      title: it.title || '',
      snippet: it.snippet || '',
      displayLink: it.displayLink || ''
    })).filter(s => !!s.url);
  } catch (error) {
    console.error('[Vyntara CSE] Erro:', error.message);
    return [];
  }
}

function extractSocialProfile(results, platform) {
  const network = SOCIAL_NETWORKS[platform];
  if (!network) return null;

  const sites = network.site.split(' OR ');
  for (const result of results) {
    for (const site of sites) {
      if (result.url.includes(site.trim())) {
        return {
          platform: network.label,
          icon: network.icon,
          url: result.url,
          title: result.title,
          snippet: result.snippet
        };
      }
    }
  }
  return null;
}

function extractLocation(results) {
  const locations = new Set();
  
  for (const result of results) {
    const text = `${result.title} ${result.snippet}`;
    
    const locationPattern1 = /(?:mora|reside|vive|localizado|based|location|cidade|city)\s*(?:em|in|:)?\s*([A-Za-zÀ-ÿ\s]+(?:[-\/][A-Z]{2})?)/gi;
    let match;
    while ((match = locationPattern1.exec(text)) !== null) {
      const loc = match[1];
      if (loc && loc.length > 2 && loc.length < 50) {
        locations.add(loc.trim());
      }
    }
    
    const locationPattern2 = /([A-Za-zÀ-ÿ\s]+)\s*[-–,]\s*(SP|RJ|MG|RS|PR|SC|BA|PE|CE|DF|GO|PA|MA|ES|PB|RN|AL|PI|SE|MT|MS|RO|TO|AC|AP|AM|RR)/gi;
    while ((match = locationPattern2.exec(text)) !== null) {
      const loc = match[1] + '-' + match[2];
      if (loc && loc.length > 2 && loc.length < 50) {
        locations.add(loc.trim());
      }
    }
    
    const cities = ['São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Porto Alegre', 'Curitiba', 'Salvador', 'Recife', 'Fortaleza', 'Brasília'];
    for (const city of cities) {
      if (text.toLowerCase().includes(city.toLowerCase())) {
        locations.add(city);
      }
    }
  }

  return Array.from(locations).slice(0, 3);
}

function extractCompanies(results) {
  const companies = new Set();
  
  for (const result of results) {
    const text = `${result.title} ${result.snippet}`;
    
    const pattern1 = /(?:CEO|diretor|fundador|sócio|proprietário|gerente|coordenador|analista|desenvolvedor|engenheiro|advogado)\s*(?:da|do|de|na|no|em|at|@)\s*([A-Za-zÀ-ÿ0-9\s&.]+)/gi;
    let match;
    while ((match = pattern1.exec(text)) !== null) {
      const company = match[1];
      if (company && company.length > 2 && company.length < 60) {
        const cleaned = company.trim().replace(/[,.:;]$/, '');
        if (cleaned.length > 2) {
          companies.add(cleaned);
        }
      }
    }
    
    const pattern2 = /(?:trabalha|trabalhou|atua|atuou)\s*(?:na|no|em|para|com)\s*([A-Za-zÀ-ÿ0-9\s&.]+)/gi;
    while ((match = pattern2.exec(text)) !== null) {
      const company = match[1];
      if (company && company.length > 2 && company.length < 60) {
        const cleaned = company.trim().replace(/[,.:;]$/, '');
        if (cleaned.length > 2) {
          companies.add(cleaned);
        }
      }
    }
    
    const pattern3 = /([A-Za-zÀ-ÿ0-9\s]+)\s*(?:Ltda|S\.?A\.?|EIRELI|ME|EPP|CNPJ)/gi;
    while ((match = pattern3.exec(text)) !== null) {
      const company = match[1];
      if (company && company.length > 2 && company.length < 60) {
        const cleaned = company.trim().replace(/[,.:;]$/, '');
        if (cleaned.length > 2) {
          companies.add(cleaned);
        }
      }
    }
  }

  return Array.from(companies).slice(0, 5);
}

function extractAge(results) {
  for (const result of results) {
    const text = `${result.title} ${result.snippet}`;
    
    const agePattern = /(\d{1,2})\s*anos?\s*(?:de idade)?/i;
    let match = agePattern.exec(text);
    if (match) {
      const value = parseInt(match[1]);
      if (value >= 18 && value <= 100) {
        return value;
      }
    }
    
    const idadePattern = /(?:idade|age)[\s:]*(\d{1,2})/i;
    match = idadePattern.exec(text);
    if (match) {
      const value = parseInt(match[1]);
      if (value >= 18 && value <= 100) {
        return value;
      }
    }
    
    const birthPattern = /(?:nascido em|born|nasceu)\s*(?:\d{1,2}\s*(?:de\s*)?[a-zç]+\s*(?:de\s*)?)(\d{4})/i;
    match = birthPattern.exec(text);
    if (match) {
      const year = parseInt(match[1]);
      if (year >= 1920 && year <= 2010) {
        return new Date().getFullYear() - year;
      }
    }
  }

  return null;
}

function extractNews(results) {
  const newsIndicators = [
    'g1.globo.com', 'uol.com.br', 'folha.uol.com.br', 'estadao.com.br',
    'oglobo.globo.com', 'gazetadopovo.com.br', 'correio.rac.com.br',
    'terra.com.br', 'r7.com', 'band.uol.com.br', 'cnnbrasil.com.br',
    'infomoney.com.br', 'valor.globo.com', 'exame.com', 'forbes.com.br',
    'jornal', 'news', 'noticias', 'noticia'
  ];

  return results.filter(r => {
    const urlLower = r.url.toLowerCase();
    return newsIndicators.some(indicator => urlLower.includes(indicator));
  }).map(r => ({
    url: r.url,
    title: r.title,
    snippet: r.snippet
  })).slice(0, 5);
}

async function advancedPersonSearch(fullName, context = '') {
  console.log(`[Vyntara AdvSearch] Iniciando busca avançada para: ${fullName}`);
  
  const allResults = [];
  const socialProfiles = {};
  
  const queries = [
    { query: `"${fullName}"`, category: 'geral', num: 10 },
    { query: `"${fullName}" site:linkedin.com/in`, category: 'linkedin', num: 5 },
    { query: `"${fullName}" site:instagram.com`, category: 'instagram', num: 3 },
    { query: `"${fullName}" site:facebook.com`, category: 'facebook', num: 3 },
    { query: `"${fullName}" site:twitter.com OR site:x.com`, category: 'twitter', num: 3 },
    { query: `"${fullName}" empresa cargo trabalha`, category: 'emprego', num: 5 },
    { query: `"${fullName}" ${context}`, category: 'contexto', num: 5 }
  ];

  const validQueries = queries.filter(q => q.query.trim().length > 5);
  
  const searchPromises = validQueries.map(async ({ query, category, num }) => {
    try {
      const results = await searchGoogle(query, num);
      return { category, results };
    } catch (error) {
      console.log(`[Vyntara AdvSearch] Erro na busca ${category}: ${error.message}`);
      return { category, results: [] };
    }
  });

  const searchResults = await Promise.all(searchPromises);
  
  for (const { category, results } of searchResults) {
    console.log(`[Vyntara AdvSearch] ${category}: ${results.length} resultados`);
    
    for (const result of results) {
      result.searchCategory = category;
      allResults.push(result);
    }

    if (category === 'linkedin') {
      const profile = extractSocialProfile(results, 'linkedin');
      if (profile) socialProfiles.linkedin = profile;
    } else if (category === 'instagram') {
      const profile = extractSocialProfile(results, 'instagram');
      if (profile) socialProfiles.instagram = profile;
    } else if (category === 'facebook') {
      const profile = extractSocialProfile(results, 'facebook');
      if (profile) socialProfiles.facebook = profile;
    } else if (category === 'twitter') {
      const profile = extractSocialProfile(results, 'twitter');
      if (profile) socialProfiles.twitter = profile;
    }
  }

  const seen = new Set();
  const uniqueResults = allResults.filter(r => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });

  const extractedData = {
    locations: extractLocation(uniqueResults),
    companies: extractCompanies(uniqueResults),
    estimatedAge: extractAge(uniqueResults),
    news: extractNews(uniqueResults),
    socialProfiles: Object.values(socialProfiles)
  };

  console.log(`[Vyntara AdvSearch] Dados extraídos:`, JSON.stringify({
    totalResults: uniqueResults.length,
    socialProfiles: Object.keys(socialProfiles),
    locations: extractedData.locations,
    companies: extractedData.companies.length,
    news: extractedData.news.length
  }));

  return {
    results: uniqueResults,
    extractedData,
    socialProfiles
  };
}

module.exports = { 
  advancedPersonSearch, 
  searchGoogle,
  extractSocialProfile,
  extractLocation,
  extractCompanies,
  extractAge,
  extractNews
};
