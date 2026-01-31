# Guia de Integração - Meta Marketing API

## 📋 Estrutura de Dados

Este dashboard está preparado para receber dados da **Meta Marketing API (Facebook Graph API)**. Abaixo está a estrutura de dados esperada:

### Campaign (Campanha)
```typescript
interface Campaign {
  id: string;                    // ID da campanha (ex: "camp_001")
  name: string;                  // Nome da campanha
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';  // Status atual
  objective: string;             // Objetivo (CONVERSIONS, REACH, etc)
  daily_budget: number;          // Orçamento diário em reais
  spend: number;                 // Valor total gasto
  impressions: number;           // Total de impressões
  clicks: number;                // Total de cliques
  ctr: number;                   // Taxa de cliques (%)
  cpc: number;                   // Custo por clique
  cpm: number;                   // Custo por mil impressões
  conversions: number;           // Total de conversões
  cost_per_conversion: number;   // Custo por conversão
  reach: number;                 // Alcance único
  frequency: number;             // Frequência média
  insights: Insight[];           // Dados diários
}

interface Insight {
  date: string;           // Data no formato YYYY-MM-DD
  impressions: number;    // Impressões do dia
  clicks: number;         // Cliques do dia
  spend: number;          // Gasto do dia
  conversions: number;    // Conversões do dia
}
```

## 🔌 Endpoints da Meta Marketing API

### 1. Listar Campanhas
```http
GET https://graph.facebook.com/v20.0/act_{AD_ACCOUNT_ID}/campaigns
  ?fields=name,status,daily_budget,objective
  &access_token={ACCESS_TOKEN}
```

### 2. Obter Insights (Métricas)
```http
GET https://graph.facebook.com/v20.0/act_{AD_ACCOUNT_ID}/insights
  ?level=campaign
  &fields=campaign_name,impressions,clicks,spend,ctr,cpc,cpm,actions,reach,frequency
  &date_preset=last_7_days
  &access_token={ACCESS_TOKEN}
```

### 3. Insights Diários (Para Gráficos)
```http
GET https://graph.facebook.com/v20.0/{CAMPAIGN_ID}/insights
  ?time_increment=1
  &fields=impressions,clicks,spend,actions
  &date_preset=last_7_days
  &access_token={ACCESS_TOKEN}
```

## 🛠 Implementação Recomendada

### Backend (Node.js/Express exemplo)

```javascript
// /api/meta/campaigns
app.get('/api/meta/campaigns', async (req, res) => {
  try {
    const adAccountId = process.env.META_AD_ACCOUNT_ID;
    const accessToken = process.env.META_ACCESS_TOKEN;
    
    // 1. Buscar campanhas
    const campaignsResponse = await fetch(
      `https://graph.facebook.com/v20.0/act_${adAccountId}/campaigns?fields=name,status,daily_budget,objective&access_token=${accessToken}`
    );
    const campaignsData = await campaignsResponse.json();
    
    // 2. Para cada campanha, buscar insights
    const campaignsWithMetrics = await Promise.all(
      campaignsData.data.map(async (campaign) => {
        const insightsResponse = await fetch(
          `https://graph.facebook.com/v20.0/${campaign.id}/insights?fields=impressions,clicks,spend,ctr,cpc,cpm,actions,reach,frequency&access_token=${accessToken}`
        );
        const insightsData = await insightsResponse.json();
        
        // 3. Buscar insights diários para gráficos
        const dailyInsightsResponse = await fetch(
          `https://graph.facebook.com/v20.0/${campaign.id}/insights?time_increment=1&fields=impressions,clicks,spend,actions&date_preset=last_7_days&access_token=${accessToken}`
        );
        const dailyInsightsData = await dailyInsightsResponse.json();
        
        // 4. Processar e formatar dados
        const metrics = insightsData.data[0] || {};
        const conversions = metrics.actions?.find(a => a.action_type === 'purchase')?.value || 0;
        
        return {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
          objective: campaign.objective,
          daily_budget: parseFloat(campaign.daily_budget) / 100, // Meta retorna em centavos
          spend: parseFloat(metrics.spend || 0),
          impressions: parseInt(metrics.impressions || 0),
          clicks: parseInt(metrics.clicks || 0),
          ctr: parseFloat(metrics.ctr || 0),
          cpc: parseFloat(metrics.cpc || 0),
          cpm: parseFloat(metrics.cpm || 0),
          conversions: parseInt(conversions),
          cost_per_conversion: conversions > 0 ? parseFloat(metrics.spend) / conversions : 0,
          reach: parseInt(metrics.reach || 0),
          frequency: parseFloat(metrics.frequency || 0),
          insights: dailyInsightsData.data.map(day => ({
            date: day.date_start,
            impressions: parseInt(day.impressions || 0),
            clicks: parseInt(day.clicks || 0),
            spend: parseFloat(day.spend || 0),
            conversions: parseInt(day.actions?.find(a => a.action_type === 'purchase')?.value || 0),
          })),
        };
      })
    );
    
    res.json(campaignsWithMetrics);
  } catch (error) {
    console.error('Erro ao buscar campanhas:', error);
    res.status(500).json({ error: 'Erro ao buscar dados do Meta' });
  }
});
```

### Frontend (App.tsx)

No arquivo `/App.tsx`, substitua a função `refreshData`:

```typescript
const refreshData = async () => {
  setIsRefreshing(true);
  
  try {
    const response = await fetch('/api/meta/campaigns');
    if (!response.ok) throw new Error('Erro ao buscar campanhas');
    
    const data = await response.json();
    setCampaigns(data);
  } catch (error) {
    console.error('Erro:', error);
    alert('Erro ao atualizar dados. Tente novamente.');
  } finally {
    setIsRefreshing(false);
  }
};
```

## 🔐 Configuração de Credenciais

### 1. Criar App no Meta for Developers
- Acesse: https://developers.facebook.com
- Crie um novo app
- Adicione o produto "Marketing API"

### 2. Obter Access Token
- Vá em Tools > Graph API Explorer
- Selecione seu app
- Adicione permissões: `ads_read`, `ads_management`
- Gere o token

### 3. Variáveis de Ambiente (.env)
```bash
META_AD_ACCOUNT_ID=your_account_id_here
META_ACCESS_TOKEN=your_access_token_here
```

## 🎯 Campos Importantes da API

### Actions (Conversões)
A API do Meta retorna conversões no campo `actions`:
```javascript
actions: [
  { action_type: 'purchase', value: '10' },
  { action_type: 'lead', value: '25' },
  { action_type: 'link_click', value: '150' }
]
```

Dependendo do seu objetivo de campanha, você pode querer rastrear:
- `purchase` - Compras
- `lead` - Leads/Formulários
- `add_to_cart` - Adicionar ao carrinho
- `complete_registration` - Cadastros completos

## 📊 Sistema de Alertas

O sistema de alertas pode ser implementado com lógica no backend:

```javascript
function generateAlerts(campaigns) {
  const alerts = [];
  
  campaigns.forEach(campaign => {
    // Alerta: CPM muito alto
    if (campaign.cpm > 25) {
      alerts.push({
        type: 'warning',
        title: 'CPM acima da média',
        message: `Campanha "${campaign.name}" está com CPM muito alto (R$ ${campaign.cpm.toFixed(2)})`,
        campaignId: campaign.id,
      });
    }
    
    // Alerta: Frequência alta (saturação)
    if (campaign.frequency > 3.5) {
      alerts.push({
        type: 'danger',
        title: 'Público saturando',
        message: `Campanha "${campaign.name}" com frequência muito alta (${campaign.frequency.toFixed(2)}x)`,
        campaignId: campaign.id,
      });
    }
    
    // Alerta: Performance excelente
    if (campaign.ctr > 3 && campaign.cost_per_conversion < 15) {
      alerts.push({
        type: 'success',
        title: 'Performance excelente',
        message: `Campanha "${campaign.name}" está performando acima do esperado!`,
        campaignId: campaign.id,
      });
    }
  });
  
  return alerts;
}
```

## 🔄 Atualização em Tempo Real

Para atualizar automaticamente:

```typescript
useEffect(() => {
  // Atualizar a cada 5 minutos
  const interval = setInterval(() => {
    refreshData();
  }, 5 * 60 * 1000);
  
  return () => clearInterval(interval);
}, []);
```

## 📤 Exportação de Dados

Para implementar a exportação:

```typescript
const handleExport = async (format: 'excel' | 'csv' | 'pdf' | 'image') => {
  if (format === 'csv') {
    // Gerar CSV
    const csv = campaigns.map(c => 
      `${c.name},${c.status},${c.spend},${c.conversions},${c.ctr}`
    ).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'campanhas-meta.csv';
    a.click();
  }
  
  // Para Excel: usar biblioteca como 'xlsx'
  // Para PDF: usar biblioteca como 'jspdf'
  // Para Image: usar biblioteca como 'html2canvas'
};
```

## 🚀 Próximos Passos

1. ✅ Configurar credenciais da Meta API
2. ✅ Implementar endpoint backend para buscar campanhas
3. ✅ Conectar frontend ao backend
4. ✅ Testar com dados reais
5. ✅ Implementar sistema de cache (Redis recomendado)
6. ✅ Adicionar tratamento de erros robusto
7. ✅ Implementar rate limiting
8. ✅ Adicionar logs de auditoria

## 📞 Suporte

Para mais informações sobre a Meta Marketing API:
- Documentação oficial: https://developers.facebook.com/docs/marketing-apis
- Graph API Explorer: https://developers.facebook.com/tools/explorer
- Changelog: https://developers.facebook.com/docs/graph-api/changelog
