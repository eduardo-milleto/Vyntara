function generateHtmlReport(req, out, additionalContext = {}) {
  const generatedAt = new Date().toISOString();
  const formattedDate = new Date().toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  const riskColor = getRiskColor(out.riskScore?.level);
  
  return `<!doctype html>
<html lang="pt-br">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Relatório OSINT - ${escapeHtml(req.fullName)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
      margin: 28px; 
      color: #111; 
      background: #f8f9fa;
      line-height: 1.6;
    }
    .container { max-width: 900px; margin: 0 auto; }
    h1 { margin: 0 0 8px; color: #1a1a2e; font-size: 1.8rem; }
    h2 { color: #16213e; margin-bottom: 12px; font-size: 1.3rem; border-bottom: 2px solid #4a69bd; padding-bottom: 8px; }
    h3 { color: #16213e; margin: 16px 0 8px; font-size: 1.1rem; }
    .muted { color: #666; font-size: 12px; }
    .header { 
      background: linear-gradient(135deg, #060411 0%, #190E68 50%, #06406E 100%); 
      color: white; 
      padding: 24px; 
      border-radius: 12px; 
      margin-bottom: 24px;
    }
    .header h1 { color: white; }
    .vyntara-logo { 
      font-size: 2rem; 
      font-weight: bold; 
      background: linear-gradient(90deg, #67EDFC, #5582F3, #A557FA);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .box { 
      background: white; 
      border: 1px solid #e0e0e0; 
      border-radius: 12px; 
      padding: 20px; 
      margin: 16px 0; 
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .tag { 
      display: inline-block; 
      padding: 4px 12px; 
      border-radius: 999px; 
      font-size: 11px; 
      font-weight: 600;
      text-transform: uppercase;
      margin-right: 8px; 
    }
    .sev-LOW { background: #d4edda; color: #155724; }
    .sev-MEDIUM { background: #fff3cd; color: #856404; }
    .sev-HIGH { background: #f8d7da; color: #721c24; }
    .cat-JUDICIAL { background: #e3e7fa; color: #3c4b9e; }
    .cat-TRANSPARENCIA { background: #e3f7e9; color: #1d6f42; }
    .cat-WEB { background: #fef3e2; color: #a66700; }
    a { color: #4a69bd; text-decoration: none; }
    a:hover { text-decoration: underline; }
    ul { margin: 8px 0 0 18px; }
    li { margin: 6px 0; }
    .finding { border-left: 4px solid #4a69bd; padding-left: 16px; margin: 12px 0; }
    .candidate { 
      background: #f0f4ff; 
      border-radius: 8px; 
      padding: 16px; 
      margin: 12px 0;
    }
    .confidence { 
      font-weight: bold; 
      color: #4a69bd; 
    }
    .disclaimer {
      background: #fff3cd;
      border: 1px solid #ffc107;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
    }
    .audio-btn {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #060411 0%, #190E68 50%, #06406E 100%);
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s, box-shadow 0.2s;
      z-index: 1000;
    }
    .audio-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 30px rgba(25, 14, 104, 0.5);
    }
    .audio-btn.playing {
      animation: pulse 1.5s infinite;
    }
    .audio-btn svg {
      width: 28px;
      height: 28px;
      fill: white;
    }
    @keyframes pulse {
      0%, 100% { box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
      50% { box-shadow: 0 4px 30px rgba(103, 237, 252, 0.6); }
    }
    .audio-controls {
      position: fixed;
      bottom: 100px;
      right: 24px;
      background: white;
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      display: none;
      z-index: 999;
      min-width: 200px;
    }
    .audio-controls.show {
      display: block;
    }
    .audio-controls h4 {
      margin-bottom: 12px;
      color: #190E68;
      font-size: 14px;
    }
    .audio-controls label {
      display: block;
      margin: 8px 0 4px;
      font-size: 12px;
      color: #666;
    }
    .audio-controls select, .audio-controls input[type="range"] {
      width: 100%;
      padding: 6px;
      border-radius: 6px;
      border: 1px solid #ddd;
    }
    .audio-status {
      font-size: 11px;
      color: #666;
      margin-top: 12px;
      text-align: center;
    }
    .risk-score {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 16px;
    }
    .risk-meter {
      width: 120px;
      height: 120px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      color: white;
      font-weight: bold;
    }
    .risk-value { font-size: 2.5rem; line-height: 1; }
    .risk-label { font-size: 0.9rem; margin-top: 4px; }
    .risk-BAIXO { background: linear-gradient(135deg, #28a745, #20c997); }
    .risk-MEDIO { background: linear-gradient(135deg, #ffc107, #fd7e14); }
    .risk-ALTO { background: linear-gradient(135deg, #fd7e14, #dc3545); }
    .risk-CRITICO { background: linear-gradient(135deg, #dc3545, #6f42c1); }
    .status-card {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 16px;
      margin: 12px 0;
    }
    .status-icon { font-size: 1.5rem; margin-right: 8px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media (max-width: 768px) { .grid-2 { grid-template-columns: 1fr; } }
    .processo-item {
      background: #f0f4ff;
      border-radius: 8px;
      padding: 12px;
      margin: 8px 0;
      border-left: 3px solid #4a69bd;
    }
    .transparencia-item {
      background: #e8f5e9;
      border-radius: 8px;
      padding: 12px;
      margin: 8px 0;
      border-left: 3px solid #28a745;
    }
    .sancao-item {
      background: #ffebee;
      border-radius: 8px;
      padding: 12px;
      margin: 8px 0;
      border-left: 3px solid #dc3545;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="vyntara-logo">VYNTARA</div>
      <h1 style="margin-top: 12px;">Relatório de Inteligência Pública (OSINT)</h1>
      <div class="muted" style="color: rgba(255,255,255,0.8); margin-top: 8px;">
        Gerado em ${formattedDate} | Consulta: "${escapeHtml(out.queryUsed)}"
      </div>
    </div>

    <div class="disclaimer">
      <strong>Aviso Importante:</strong>
      <ul>
        <li>Este relatório usa apenas informações públicas presentes nas fontes listadas.</li>
        <li>Não contém dados sensíveis (contatos, endereço residencial, documentos pessoais).</li>
        <li>Se houver homônimos, a identificação pode ser incerta.</li>
        <li>O score de risco é uma estimativa baseada nas evidências disponíveis.</li>
      </ul>
    </div>

    ${out.riskScore ? `
    <div class="box">
      <h2>Score de Risco Público</h2>
      <div class="risk-score">
        <div class="risk-meter risk-${out.riskScore.level || 'BAIXO'}">
          <div class="risk-value">${out.riskScore.value || 0}</div>
          <div class="risk-label">${out.riskScore.level || 'BAIXO'}</div>
        </div>
        <div style="flex: 1;">
          <p><strong>Metodologia:</strong></p>
          <p>${escapeHtml(out.riskScore.methodology || 'N/A')}</p>
        </div>
      </div>
    </div>
    ` : ''}

    <div class="box">
      <h2>Resumo Executivo</h2>
      <p>${escapeHtml(out.summary || 'Nenhum resumo disponível.')}</p>
    </div>

    ${out.perfilPessoal ? `
    <div class="box">
      <h2><span class="status-icon">👤</span>Perfil Pessoal</h2>
      <div class="grid-2">
        <div>
          <p><strong>Nome Completo:</strong> ${escapeHtml(out.perfilPessoal.nomeCompleto || 'Não identificado')}</p>
          <p><strong>Idade Aproximada:</strong> ${escapeHtml(out.perfilPessoal.idadeAproximada || 'Não identificada')}</p>
          <p><strong>Localização:</strong> ${escapeHtml(out.perfilPessoal.localizacao || 'Não identificada')}</p>
        </div>
        <div>
          <p><strong>Profissão:</strong> ${escapeHtml(out.perfilPessoal.profissao || 'Não identificada')}</p>
          <p><strong>Empresa Atual:</strong> ${escapeHtml(out.perfilPessoal.empresaAtual || 'Não identificada')}</p>
        </div>
      </div>
      ${out.perfilPessoal.historicoEmpresas && out.perfilPessoal.historicoEmpresas.length > 0 ? `
        <h4 style="margin-top: 16px;">Histórico de Empresas:</h4>
        <ul>
          ${out.perfilPessoal.historicoEmpresas.map(e => `<li>${escapeHtml(e)}</li>`).join('')}
        </ul>
      ` : ''}
      ${out.perfilPessoal.redesSociais ? `
        <h4 style="margin-top: 16px;">Redes Sociais:</h4>
        <div style="display: flex; flex-wrap: wrap; gap: 12px; margin-top: 8px;">
          ${out.perfilPessoal.redesSociais.linkedin && out.perfilPessoal.redesSociais.linkedin !== 'Não encontrado' ? `
            <a href="${escapeHtml(out.perfilPessoal.redesSociais.linkedin)}" target="_blank" style="display: flex; align-items: center; gap: 6px; background: #0077b5; color: white; padding: 8px 12px; border-radius: 6px; text-decoration: none;">
              💼 LinkedIn
            </a>
          ` : ''}
          ${out.perfilPessoal.redesSociais.instagram && out.perfilPessoal.redesSociais.instagram !== 'Não encontrado' ? `
            <a href="${escapeHtml(out.perfilPessoal.redesSociais.instagram)}" target="_blank" style="display: flex; align-items: center; gap: 6px; background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888); color: white; padding: 8px 12px; border-radius: 6px; text-decoration: none;">
              📸 Instagram
            </a>
          ` : ''}
          ${out.perfilPessoal.redesSociais.facebook && out.perfilPessoal.redesSociais.facebook !== 'Não encontrado' ? `
            <a href="${escapeHtml(out.perfilPessoal.redesSociais.facebook)}" target="_blank" style="display: flex; align-items: center; gap: 6px; background: #1877f2; color: white; padding: 8px 12px; border-radius: 6px; text-decoration: none;">
              👤 Facebook
            </a>
          ` : ''}
          ${out.perfilPessoal.redesSociais.twitter && out.perfilPessoal.redesSociais.twitter !== 'Não encontrado' ? `
            <a href="${escapeHtml(out.perfilPessoal.redesSociais.twitter)}" target="_blank" style="display: flex; align-items: center; gap: 6px; background: #1da1f2; color: white; padding: 8px 12px; border-radius: 6px; text-decoration: none;">
              🐦 Twitter/X
            </a>
          ` : ''}
        </div>
      ` : ''}
      ${out.perfilPessoal.observacoesPerfil && out.perfilPessoal.observacoesPerfil.length > 0 ? `
        <h4 style="margin-top: 16px;">Observações:</h4>
        <ul>
          ${out.perfilPessoal.observacoesPerfil.map(o => `<li>${escapeHtml(o)}</li>`).join('')}
        </ul>
      ` : ''}
    </div>
    ` : ''}

    ${out.noticias && out.noticias.length > 0 ? `
    <div class="box">
      <h2><span class="status-icon">📰</span>Notícias</h2>
      ${out.noticias.map(n => `
        <div class="status-card" style="margin: 8px 0;">
          <strong>${escapeHtml(n.titulo || 'Sem título')}</strong>
          <p style="color: #666; font-size: 12px; margin: 4px 0;">Fonte: ${escapeHtml(n.fonte || 'N/A')} | Relevância: ${escapeHtml(n.relevancia || 'N/A')}</p>
          <p>${escapeHtml(n.resumo || '')}</p>
          ${n.url ? `<a href="${escapeHtml(n.url)}" target="_blank">Ver notícia completa</a>` : ''}
        </div>
      `).join('')}
    </div>
    ` : ''}

    <div class="grid-2">
      ${out.judicialStatus ? `
      <div class="box">
        <h2><span class="status-icon">⚖️</span>Situação Judicial</h2>
        <div class="status-card">
          <p><strong>Processos encontrados:</strong> ${out.judicialStatus.hasProcessos ? 'Sim' : 'Não'}</p>
          <p><strong>Quantidade:</strong> ${out.judicialStatus.count || 0}</p>
          <p>${escapeHtml(out.judicialStatus.summary || 'Sem informações judiciais disponíveis.')}</p>
          ${out.judicialStatus.details && out.judicialStatus.details.length > 0 ? `
            <ul>
              ${out.judicialStatus.details.map(d => `<li>${escapeHtml(d)}</li>`).join('')}
            </ul>
          ` : ''}
        </div>
      </div>
      ` : ''}

      ${out.publicServiceStatus ? `
      <div class="box">
        <h2><span class="status-icon">🏛️</span>Serviço Público</h2>
        <div class="status-card">
          <p><strong>É servidor público:</strong> ${out.publicServiceStatus.isServidor ? 'Sim' : 'Não identificado'}</p>
          <p><strong>Possui sanções:</strong> ${out.publicServiceStatus.hasSancoes ? 'Sim' : 'Não'}</p>
          <p>${escapeHtml(out.publicServiceStatus.summary || 'Sem informações de vínculo público.')}</p>
        </div>
      </div>
      ` : ''}
    </div>

    <div class="box">
      <h2>Candidatos de Identidade (anti-homônimo)</h2>
      ${!out.identityCandidates || out.identityCandidates.length === 0 
        ? '<p class="muted">Nenhum candidato com confiança suficiente.</p>'
        : out.identityCandidates.map(c => `
          <div class="candidate">
            <div><strong>${escapeHtml(c.label)}</strong> — <span class="confidence">Confiança: ${(c.confidence * 100).toFixed(0)}%</span></div>
            <ul>
              ${(c.reasons || []).map(r => `<li>${escapeHtml(r)}</li>`).join('')}
            </ul>
            <div class="muted" style="margin-top: 8px;">
              Fontes: ${(c.sourceUrls || []).map(u => `<a href="${escapeHtml(u)}" target="_blank">${truncateUrl(u)}</a>`).join(', ')}
            </div>
          </div>
        `).join('')
      }
    </div>

    <div class="box">
      <h2>Achados</h2>
      ${!out.findings || out.findings.length === 0 
        ? '<p class="muted">Nenhum achado relevante com base nas fontes atuais.</p>'
        : out.findings.map(f => `
          <div class="finding">
            <span class="tag sev-${f.severity}">${f.severity}</span>
            ${f.category ? `<span class="tag cat-${f.category}">${f.category}</span>` : ''}
            <strong>${escapeHtml(f.title)}</strong>
            <p style="margin-top: 8px;">${escapeHtml(f.description)}</p>
            <div class="muted" style="margin-top: 8px;">
              Fontes: ${(f.sourceUrls || []).map(u => `<a href="${escapeHtml(u)}" target="_blank">${truncateUrl(u)}</a>`).join(', ')}
            </div>
          </div>
        `).join('')
      }
    </div>

    ${(out.resumoJudicial || additionalContext.escavador) && !additionalContext.escavador?.error ? `
    <div class="box">
      <h2><span class="status-icon">⚖️</span>Situação Judicial</h2>
      ${(() => {
        const rj = out.resumoJudicial || {};
        const esc = additionalContext.escavador || {};
        const total = rj.totalProcessos || esc.totalProcessos || 0;
        
        if (total > 0) {
          let html = `
            <div class="alert" style="background: #fff3cd; border: 1px solid #ffc107; padding: 12px; border-radius: 8px; margin-bottom: 16px;">
              <strong>⚠️ Encontrados ${total} processo(s) judicial(is)</strong>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin-bottom: 16px;">
              <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #4a69bd;">${total}</div>
                <div style="color: #666; font-size: 12px;">Total</div>
              </div>
              <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #28a745;">${rj.processosAtivos || 0}</div>
                <div style="color: #666; font-size: 12px;">Ativos</div>
              </div>
              <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #17a2b8;">${rj.comoAutor || 0}</div>
                <div style="color: #666; font-size: 12px;">Como Autor</div>
              </div>
              <div style="background: #f8f9fa; padding: 12px; border-radius: 8px; text-align: center;">
                <div style="font-size: 24px; font-weight: bold; color: #dc3545;">${rj.comoReu || 0}</div>
                <div style="color: #666; font-size: 12px;">Como Réu</div>
              </div>
            </div>
            ${rj.valorTotalEnvolvido ? `<p style="margin-bottom: 16px;"><strong>💰 Valor Total Envolvido:</strong> ${escapeHtml(rj.valorTotalEnvolvido)}</p>` : ''}
          `;
          
          // Tipos de processo
          if (rj.processosPorTipo) {
            const pt = rj.processosPorTipo;
            const tipos = [];
            if (pt.trabalhista > 0) tipos.push(`Trabalhista: ${pt.trabalhista}`);
            if (pt.civel > 0) tipos.push(`Cível: ${pt.civel}`);
            if (pt.criminal > 0) tipos.push(`<span style="color: #dc3545;">Criminal: ${pt.criminal}</span>`);
            if (pt.tributario > 0) tipos.push(`Tributário: ${pt.tributario}`);
            if (pt.bancario > 0) tipos.push(`Bancário: ${pt.bancario}`);
            if (pt.outros > 0) tipos.push(`Outros: ${pt.outros}`);
            if (tipos.length > 0) {
              html += `<p><strong>Por Tipo:</strong> ${tipos.join(' | ')}</p>`;
            }
          }
          
          // Processos Graves
          if (rj.processosGraves && rj.processosGraves.length > 0) {
            html += `
              <div style="background: #f8d7da; border: 1px solid #f5c6cb; padding: 12px; border-radius: 8px; margin: 16px 0;">
                <h4 style="color: #721c24; margin: 0 0 8px;">⚠️ Processos Graves</h4>
                <ul style="margin: 0;">
                  ${rj.processosGraves.map(pg => `<li><strong>${escapeHtml(pg.tipo)}:</strong> ${escapeHtml(pg.motivo)}${pg.valorOuPena ? ` (${escapeHtml(pg.valorOuPena)})` : ''}</li>`).join('')}
                </ul>
              </div>
            `;
          }
          
          // Análise Resumida
          if (rj.analiseResumo) {
            html += `<div style="background: #e8f4fd; padding: 12px; border-radius: 8px; margin-top: 16px;"><strong>📝 Análise:</strong><br>${escapeHtml(rj.analiseResumo)}</div>`;
          }
          
          return html;
        } else {
          return `<p style="color: #28a745;"><strong>✅ Nenhum processo judicial encontrado.</strong></p>`;
        }
      })()}
    </div>
    ` : ''}

    <div class="box">
      <h2>Fontes Consultadas</h2>
      <ul>
        ${(out.sources || []).map(u => `<li><a href="${escapeHtml(u)}" target="_blank">${escapeHtml(u)}</a></li>`).join('')}
      </ul>
    </div>

    <div class="box">
      <h2>Limitações desta Análise</h2>
      <ul>
        ${(out.limitations || []).map(l => `<li>${escapeHtml(l)}</li>`).join('')}
      </ul>
    </div>

    <div style="text-align: center; margin-top: 32px; padding: 16px; color: #666; font-size: 12px;">
      <p>Relatório gerado por <strong>VYNTARA</strong> - Inteligência Pública Unificada</p>
      <p>Este documento é confidencial e destinado apenas ao solicitante.</p>
    </div>
  </div>

  <!-- Botão de Áudio -->
  <button id="audioBtn" class="audio-btn" title="Ouvir Relatório">
    <svg id="playIcon" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
    <svg id="pauseIcon" style="display:none" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
  </button>

  <div id="audioControls" class="audio-controls">
    <h4>🔊 Configurações de Voz</h4>
    <label>Voz:</label>
    <select id="voiceSelect"></select>
    <label>Velocidade: <span id="rateValue">1x</span></label>
    <input type="range" id="rateSlider" min="0.5" max="2" step="0.1" value="1">
    <div id="audioStatus" class="audio-status">Clique no botão para ouvir</div>
  </div>

  <script>
  (function() {
    const audioBtn = document.getElementById('audioBtn');
    const audioControls = document.getElementById('audioControls');
    const voiceSelect = document.getElementById('voiceSelect');
    const rateSlider = document.getElementById('rateSlider');
    const rateValue = document.getElementById('rateValue');
    const audioStatus = document.getElementById('audioStatus');
    const playIcon = document.getElementById('playIcon');
    const pauseIcon = document.getElementById('pauseIcon');
    
    let synth = window.speechSynthesis;
    let utterance = null;
    let isPlaying = false;
    let voices = [];

    // Texto do relatório para leitura
    const reportText = \`
      Relatório de Inteligência Pública sobre ${escapeHtml(req.fullName)}.
      ${out.summary ? 'Resumo executivo: ' + out.summary : ''}
      ${out.riskScore ? 'Score de risco: ' + (out.riskScore.value || 0) + ' de 100, classificado como ' + (out.riskScore.level || 'Baixo') + '.' : ''}
      ${out.judicialStatus ? 'Situação judicial: ' + (out.judicialStatus.hasProcessos ? 'Foram encontrados ' + (out.judicialStatus.count || 0) + ' processos judiciais.' : 'Não foram encontrados processos judiciais.') : ''}
      ${out.publicServiceStatus ? 'Serviço público: ' + (out.publicServiceStatus.isServidor ? 'A pessoa é identificada como servidor público.' : 'Não foi identificado vínculo com o serviço público.') + (out.publicServiceStatus.hasSancoes ? ' Possui sanções registradas.' : '') : ''}
      ${out.findings && out.findings.length > 0 ? 'Foram encontrados ' + out.findings.length + ' achados relevantes durante a análise.' : 'Não foram encontrados achados críticos.'}
      Este relatório utilizou ${(out.sources || []).length} fontes públicas de dados.
      Fim do relatório.
    \`.replace(/\\s+/g, ' ').trim();

    function loadVoices() {
      voices = synth.getVoices();
      voiceSelect.innerHTML = '';
      
      // Priorizar vozes em português
      const ptVoices = voices.filter(v => v.lang.startsWith('pt'));
      const otherVoices = voices.filter(v => !v.lang.startsWith('pt'));
      const sortedVoices = [...ptVoices, ...otherVoices];
      
      sortedVoices.forEach((voice, i) => {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = voice.name + ' (' + voice.lang + ')';
        if (voice.lang.startsWith('pt')) option.textContent = '🇧🇷 ' + option.textContent;
        voiceSelect.appendChild(option);
      });
    }

    if (synth.onvoiceschanged !== undefined) {
      synth.onvoiceschanged = loadVoices;
    }
    loadVoices();

    rateSlider.addEventListener('input', function() {
      rateValue.textContent = this.value + 'x';
      if (isPlaying && utterance) {
        synth.cancel();
        speak();
      }
    });

    function speak() {
      if (!synth) {
        audioStatus.textContent = 'Seu navegador não suporta síntese de voz';
        return;
      }

      utterance = new SpeechSynthesisUtterance(reportText);
      
      const selectedVoice = voices[voiceSelect.value];
      if (selectedVoice) utterance.voice = selectedVoice;
      
      utterance.rate = parseFloat(rateSlider.value);
      utterance.pitch = 1;
      utterance.lang = 'pt-BR';

      utterance.onstart = function() {
        isPlaying = true;
        audioBtn.classList.add('playing');
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'block';
        audioStatus.textContent = 'Reproduzindo...';
      };

      utterance.onend = function() {
        isPlaying = false;
        audioBtn.classList.remove('playing');
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
        audioStatus.textContent = 'Clique para ouvir novamente';
      };

      utterance.onerror = function(e) {
        audioStatus.textContent = 'Erro: ' + e.error;
        isPlaying = false;
        audioBtn.classList.remove('playing');
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
      };

      synth.speak(utterance);
    }

    audioBtn.addEventListener('click', function() {
      audioControls.classList.toggle('show');
      
      if (isPlaying) {
        synth.cancel();
        isPlaying = false;
        audioBtn.classList.remove('playing');
        playIcon.style.display = 'block';
        pauseIcon.style.display = 'none';
        audioStatus.textContent = 'Pausado';
      } else {
        speak();
      }
    });

    // Fechar controles ao clicar fora
    document.addEventListener('click', function(e) {
      if (!audioBtn.contains(e.target) && !audioControls.contains(e.target)) {
        audioControls.classList.remove('show');
      }
    });
  })();
  </script>
</body>
</html>`;
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function truncateUrl(url) {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    return parsed.hostname + (parsed.pathname.length > 30 ? parsed.pathname.slice(0, 30) + '...' : parsed.pathname);
  } catch {
    return url.slice(0, 50) + (url.length > 50 ? '...' : '');
  }
}

function getRiskColor(level) {
  const colors = {
    'BAIXO': '#28a745',
    'MEDIO': '#ffc107',
    'ALTO': '#fd7e14',
    'CRITICO': '#dc3545'
  };
  return colors[level] || colors['BAIXO'];
}

module.exports = { generateHtmlReport };
