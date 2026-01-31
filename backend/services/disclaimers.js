/**
 * Disclaimers de Segurança Obrigatórios
 * 
 * Gera avisos e limitações que devem aparecer em todos os relatórios
 * para proteção legal e transparência ao cliente.
 */

/**
 * Gera disclaimers baseado no contexto da consulta
 * 
 * @param {Object} out - Output da IA
 * @param {Object} additionalContext - Contexto adicional (confidence, processos, etc)
 * @returns {Array<Object>} Lista de disclaimers { icon, title, text, critical }
 */
function generateDisclaimers(out, additionalContext = {}) {
  const disclaimers = [];
  
  const confidence = out.confidence || additionalContext.confidence;
  const identityLevel = confidence?.identity?.level || 'DESCONHECIDA';
  const judicialLevel = confidence?.judicial?.level || 'DESCONHECIDA';
  const totalProcessos = additionalContext.totalProcessos || 0;
  
  // 1. Disclaimer base - Dados Judiciais
  disclaimers.push({
    icon: '⚖️',
    title: 'Dados Judiciais',
    text: 'Processos obtidos via Escavador com base em fontes públicas disponíveis no momento da consulta. <strong>Ausência de registros não garante inexistência de processos</strong>.',
    critical: false
  });
  
  // 2. Disclaimer de Atualização/Latência
  disclaimers.push({
    icon: '⏱️',
    title: 'Atualização e Indexação',
    text: 'Pode haver latência de indexação em bases públicas (até 30 dias). Processos recentes podem não aparecer imediatamente.',
    critical: false
  });
  
  // 3. Disclaimer de Identidade (CRÍTICO se BAIXA)
  if (identityLevel === 'BAIXA') {
    disclaimers.push({
      icon: '⚠️',
      title: 'ATENÇÃO: Risco de Homônimo',
      text: '<strong>Identificação de identidade com BAIXA confiança.</strong> Consulta realizada por nome sem âncoras fortes (CPF/CNPJ/UF). <strong>Pode haver confusão com pessoas homônimas.</strong> Recomenda-se confirmar identidade por CPF/CNPJ antes de decisões importantes.',
      critical: true
    });
  } else if (identityLevel === 'MEDIA') {
    disclaimers.push({
      icon: '⚠️',
      title: 'Confiança de Identidade Moderada',
      text: 'Identificação baseada em nome + âncoras parciais (UF, cidade, empresa). Recomenda-se validação adicional por documento para certeza absoluta.',
      critical: false
    });
  }
  
  // 4. Disclaimer de Segredo de Justiça (se 0 processos)
  if (totalProcessos === 0) {
    disclaimers.push({
      icon: '🔒',
      title: 'Processos em Segredo de Justiça',
      text: 'Processos sob segredo de justiça não aparecem em buscas públicas (ex: casos envolvendo menores, violência doméstica, segredo industrial).',
      critical: false
    });
  }
  
  // 5. Disclaimer de Cobertura Limitada
  disclaimers.push({
    icon: '🌐',
    title: 'Cobertura Limitada',
    text: 'Análise limitada a tribunais integrados ao Escavador e fontes web indexadas pelo Google. Não substitui due diligence completa ou consulta a órgãos oficiais (Receita Federal, Cartórios, etc).',
    critical: false
  });
  
  // 6. Disclaimer de Proteção de Dados (LGPD)
  disclaimers.push({
    icon: '🔐',
    title: 'Proteção de Dados (LGPD)',
    text: 'Este relatório não contém: telefone, e-mail, endereço residencial completo, senhas ou outros dados sensíveis. Compliance com Lei Geral de Proteção de Dados (LGPD).',
    critical: false
  });
  
  // 7. Disclaimer de Score Capped (CRÍTICO)
  if (out.riskScore?.capped) {
    disclaimers.push({
      icon: '📊',
      title: 'Score de Risco Limitado',
      text: `Score foi limitado de ${out.riskScore.originalScore || 'N/A'} para ${out.riskScore.value} devido a: ${out.riskScore.capReasons?.join('; ') || 'Baixa confiança de dados'}. Isso garante que análises com incerteza não gerem scores inflados.`,
      critical: true
    });
  }
  
  // 8. Disclaimer de Fontes Descartadas (se relevante)
  if (additionalContext.filterStats && additionalContext.filterStats.descartadas > 0) {
    const percentDescarte = additionalContext.filterStats.percentualDescarte;
    if (percentDescarte > 50) {
      disclaimers.push({
        icon: '🔍',
        title: 'Filtro de Qualidade Aplicado',
        text: `${percentDescarte}% das fontes coletadas foram descartadas por baixa confiabilidade ou incompatibilidade de identidade. Apenas fontes de alta qualidade foram analisadas.`,
        critical: false
      });
    }
  }
  
  // 9. Disclaimer de Finalidade (sempre)
  disclaimers.push({
    icon: '📋',
    title: 'Finalidade do Relatório',
    text: 'Este relatório é informativo e baseado exclusivamente em dados públicos. Não constitui parecer jurídico, análise de crédito ou decisão final sobre idoneidade. Uso sujeito aos termos de serviço.',
    critical: false
  });
  
  return disclaimers;
}

/**
 * Formata disclaimers para WhatsApp (texto simples)
 */
function formatDisclaimersForWhatsApp(disclaimers) {
  const lines = ['📋 *AVISOS IMPORTANTES*\n'];
  
  disclaimers.forEach((d, idx) => {
    if (d.critical) {
      lines.push(`${d.icon} *${d.title.toUpperCase()}*`);
    } else {
      lines.push(`${d.icon} *${d.title}*`);
    }
    
    // Remove HTML tags para WhatsApp
    const textPlain = d.text
      .replace(/<strong>/g, '*')
      .replace(/<\/strong>/g, '*')
      .replace(/<[^>]*>/g, '');
    
    lines.push(textPlain);
    lines.push(''); // linha em branco
  });
  
  return lines.join('\n');
}

/**
 * Formata disclaimers para HTML
 */
function formatDisclaimersForHTML(disclaimers) {
  return disclaimers.map(d => `
    <div class="disclaimer ${d.critical ? 'disclaimer-critical' : ''}">
      <div style="display: flex; align-items: start; gap: 12px;">
        <div style="font-size: 1.5rem;">${d.icon}</div>
        <div>
          <strong>${d.title}</strong>
          <p style="margin-top: 4px; font-size: 0.95rem;">${d.text}</p>
        </div>
      </div>
    </div>
  `).join('');
}

module.exports = {
  generateDisclaimers,
  formatDisclaimersForWhatsApp,
  formatDisclaimersForHTML
};
