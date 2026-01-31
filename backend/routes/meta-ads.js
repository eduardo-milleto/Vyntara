const express = require('express');
const axios = require('axios');
const router = express.Router();

const META_TOKEN = process.env.META_TOKEN;
const AD_ACCOUNT_ID = process.env.AD_ACCOUNT_ID;
const META_API_VERSION = 'v20.0';
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

// Mapear range para date_preset do Meta
function getDatePreset(range) {
  const presetMap = {
    'today': 'today',
    'yesterday': 'yesterday',
    'last_7d': 'last_7d',
    'last_7_days': 'last_7d',
    'last7days': 'last_7d',
    'last_14d': 'last_14d',
    'last_30d': 'last_30d',
    'last_30_days': 'last_30d',
    'last30days': 'last_30d',
    'this_month': 'this_month',
    'last_month': 'last_month',
    'this_year': 'this_year',
    'last_year': 'last_year',
    'lifetime': 'lifetime',
    'maximum': 'maximum'
  };
  return presetMap[range] || 'maximum';
}

// Calcular score de saúde baseado em métricas
function calculateHealthScore(metrics) {
  let score = 100;
  
  // Penalizar CTR baixo (< 1%)
  if (metrics.ctr < 1) {
    score -= 15;
  } else if (metrics.ctr < 1.5) {
    score -= 8;
  }
  
  // Penalizar custo por conversão alto
  if (metrics.costPerConversion > 50) {
    score -= 20;
  } else if (metrics.costPerConversion > 30) {
    score -= 10;
  } else if (metrics.costPerConversion > 20) {
    score -= 5;
  }
  
  // Penalizar frequência alta (> 3)
  if (metrics.frequency > 4) {
    score -= 15;
  } else if (metrics.frequency > 3) {
    score -= 8;
  }
  
  // Bonificar bom CTR
  if (metrics.ctr > 2.5) {
    score += 5;
  }
  
  // Limitar entre 0 e 100
  return Math.max(0, Math.min(100, Math.round(score)));
}

// Extrair o resultado principal da campanha (a ação mais importante)
function extractMainResult(actions, costPerActionType) {
  if (!actions || !Array.isArray(actions)) return { results: 0, costPerResult: 0, resultType: null };
  
  // Ordem de prioridade para identificar o resultado principal
  const priorityActions = [
    'omni_purchase',
    'purchase',
    'offsite_conversion.fb_pixel_purchase',
    'lead',
    'offsite_conversion.fb_pixel_lead',
    'complete_registration',
    'offsite_conversion.fb_pixel_complete_registration',
    'onsite_conversion.messaging_conversation_started_7d',
    'messaging_conversation_started_7d',
    'initiate_checkout',
    'offsite_conversion.fb_pixel_initiate_checkout',
    'add_to_cart',
    'offsite_conversion.fb_pixel_add_to_cart',
    'landing_page_view',
    'link_click',
    'page_engagement',
    'post_engagement'
  ];
  
  // Encontrar a ação principal baseada na prioridade
  for (const priorityAction of priorityActions) {
    const action = actions.find(a => a.action_type === priorityAction);
    if (action) {
      const results = parseInt(action.value) || 0;
      
      // Tentar encontrar o custo por resultado correspondente
      let costPerResult = 0;
      if (costPerActionType && Array.isArray(costPerActionType)) {
        const costAction = costPerActionType.find(c => c.action_type === priorityAction);
        if (costAction) {
          costPerResult = parseFloat(costAction.value) || 0;
        }
      }
      
      return { results, costPerResult, resultType: priorityAction };
    }
  }
  
  // Se não encontrar nenhuma ação prioritária, pegar a primeira disponível
  if (actions.length > 0) {
    const firstAction = actions[0];
    const results = parseInt(firstAction.value) || 0;
    let costPerResult = 0;
    if (costPerActionType && Array.isArray(costPerActionType) && costPerActionType.length > 0) {
      costPerResult = parseFloat(costPerActionType[0].value) || 0;
    }
    return { results, costPerResult, resultType: firstAction.action_type };
  }
  
  return { results: 0, costPerResult: 0, resultType: null };
}

// Extrair conversões e métricas detalhadas de actions (mantido para compatibilidade)
function extractActionMetrics(actions) {
  const metrics = {
    conversions: 0,
    leads: 0,
    purchases: 0,
    initiateCheckout: 0,
    addToCart: 0,
    pageViews: 0,
    linkClicks: 0,
    landingPageViews: 0,
    contentViews: 0,
    completeRegistration: 0,
    messaging_conversations_started: 0
  };
  
  if (!actions || !Array.isArray(actions)) return metrics;
  
  for (const action of actions) {
    const type = action.action_type || '';
    const value = parseInt(action.value) || 0;
    
    if (type.includes('purchase') || type.includes('omni_purchase')) {
      metrics.purchases += value;
    }
    if (type.includes('lead') || type === 'lead') {
      metrics.leads += value;
    }
    if (type.includes('initiate_checkout')) {
      metrics.initiateCheckout += value;
    }
    if (type.includes('add_to_cart')) {
      metrics.addToCart += value;
    }
    if (type === 'landing_page_view') {
      metrics.landingPageViews += value;
    }
    if (type === 'link_click') {
      metrics.linkClicks += value;
    }
    if (type === 'page_view' || type === 'view_content') {
      metrics.pageViews += value;
    }
    if (type.includes('complete_registration')) {
      metrics.completeRegistration += value;
    }
    if (type === 'onsite_conversion.messaging_conversation_started_7d' || 
        type.includes('messaging_conversation')) {
      metrics.messaging_conversations_started += value;
    }
  }
  
  return metrics;
}

// Função legada para compatibilidade
function extractConversions(actions) {
  const result = extractMainResult(actions, null);
  return result.results;
}

// ==================== ROTA: RESUMO GERAL ====================
router.get('/summary', async (req, res) => {
  try {
    const range = req.query.range || 'last_7d';
    const datePreset = getDatePreset(range);
    
    const url = `${META_BASE_URL}/${AD_ACCOUNT_ID}/insights`;
    const response = await axios.get(url, {
      params: {
        fields: 'spend,impressions,clicks,actions,ctr,cpc,cpm,reach,frequency',
        level: 'account',
        date_preset: datePreset,
        access_token: META_TOKEN
      }
    });
    
    const data = response.data.data?.[0] || {};
    
    const spend = parseFloat(data.spend) || 0;
    const impressions = parseInt(data.impressions) || 0;
    const clicks = parseInt(data.clicks) || 0;
    const reach = parseInt(data.reach) || 0;
    const ctr = parseFloat(data.ctr) || 0;
    const cpc = parseFloat(data.cpc) || 0;
    const cpm = parseFloat(data.cpm) || 0;
    const frequency = parseFloat(data.frequency) || 1;
    const conversions = extractConversions(data.actions);
    const costPerConversion = conversions > 0 ? spend / conversions : 0;
    
    const score = calculateHealthScore({
      ctr,
      costPerConversion,
      frequency
    });
    
    res.json({
      success: true,
      data: {
        score,
        totalSpend: spend,
        totalClicks: clicks,
        totalImpressions: impressions,
        totalConversions: conversions,
        costPerConversion,
        reach,
        frequency,
        ctr,
        cpc,
        cpm
      }
    });
  } catch (error) {
    console.error('Erro ao buscar resumo Meta:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data?.error?.message || error.message
    });
  }
});

// ==================== ROTA: LISTA DE CAMPANHAS ====================
router.get('/campaigns', async (req, res) => {
  try {
    const range = req.query.range || 'last_7d';
    const status = req.query.status || 'all';
    const objective = req.query.objective || 'all';
    const datePreset = getDatePreset(range);
    
    // Buscar campanhas
    const campaignsUrl = `${META_BASE_URL}/${AD_ACCOUNT_ID}/campaigns`;
    const campaignsResponse = await axios.get(campaignsUrl, {
      params: {
        fields: 'id,name,status,objective,configured_status,effective_status,daily_budget,lifetime_budget,created_time,updated_time',
        limit: 100,
        access_token: META_TOKEN
      }
    });
    
    let campaigns = campaignsResponse.data.data || [];
    
    // Filtrar por status se necessário
    if (status !== 'all') {
      const statusMap = {
        'ACTIVE': 'ACTIVE',
        'PAUSED': 'PAUSED',
        'ARCHIVED': 'ARCHIVED'
      };
      campaigns = campaigns.filter(c => c.effective_status === statusMap[status]);
    }
    
    // Buscar insights por campanha
    const insightsUrl = `${META_BASE_URL}/${AD_ACCOUNT_ID}/insights`;
    const insightsResponse = await axios.get(insightsUrl, {
      params: {
        level: 'campaign',
        fields: 'campaign_id,campaign_name,impressions,clicks,spend,ctr,cpc,cpm,reach,frequency,actions,cost_per_action_type',
        date_preset: datePreset,
        limit: 500,
        access_token: META_TOKEN
      }
    });
    
    const insightsData = insightsResponse.data.data || [];
    const insightsMap = {};
    for (const insight of insightsData) {
      insightsMap[insight.campaign_id] = insight;
    }
    
    // Combinar campanhas com insights
    const result = campaigns.map(campaign => {
      const insight = insightsMap[campaign.id] || {};
      
      const spend = parseFloat(insight.spend) || 0;
      const impressions = parseInt(insight.impressions) || 0;
      const clicks = parseInt(insight.clicks) || 0;
      const reach = parseInt(insight.reach) || 0;
      const ctr = parseFloat(insight.ctr) || 0;
      const cpc = parseFloat(insight.cpc) || 0;
      const cpm = parseFloat(insight.cpm) || 0;
      const frequency = parseFloat(insight.frequency) || 1;
      
      // Extrair resultado principal (exatamente como aparece no Meta Ads Manager)
      const mainResult = extractMainResult(insight.actions, insight.cost_per_action_type);
      const conversions = mainResult.results;
      const costPerConversion = mainResult.costPerResult || (conversions > 0 ? spend / conversions : 0);
      
      // Extrair métricas detalhadas de actions
      const actionMetrics = extractActionMetrics(insight.actions);
      
      // Calcular métricas adicionais solicitadas
      const initiateCheckout = actionMetrics.initiateCheckout;
      const leads = actionMetrics.leads;
      const purchases = actionMetrics.purchases;
      const landingPageViews = actionMetrics.landingPageViews;
      const linkClicks = actionMetrics.linkClicks;
      const messaging = actionMetrics.messaging_conversations_started;
      
      // CPA = Custo por Aquisição (Custo por conversão)
      const cpa = costPerConversion;
      
      // Custo por Initiate Checkout
      const costPerInitiateCheckout = initiateCheckout > 0 ? spend / initiateCheckout : 0;
      
      // % Checkout = Initiate Checkout / Clicks * 100
      const checkoutRate = clicks > 0 ? (initiateCheckout / clicks) * 100 : 0;
      
      // TX Connect Rate = Initiate Checkout / Cliques * 100 (Finalizações de compra iniciadas / Cliques)
      const connectRate = clicks > 0 ? (initiateCheckout / clicks) * 100 : 0;
      
      // TX Conversão Página = Conversões / Landing Page Views * 100
      const pageConversionRate = landingPageViews > 0 ? (conversions / landingPageViews) * 100 : 0;
      
      const score = calculateHealthScore({ ctr, costPerConversion, frequency });
      
      // Mapear status para português
      const statusMap = {
        'ACTIVE': 'ATIVA',
        'PAUSED': 'PAUSADA',
        'ARCHIVED': 'ARQUIVADA',
        'DELETED': 'DELETADA'
      };
      
      // Mapear objetivo para português
      const objectiveMap = {
        'OUTCOME_TRAFFIC': 'TRÁFEGO',
        'OUTCOME_ENGAGEMENT': 'ENGAJAMENTO',
        'OUTCOME_LEADS': 'LEADS',
        'OUTCOME_AWARENESS': 'RECONHECIMENTO_DE_MARCA',
        'OUTCOME_SALES': 'CONVERSÕES',
        'OUTCOME_APP_PROMOTION': 'PROMOÇÃO_DE_APP',
        'LINK_CLICKS': 'TRÁFEGO',
        'POST_ENGAGEMENT': 'ENGAJAMENTO',
        'REACH': 'ALCANCE',
        'BRAND_AWARENESS': 'RECONHECIMENTO_DE_MARCA',
        'CONVERSIONS': 'CONVERSÕES',
        'LEAD_GENERATION': 'LEADS',
        'MESSAGES': 'MENSAGENS',
        'VIDEO_VIEWS': 'VISUALIZAÇÕES_DE_VIDEO'
      };
      
      return {
        id: campaign.id,
        name: campaign.name,
        status: statusMap[campaign.effective_status] || campaign.effective_status,
        objective: objectiveMap[campaign.objective] || campaign.objective,
        dailyBudget: (parseInt(campaign.daily_budget) || 0) / 100,
        lifetimeBudget: (parseInt(campaign.lifetime_budget) || 0) / 100,
        score,
        metrics: {
          spend,
          impressions,
          clicks,
          conversions,
          costPerConversion,
          ctr,
          cpc,
          cpm,
          cpa,
          reach,
          frequency,
          leads,
          purchases,
          initiateCheckout,
          landingPageViews,
          linkClicks,
          messaging,
          costPerInitiateCheckout,
          checkoutRate,
          connectRate,
          pageConversionRate
        },
        createdTime: campaign.created_time,
        updatedTime: campaign.updated_time
      };
    });
    
    // Filtrar por objetivo se necessário
    let filteredResult = result;
    if (objective !== 'all') {
      const objectiveFilterMap = {
        'CONVERSIONS': ['CONVERSÕES', 'OUTCOME_SALES'],
        'REACH': ['ALCANCE', 'REACH'],
        'TRAFFIC': ['TRÁFEGO', 'OUTCOME_TRAFFIC', 'LINK_CLICKS'],
        'BRAND_AWARENESS': ['RECONHECIMENTO_DE_MARCA', 'OUTCOME_AWARENESS', 'BRAND_AWARENESS'],
        'ENGAGEMENT': ['ENGAJAMENTO', 'OUTCOME_ENGAGEMENT', 'POST_ENGAGEMENT']
      };
      const validObjectives = objectiveFilterMap[objective] || [];
      filteredResult = result.filter(c => validObjectives.includes(c.objective));
    }
    
    res.json({
      success: true,
      data: filteredResult,
      summary: {
        total: filteredResult.length,
        active: filteredResult.filter(c => c.status === 'ATIVA').length,
        paused: filteredResult.filter(c => c.status === 'PAUSADA').length,
        archived: filteredResult.filter(c => c.status === 'ARQUIVADA').length
      }
    });
  } catch (error) {
    console.error('Erro ao buscar campanhas Meta:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data?.error?.message || error.message
    });
  }
});

// ==================== ROTA: COMPARAÇÃO DE PERÍODOS ====================
router.get('/comparison', async (req, res) => {
  try {
    const current = req.query.current || 'last_7d';
    
    // Calcular datas para período atual e anterior
    const now = new Date();
    let currentStart, currentEnd, previousStart, previousEnd;
    
    if (current === 'today') {
      currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      currentEnd = new Date(now);
      
      previousStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      previousEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
    } else if (current === 'yesterday') {
      currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      currentEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59);
      
      previousStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2);
      previousEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2, 23, 59, 59);
    } else if (current === 'last_7d' || current === 'last_7_days') {
      currentEnd = new Date(now);
      currentStart = new Date(now);
      currentStart.setDate(currentStart.getDate() - 7);
      
      previousEnd = new Date(currentStart);
      previousStart = new Date(previousEnd);
      previousStart.setDate(previousStart.getDate() - 7);
    } else if (current === 'last_30d' || current === 'last_30_days') {
      currentEnd = new Date(now);
      currentStart = new Date(now);
      currentStart.setDate(currentStart.getDate() - 30);
      
      previousEnd = new Date(currentStart);
      previousStart = new Date(previousEnd);
      previousStart.setDate(previousStart.getDate() - 30);
    } else if (current === 'this_month') {
      currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
      currentEnd = new Date(now);
      
      previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      previousEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    } else if (current === 'last_month') {
      currentStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      currentEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      
      previousStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      previousEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0);
    } else {
      // Default: últimos 7 dias
      currentEnd = new Date(now);
      currentStart = new Date(now);
      currentStart.setDate(currentStart.getDate() - 7);
      
      previousEnd = new Date(currentStart);
      previousStart = new Date(previousEnd);
      previousStart.setDate(previousStart.getDate() - 7);
    }
    
    const formatDate = (date) => date.toISOString().split('T')[0];
    
    // Buscar dados do período atual
    const currentUrl = `${META_BASE_URL}/${AD_ACCOUNT_ID}/insights`;
    const currentResponse = await axios.get(currentUrl, {
      params: {
        fields: 'spend,impressions,clicks,actions,reach',
        level: 'account',
        time_range: JSON.stringify({
          since: formatDate(currentStart),
          until: formatDate(currentEnd)
        }),
        access_token: META_TOKEN
      }
    });
    
    // Buscar dados do período anterior
    const previousResponse = await axios.get(currentUrl, {
      params: {
        fields: 'spend,impressions,clicks,actions,reach',
        level: 'account',
        time_range: JSON.stringify({
          since: formatDate(previousStart),
          until: formatDate(previousEnd)
        }),
        access_token: META_TOKEN
      }
    });
    
    const currentData = currentResponse.data.data?.[0] || {};
    const previousData = previousResponse.data.data?.[0] || {};
    
    const currentMetrics = {
      spend: parseFloat(currentData.spend) || 0,
      impressions: parseInt(currentData.impressions) || 0,
      clicks: parseInt(currentData.clicks) || 0,
      conversions: extractConversions(currentData.actions),
      reach: parseInt(currentData.reach) || 0
    };
    
    const previousMetrics = {
      spend: parseFloat(previousData.spend) || 0,
      impressions: parseInt(previousData.impressions) || 0,
      clicks: parseInt(previousData.clicks) || 0,
      conversions: extractConversions(previousData.actions),
      reach: parseInt(previousData.reach) || 0
    };
    
    // Calcular CTR
    currentMetrics.ctr = currentMetrics.impressions > 0 
      ? (currentMetrics.clicks / currentMetrics.impressions) * 100 
      : 0;
    previousMetrics.ctr = previousMetrics.impressions > 0 
      ? (previousMetrics.clicks / previousMetrics.impressions) * 100 
      : 0;
    
    // Calcular variação percentual
    const calcDelta = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };
    
    const deltaPercent = {
      spend: calcDelta(currentMetrics.spend, previousMetrics.spend),
      impressions: calcDelta(currentMetrics.impressions, previousMetrics.impressions),
      clicks: calcDelta(currentMetrics.clicks, previousMetrics.clicks),
      conversions: calcDelta(currentMetrics.conversions, previousMetrics.conversions),
      ctr: calcDelta(currentMetrics.ctr, previousMetrics.ctr)
    };
    
    res.json({
      success: true,
      data: {
        current: currentMetrics,
        previous: previousMetrics,
        deltaPercent,
        periods: {
          current: {
            start: formatDate(currentStart),
            end: formatDate(currentEnd)
          },
          previous: {
            start: formatDate(previousStart),
            end: formatDate(previousEnd)
          }
        }
      }
    });
  } catch (error) {
    console.error('Erro ao buscar comparação Meta:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data?.error?.message || error.message
    });
  }
});

// ==================== ROTA: ALERTAS INTELIGENTES ====================
router.get('/alerts', async (req, res) => {
  try {
    const range = req.query.range || 'last_7d';
    const datePreset = getDatePreset(range);
    
    // Buscar insights por campanha
    const insightsUrl = `${META_BASE_URL}/${AD_ACCOUNT_ID}/insights`;
    const insightsResponse = await axios.get(insightsUrl, {
      params: {
        level: 'campaign',
        fields: 'campaign_id,campaign_name,impressions,clicks,spend,ctr,cpc,cpm,reach,frequency,actions',
        date_preset: datePreset,
        limit: 100,
        access_token: META_TOKEN
      }
    });
    
    const insights = insightsResponse.data.data || [];
    const alerts = [];
    
    // Calcular médias
    let totalCpm = 0, totalCostPerConversion = 0, countWithCpm = 0, countWithConversions = 0;
    
    for (const insight of insights) {
      const cpm = parseFloat(insight.cpm) || 0;
      const spend = parseFloat(insight.spend) || 0;
      const conversions = extractConversions(insight.actions);
      
      if (cpm > 0) {
        totalCpm += cpm;
        countWithCpm++;
      }
      if (conversions > 0) {
        totalCostPerConversion += spend / conversions;
        countWithConversions++;
      }
    }
    
    const avgCpm = countWithCpm > 0 ? totalCpm / countWithCpm : 0;
    const avgCostPerConversion = countWithConversions > 0 ? totalCostPerConversion / countWithConversions : 0;
    
    // Gerar alertas para cada campanha
    for (const insight of insights) {
      const cpm = parseFloat(insight.cpm) || 0;
      const frequency = parseFloat(insight.frequency) || 1;
      const spend = parseFloat(insight.spend) || 0;
      const conversions = extractConversions(insight.actions);
      const costPerConversion = conversions > 0 ? spend / conversions : 0;
      const campaignName = insight.campaign_name || 'Campanha';
      
      // Alerta: CPM acima da média
      if (avgCpm > 0 && cpm > avgCpm * 1.35) {
        const percent = Math.round(((cpm - avgCpm) / avgCpm) * 100);
        alerts.push({
          id: `cpm_${insight.campaign_id}`,
          type: 'warning',
          title: 'CPM acima da média',
          message: `A campanha "${campaignName}" está com CPM ${percent}% acima da média dos últimos 7 dias.`,
          campaignId: insight.campaign_id,
          timestamp: new Date().toISOString()
        });
      }
      
      // Alerta: Frequência muito alta
      if (frequency > 3) {
        alerts.push({
          id: `freq_${insight.campaign_id}`,
          type: 'danger',
          title: 'Frequência muito alta',
          message: `A campanha "${campaignName}" está saturando o público (frequência ${frequency.toFixed(1)}x). Considere expandir o público.`,
          campaignId: insight.campaign_id,
          timestamp: new Date().toISOString()
        });
      }
      
      // Alerta: Performance excelente
      if (avgCostPerConversion > 0 && costPerConversion > 0 && costPerConversion < avgCostPerConversion * 0.6) {
        const percent = Math.round(((avgCostPerConversion - costPerConversion) / avgCostPerConversion) * 100);
        alerts.push({
          id: `perf_${insight.campaign_id}`,
          type: 'success',
          title: 'Performance excelente',
          message: `A campanha "${campaignName}" está com custo por conversão ${percent}% menor que a média!`,
          campaignId: insight.campaign_id,
          timestamp: new Date().toISOString()
        });
      }
      
      // Alerta: CTR muito baixo
      const ctr = parseFloat(insight.ctr) || 0;
      if (ctr > 0 && ctr < 0.5) {
        alerts.push({
          id: `ctr_${insight.campaign_id}`,
          type: 'warning',
          title: 'CTR muito baixo',
          message: `A campanha "${campaignName}" está com CTR de apenas ${ctr.toFixed(2)}%. Considere revisar os criativos.`,
          campaignId: insight.campaign_id,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // Ordenar alertas por tipo (danger primeiro, depois warning, depois success)
    const typeOrder = { danger: 0, warning: 1, success: 2 };
    alerts.sort((a, b) => typeOrder[a.type] - typeOrder[b.type]);
    
    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error('Erro ao gerar alertas Meta:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data?.error?.message || error.message
    });
  }
});

// ==================== ROTA: DETALHES DE UMA CAMPANHA ====================
router.get('/campaign/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const range = req.query.range || 'last_7d';
    const datePreset = getDatePreset(range);
    
    // Buscar dados da campanha
    const campaignUrl = `${META_BASE_URL}/${id}`;
    const campaignResponse = await axios.get(campaignUrl, {
      params: {
        fields: 'id,name,status,objective,configured_status,effective_status,daily_budget,lifetime_budget,created_time,updated_time,start_time,stop_time',
        access_token: META_TOKEN
      }
    });
    
    // Buscar insights da campanha
    const insightsUrl = `${META_BASE_URL}/${id}/insights`;
    const insightsResponse = await axios.get(insightsUrl, {
      params: {
        fields: 'impressions,clicks,spend,ctr,cpc,cpm,reach,frequency,actions,cost_per_action_type',
        date_preset: datePreset,
        access_token: META_TOKEN
      }
    });
    
    // Buscar insights por dia para gráfico
    const dailyInsightsResponse = await axios.get(insightsUrl, {
      params: {
        fields: 'impressions,clicks,spend,actions',
        date_preset: datePreset,
        time_increment: 1,
        access_token: META_TOKEN
      }
    });
    
    const campaign = campaignResponse.data || {};
    const insight = insightsResponse.data.data?.[0] || {};
    const dailyInsights = dailyInsightsResponse.data.data || [];
    
    const spend = parseFloat(insight.spend) || 0;
    const conversions = extractConversions(insight.actions);
    const costPerConversion = conversions > 0 ? spend / conversions : 0;
    
    const score = calculateHealthScore({
      ctr: parseFloat(insight.ctr) || 0,
      costPerConversion,
      frequency: parseFloat(insight.frequency) || 1
    });
    
    res.json({
      success: true,
      data: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.effective_status,
        objective: campaign.objective,
        dailyBudget: (parseInt(campaign.daily_budget) || 0) / 100,
        lifetimeBudget: (parseInt(campaign.lifetime_budget) || 0) / 100,
        score,
        metrics: {
          spend,
          impressions: parseInt(insight.impressions) || 0,
          clicks: parseInt(insight.clicks) || 0,
          conversions,
          costPerConversion,
          ctr: parseFloat(insight.ctr) || 0,
          cpc: parseFloat(insight.cpc) || 0,
          cpm: parseFloat(insight.cpm) || 0,
          reach: parseInt(insight.reach) || 0,
          frequency: parseFloat(insight.frequency) || 1
        },
        insights: dailyInsights.map(d => ({
          date: d.date_start,
          impressions: parseInt(d.impressions) || 0,
          clicks: parseInt(d.clicks) || 0,
          spend: parseFloat(d.spend) || 0,
          conversions: extractConversions(d.actions)
        })),
        createdTime: campaign.created_time,
        startTime: campaign.start_time,
        stopTime: campaign.stop_time
      }
    });
  } catch (error) {
    console.error('Erro ao buscar detalhes da campanha:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data?.error?.message || error.message
    });
  }
});

// ==================== ROTA: HISTÓRICO DE EVENTOS ====================
router.get('/events', async (req, res) => {
  try {
    const range = req.query.range || 'last_7d';
    const datePreset = getDatePreset(range);
    
    // Buscar atividades da conta (se disponível)
    // A API do Meta não tem um endpoint direto de eventos, 
    // então vamos simular baseado em mudanças de status das campanhas
    const campaignsUrl = `${META_BASE_URL}/${AD_ACCOUNT_ID}/campaigns`;
    const campaignsResponse = await axios.get(campaignsUrl, {
      params: {
        fields: 'id,name,status,updated_time,daily_budget',
        limit: 50,
        access_token: META_TOKEN
      }
    });
    
    const campaigns = campaignsResponse.data.data || [];
    const events = [];
    
    // Gerar eventos baseados em campanhas atualizadas recentemente
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    for (const campaign of campaigns) {
      const updatedTime = new Date(campaign.updated_time);
      if (updatedTime >= sevenDaysAgo) {
        events.push({
          id: `event_${campaign.id}`,
          type: 'status_change',
          timestamp: campaign.updated_time,
          description: `Campanha "${campaign.name}" foi atualizada`,
          metadata: {
            campaignId: campaign.id,
            status: campaign.status
          }
        });
      }
    }
    
    // Ordenar por data mais recente
    events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.json({
      success: true,
      data: events.slice(0, 20) // Limitar a 20 eventos
    });
  } catch (error) {
    console.error('Erro ao buscar eventos Meta:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data?.error?.message || error.message
    });
  }
});

// ==================== ROTA: VERIFICAR CONEXÃO ====================
router.get('/check', async (req, res) => {
  try {
    if (!META_TOKEN || !AD_ACCOUNT_ID) {
      return res.status(400).json({
        success: false,
        error: 'META_TOKEN ou AD_ACCOUNT_ID não configurados'
      });
    }
    
    // Verificar se o token é válido
    const url = `${META_BASE_URL}/${AD_ACCOUNT_ID}`;
    const response = await axios.get(url, {
      params: {
        fields: 'name,account_id,account_status,currency,timezone_name',
        access_token: META_TOKEN
      }
    });
    
    res.json({
      success: true,
      data: {
        connected: true,
        account: response.data
      }
    });
  } catch (error) {
    console.error('Erro ao verificar conexão Meta:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: error.response?.data?.error?.message || error.message
    });
  }
});

module.exports = router;
