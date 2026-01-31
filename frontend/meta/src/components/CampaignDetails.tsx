import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, TrendingUp, Users, MousePointerClick, DollarSign, Target, Eye, Repeat, BarChart3, RefreshCw, ShoppingCart, Link2, Percent, ArrowRightLeft } from 'lucide-react';
import { MetricsChart } from './MetricsChart';
import { HealthScore, calculateHealthScore } from './HealthScore';
import { formatCurrency, formatNumber, formatDecimal } from '../utils/formatters';

interface Insight {
  date: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversoes: number;
}

interface Campaign {
  id: string;
  name: string;
  status: 'ATIVA' | 'PAUSADA' | 'ARQUIVADA';
  objective: string;
  daily_budget: number;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  conversoes: number;
  custo_por_conversao: number;
  alcance: number;
  frequencia: number;
  score?: number;
  checkoutRate?: number;
  costPerInitiateCheckout?: number;
  connectRate?: number;
  pageConversionRate?: number;
  initiateCheckout?: number;
  landingPageViews?: number;
  insights?: Insight[];
}

interface CampaignDetailsProps {
  campaign: Campaign;
  onClose: () => void;
}

export function CampaignDetails({ campaign, onClose }: CampaignDetailsProps) {
  const [insights, setInsights] = useState<Insight[]>(campaign.insights || []);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/meta/campaign/${campaign.id}?range=last_7d`);
        const data = await response.json();
        
        if (data.success && data.data.insights) {
          const formattedInsights = data.data.insights.map((i: any) => ({
            date: i.date,
            impressions: i.impressions,
            clicks: i.clicks,
            spend: i.spend,
            conversoes: i.conversions || 0
          }));
          setInsights(formattedInsights);
        }
      } catch (error) {
        console.error('Erro ao buscar insights:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsights();
  }, [campaign.id]);

  const primaryMetrics = [
    {
      icon: BarChart3,
      label: 'CPM',
      value: formatCurrency(campaign.cpm),
      color: '#d4af37',
      subtitle: 'Custo por Mil Impressões',
    },
    {
      icon: MousePointerClick,
      label: 'CPC',
      value: formatCurrency(campaign.cpc),
      color: '#3b82f6',
      subtitle: 'Custo por Clique',
    },
    {
      icon: Target,
      label: 'CTR',
      value: `${formatDecimal(campaign.ctr, 2)}%`,
      color: '#f59e0b',
      subtitle: 'Taxa de Cliques',
    },
    {
      icon: TrendingUp,
      label: 'CPA',
      value: formatCurrency(campaign.custo_por_conversao),
      color: '#10b981',
      subtitle: 'Custo por Aquisição',
    },
  ];

  const conversionMetrics = [
    {
      icon: ShoppingCart,
      label: '% Checkout',
      value: `${formatDecimal(campaign.checkoutRate || 0, 2)}%`,
      color: '#8b5cf6',
      subtitle: 'Taxa de Checkout',
    },
    {
      icon: DollarSign,
      label: 'Custo por Checkout',
      value: formatCurrency(campaign.costPerInitiateCheckout || 0),
      color: '#ec4899',
      subtitle: 'Custo por Initiate Checkout',
    },
    {
      icon: Link2,
      label: 'TX Connect Rate',
      value: `${formatDecimal(campaign.connectRate || 0, 2)}%`,
      color: '#06b6d4',
      subtitle: 'Taxa de Conexão',
    },
    {
      icon: ArrowRightLeft,
      label: 'TX Conversão Página',
      value: `${formatDecimal(campaign.pageConversionRate || 0, 2)}%`,
      color: '#14b8a6',
      subtitle: 'Conversão da Página',
    },
  ];

  const volumeMetrics = [
    {
      icon: Eye,
      label: 'Impressões',
      value: formatNumber(campaign.impressions),
      color: '#d4af37',
      subtitle: `CPM: ${formatCurrency(campaign.cpm)}`,
    },
    {
      icon: MousePointerClick,
      label: 'Cliques',
      value: formatNumber(campaign.clicks),
      color: '#3b82f6',
      subtitle: `CPC: ${formatCurrency(campaign.cpc)}`,
    },
    {
      icon: Users,
      label: 'Alcance',
      value: formatNumber(campaign.alcance),
      color: '#8b5cf6',
      subtitle: `Frequência: ${formatDecimal(campaign.frequencia, 2)}x`,
    },
    {
      icon: TrendingUp,
      label: 'Conversões',
      value: formatNumber(campaign.conversoes),
      color: '#10b981',
      subtitle: `Custo: ${formatCurrency(campaign.custo_por_conversao)}`,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 50 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-black/95 backdrop-blur-2xl border border-[#d4af37]/30 rounded-3xl shadow-2xl"
      >
        <div className="sticky top-0 bg-black/95 backdrop-blur-xl border-b border-white/10 px-8 py-6 z-10">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <motion.h2
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-3xl mb-2 text-[#d4af37]"
              >
                {campaign.name}
              </motion.h2>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className="flex items-center gap-4"
              >
                <span className="text-white/50">{campaign.objective.replace(/_/g, ' ')}</span>
                <span
                  className="px-3 py-1 rounded-full text-xs"
                  style={{
                    backgroundColor:
                      campaign.status === 'ATIVA'
                        ? '#10b98120'
                        : campaign.status === 'PAUSADA'
                        ? '#f59e0b20'
                        : '#6b728020',
                    color:
                      campaign.status === 'ATIVA'
                        ? '#10b981'
                        : campaign.status === 'PAUSADA'
                        ? '#f59e0b'
                        : '#6b7280',
                  }}
                >
                  {campaign.status}
                </span>
              </motion.div>
            </div>
            <motion.button
              onClick={onClose}
              className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-colors"
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-6 h-6" />
            </motion.button>
          </div>
        </div>

        <div className="px-8 py-6">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h3 className="text-xl mb-6">Pontuação de Performance</h3>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 mb-6">
              <div className="flex items-center justify-center">
                <HealthScore 
                  score={campaign.score || calculateHealthScore({
                    ctr: campaign.ctr,
                    cost_per_conversion: campaign.custo_por_conversao,
                    frequency: campaign.frequencia,
                    impressions: campaign.impressions,
                    conversions: campaign.conversoes
                  })} 
                  size="lg" 
                />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="mb-8"
          >
            <h3 className="text-xl mb-6">Métricas Principais</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {primaryMetrics.map((metric, index) => {
                const Icon = metric.icon;
                return (
                  <motion.div
                    key={metric.label}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 group hover:border-[#d4af37]/30 transition-all"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="p-2 rounded-xl"
                        style={{ backgroundColor: `${metric.color}20` }}
                      >
                        <Icon className="w-5 h-5" style={{ color: metric.color }} />
                      </div>
                    </div>
                    <div className="text-2xl mb-1" style={{ color: metric.color }}>
                      {metric.value}
                    </div>
                    <div className="text-sm text-white/50 mb-2">{metric.label}</div>
                    <div className="text-xs text-white/40">{metric.subtitle}</div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="mb-8"
          >
            <h3 className="text-xl mb-6">Métricas de Conversão</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {conversionMetrics.map((metric, index) => {
                const Icon = metric.icon;
                return (
                  <motion.div
                    key={metric.label}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 group hover:border-[#d4af37]/30 transition-all"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.05 }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="p-2 rounded-xl"
                        style={{ backgroundColor: `${metric.color}20` }}
                      >
                        <Icon className="w-5 h-5" style={{ color: metric.color }} />
                      </div>
                    </div>
                    <div className="text-2xl mb-1" style={{ color: metric.color }}>
                      {metric.value}
                    </div>
                    <div className="text-sm text-white/50 mb-2">{metric.label}</div>
                    <div className="text-xs text-white/40">{metric.subtitle}</div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="mb-8"
          >
            <h3 className="text-xl mb-6">Métricas de Volume</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {volumeMetrics.map((metric, index) => {
                const Icon = metric.icon;
                return (
                  <motion.div
                    key={metric.label}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 group hover:border-[#d4af37]/30 transition-all"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="p-2 rounded-xl"
                        style={{ backgroundColor: `${metric.color}20` }}
                      >
                        <Icon className="w-5 h-5" style={{ color: metric.color }} />
                      </div>
                    </div>
                    <div className="text-2xl mb-1" style={{ color: metric.color }}>
                      {metric.value}
                    </div>
                    <div className="text-sm text-white/50 mb-2">{metric.label}</div>
                    <div className="text-xs text-white/40">{metric.subtitle}</div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.55 }}
          >
            <h3 className="text-xl mb-6">Desempenho ao Longo do Tempo</h3>
            {isLoading ? (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-[#d4af37] animate-spin" />
                <span className="ml-3 text-white/50">Carregando dados do gráfico...</span>
              </div>
            ) : insights.length > 0 ? (
              <MetricsChart insights={insights} />
            ) : (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-12 text-center">
                <BarChart3 className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/50">Não há dados históricos disponíveis para esta campanha.</p>
                <p className="text-white/30 text-sm mt-2">Os dados aparecem após alguns dias de veiculação.</p>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.65 }}
            className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h4 className="text-lg mb-4 text-[#d4af37]">Detalhes da Campanha</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-white/60">ID da Campanha</span>
                  <span className="text-white/90 text-sm font-mono">{campaign.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Objetivo</span>
                  <span className="text-white/90">{campaign.objective.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Orçamento Diário</span>
                  <span className="text-white/90">{formatCurrency(campaign.daily_budget)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Investimento Total</span>
                  <span className="text-white/90">{formatCurrency(campaign.spend)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Status</span>
                  <span
                    className="px-2 py-1 rounded text-xs"
                    style={{
                      backgroundColor:
                        campaign.status === 'ATIVA'
                          ? '#10b98120'
                          : campaign.status === 'PAUSADA'
                          ? '#f59e0b20'
                          : '#6b728020',
                      color:
                        campaign.status === 'ATIVA'
                          ? '#10b981'
                          : campaign.status === 'PAUSADA'
                          ? '#f59e0b'
                          : '#6b7280',
                    }}
                  >
                    {campaign.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h4 className="text-lg mb-4 text-[#d4af37]">Resumo de Eficiência</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Custo por Clique (CPC)</span>
                  <span className="text-white/90">{formatCurrency(campaign.cpc)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Custo por Mil (CPM)</span>
                  <span className="text-white/90">{formatCurrency(campaign.cpm)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Custo por Conversão (CPA)</span>
                  <span className="text-white/90">{formatCurrency(campaign.custo_por_conversao)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Taxa de Cliques (CTR)</span>
                  <span className="text-white/90">{formatDecimal(campaign.ctr, 2)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">Frequência</span>
                  <span className="text-white/90">{formatDecimal(campaign.frequencia, 2)}x</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}
