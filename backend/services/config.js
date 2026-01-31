const config = {
  gcp: {
    projectId: process.env.GOOGLE_PROJECT_ID || process.env.GCP_PROJECT_ID,
    location: process.env.GCP_LOCATION || 'us-central1',
    clientEmail: process.env.GOOGLE_CLIENT_EMAIL,
    privateKey: process.env.GOOGLE_PRIVATE_KEY,
    credentialsJson: process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON
  },
  cse: {
    apiKey: process.env.GOOGLE_CSE_API_KEY,
    cx: process.env.GOOGLE_CSE_ID
  },
  datajud: {
    enabled: (process.env.DATAJUD_ENABLED || 'true').toLowerCase() === 'true',
    baseUrl: process.env.DATAJUD_BASE_URL || 'https://api-publica.datajud.cnj.jus.br',
    apiKey: process.env.DATAJUD_API_KEY
  },
  transparencia: {
    enabled: (process.env.TRANSPARENCIA_ENABLED || 'true').toLowerCase() === 'true',
    baseUrl: process.env.TRANSPARENCIA_BASE_URL || 'https://api.portaldatransparencia.gov.br/api-de-dados',
    apiKey: process.env.TRANSPARENCIA_API_KEY
  },
  safety: {
    allowlistDomains: (process.env.ALLOWLIST_DOMAINS || 'linkedin.com,gov.br,receita.fazenda.gov.br,portaltransparencia.gov.br,jusbrasil.com.br,cnj.jus.br,escavador.com,tjsp.jus.br,tjrj.jus.br,tjmg.jus.br,tjrs.jus.br').split(',').map(s => s.trim()).filter(Boolean)
  },
  fetch: {
    enabled: (process.env.FETCH_ENABLED || 'true').toLowerCase() === 'true',
    maxPages: parseInt(process.env.FETCH_MAX_PAGES || '6', 10),
    timeoutMs: parseInt(process.env.FETCH_TIMEOUT_MS || '8000', 10),
    maxBytes: parseInt(process.env.FETCH_MAX_BYTES || '350000', 10)
  }
};

module.exports = { config };
