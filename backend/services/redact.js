/**
 * Módulo de Redação de Dados Sensíveis
 * 
 * Protege informações pessoais antes de enviar para APIs externas (Gemini, logs, etc)
 * Compliance: LGPD Art. 46 (Segurança e prevenção de incidentes)
 */

// Padrões de dados sensíveis
const PATTERNS = {
  // Telefones (vários formatos brasileiros e internacionais)
  PHONE: /\b(\+?\d{1,3}[\s-]?)?(\(?\d{2,3}\)?[\s-]?)?\d{4,5}[\s-]?\d{4}\b/g,
  
  // E-mails
  EMAIL: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  
  // CPF (com ou sem formatação)
  CPF: /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g,
  
  // CNPJ (com ou sem formatação)
  CNPJ: /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g,
  
  // RG (vários formatos)
  RG: /\b\d{1,2}\.?\d{3}\.?\d{3}[-\s]?[0-9xX]\b/g,
  
  // Endereços (rua, avenida, etc)
  ADDRESS: /\b(rua|avenida|av\.|travessa|rodovia|alameda|pra[çc]a|estrada|r\.|trav\.)\s+[^\n,]{5,80}(,\s*(n[úu]mero|n[°º]|nº|n\.?)?\s*\d+)?/gi,
  
  // CEP
  CEP: /\b\d{5}-?\d{3}\b/g,
  
  // Cartão de crédito (4 grupos de 4 dígitos)
  CREDIT_CARD: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  
  // Conta bancária (padrão Banco-Agência-Conta)
  BANK_ACCOUNT: /\b(banco|ag[eê]ncia|conta)[:\s]+[\d\-\.\/]+/gi,
  
  // Números de processos judiciais (preservar apenas o formato, mascarar partes)
  // Formato CNJ: NNNNNNN-DD.AAAA.J.TR.OOOO
  // Mantemos visível mas redact partes sensíveis se necessário
  // PROCESSO_SENSIVEL: /\b\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}\b/g,
  
  // Senha em texto (comum em logs acidentais)
  PASSWORD: /\b(password|senha|pass|pwd)[:\s=]+[^\s]{4,}/gi,
  
  // Token/API Keys (sequências longas alfanuméricas)
  API_KEY: /\b[a-zA-Z0-9]{32,}\b/g,
  
  // Coordenadas GPS (latitude/longitude)
  GPS: /\b-?\d{1,3}\.\d{4,},\s*-?\d{1,3}\.\d{4,}\b/g,
  
  // Data de nascimento (dd/mm/yyyy ou yyyy-mm-dd)
  BIRTH_DATE: /\b(nascimento|nascido|born|data\s+de\s+nascimento)[:\s]+\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/gi,
  
  // Números de documentos estrangeiros (passaporte, SSN)
  PASSPORT: /\b[A-Z]{2}\d{6,9}\b/g,
  
  // PIX (pode ser CPF, CNPJ, email, telefone ou chave aleatória)
  PIX_KEY: /\b(chave\s+pix|pix)[:\s]+[^\s,]{8,}/gi
};

/**
 * Redact dados sensíveis de um texto
 * 
 * @param {string} text - Texto a ser sanitizado
 * @param {Object} options - Opções de redação
 * @param {boolean} options.preserveFormat - Preserva formatação (ex: XXX.XXX.XXX-XX)
 * @param {Array<string>} options.exceptions - Padrões para não redact (ex: ['PHONE'])
 * @returns {string} Texto sanitizado
 */
function redactSensitive(text, options = {}) {
  if (!text) return '';
  
  const { preserveFormat = false, exceptions = [] } = options;
  
  let sanitized = text;
  
  // Email
  if (!exceptions.includes('EMAIL')) {
    sanitized = sanitized.replace(PATTERNS.EMAIL, '[●●●@●●●.●●●]');
  }
  
  // Telefone
  if (!exceptions.includes('PHONE')) {
    sanitized = sanitized.replace(PATTERNS.PHONE, preserveFormat ? '(XX) XXXXX-XXXX' : '[●●● TELEFONE]');
  }
  
  // CPF (preservar formato parcial se solicitado)
  if (!exceptions.includes('CPF')) {
    if (preserveFormat) {
      sanitized = sanitized.replace(PATTERNS.CPF, 'XXX.XXX.XXX-XX');
    } else {
      sanitized = sanitized.replace(PATTERNS.CPF, '[●●● CPF]');
    }
  }
  
  // CNPJ
  if (!exceptions.includes('CNPJ')) {
    if (preserveFormat) {
      sanitized = sanitized.replace(PATTERNS.CNPJ, 'XX.XXX.XXX/XXXX-XX');
    } else {
      sanitized = sanitized.replace(PATTERNS.CNPJ, '[●●● CNPJ]');
    }
  }
  
  // RG
  if (!exceptions.includes('RG')) {
    sanitized = sanitized.replace(PATTERNS.RG, '[●●● RG]');
  }
  
  // Endereço
  if (!exceptions.includes('ADDRESS')) {
    sanitized = sanitized.replace(PATTERNS.ADDRESS, '[●●● ENDEREÇO]');
  }
  
  // CEP
  if (!exceptions.includes('CEP')) {
    sanitized = sanitized.replace(PATTERNS.CEP, '[●●●-●●●]');
  }
  
  // Cartão de crédito
  sanitized = sanitized.replace(PATTERNS.CREDIT_CARD, '[●●●● CARTÃO]');
  
  // Conta bancária
  sanitized = sanitized.replace(PATTERNS.BANK_ACCOUNT, '[●●● CONTA BANCÁRIA]');
  
  // Senha
  sanitized = sanitized.replace(PATTERNS.PASSWORD, 'senha: [●●●●●●●●]');
  
  // API Keys (longas)
  if (!exceptions.includes('API_KEY')) {
    sanitized = sanitized.replace(PATTERNS.API_KEY, (match) => {
      // Preserva início e fim para debug se necessário
      if (match.length > 40 && preserveFormat) {
        return match.slice(0, 4) + '●'.repeat(match.length - 8) + match.slice(-4);
      }
      return '[●●● API_KEY]';
    });
  }
  
  // GPS
  sanitized = sanitized.replace(PATTERNS.GPS, '[●●● COORDENADAS]');
  
  // Data de nascimento
  sanitized = sanitized.replace(PATTERNS.BIRTH_DATE, 'nascimento: [●●/●●/●●●●]');
  
  // Passaporte
  sanitized = sanitized.replace(PATTERNS.PASSPORT, '[●●● PASSAPORTE]');
  
  // PIX
  sanitized = sanitized.replace(PATTERNS.PIX_KEY, 'pix: [●●● CHAVE PIX]');
  
  return sanitized;
}

/**
 * Verifica se um texto contém dados sensíveis
 * 
 * @param {string} text - Texto para verificar
 * @returns {Object} { hasSensitive: boolean, types: [] }
 */
function detectSensitiveData(text) {
  if (!text) return { hasSensitive: false, types: [] };
  
  const detected = [];
  
  if (PATTERNS.EMAIL.test(text)) detected.push('EMAIL');
  if (PATTERNS.PHONE.test(text)) detected.push('PHONE');
  if (PATTERNS.CPF.test(text)) detected.push('CPF');
  if (PATTERNS.CNPJ.test(text)) detected.push('CNPJ');
  if (PATTERNS.RG.test(text)) detected.push('RG');
  if (PATTERNS.ADDRESS.test(text)) detected.push('ADDRESS');
  if (PATTERNS.CEP.test(text)) detected.push('CEP');
  if (PATTERNS.CREDIT_CARD.test(text)) detected.push('CREDIT_CARD');
  if (PATTERNS.BANK_ACCOUNT.test(text)) detected.push('BANK_ACCOUNT');
  if (PATTERNS.PASSWORD.test(text)) detected.push('PASSWORD');
  if (PATTERNS.GPS.test(text)) detected.push('GPS');
  if (PATTERNS.BIRTH_DATE.test(text)) detected.push('BIRTH_DATE');
  
  return {
    hasSensitive: detected.length > 0,
    types: detected,
    count: detected.length
  };
}

/**
 * Redact apenas para logs (mais agressivo, sem preservar formato)
 */
function redactForLogs(text) {
  return redactSensitive(text, { preserveFormat: false });
}

/**
 * Redact para IA (preserva algum contexto mas protege dados)
 */
function redactForAI(text) {
  return redactSensitive(text, { 
    preserveFormat: true,
    exceptions: ['API_KEY'] // API keys internas podem ser necessárias
  });
}

module.exports = { 
  redactSensitive,
  redactForLogs,
  redactForAI,
  detectSensitiveData,
  PATTERNS
};
