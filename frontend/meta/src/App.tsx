import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { CampaignCard } from './components/CampaignCard';
import { RefreshCw, DollarSign, TrendingUp, Target, AlertCircle, Home, Search, Calendar } from 'lucide-react';
import { formatCurrency, formatNumber } from './utils/formatters';

interface Campaign {
  id: string;
  name: string;
  status: 'ATIVA' | 'PAUSADA' | 'ARQUIVADA';
  objective: string;
  spend: number;
  conversoes: number;
  custo_por_conversao: number;
  connectRate: number;
}

type StatusFilter = 'all' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
type DateFilter = 'all' | 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth';

function mapDateFilterToApiRange(filter: DateFilter): string {
  const map: Record<DateFilter, string> = {
    'all': 'maximum',
    'today': 'today',
    'yesterday': 'yesterday',
    'last7days': 'last_7d',
    'last30days': 'last_30d',
    'thisMonth': 'this_month',
    'lastMonth': 'last_month'
  };
  return map[filter] || 'maximum';
}

export default function App() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAllData = useCallback(async (range: string) => {
    setError(null);
    
    try {
      const campaignsRes = await fetch(`/api/meta/campaigns?range=${range}&status=all&objective=all`);
      const campaignsData = await campaignsRes.json();
      
      if (!campaignsData.success && campaignsData.error?.includes('limit reached')) {
        setError('Limite de requisições da API do Meta atingido. Aguarde alguns minutos e tente novamente.');
        return;
      }
      
      if (campaignsData.success) {
        const mappedCampaigns: Campaign[] = campaignsData.data.map((c: any) => ({
          id: c.id,
          name: c.name,
          status: c.status,
          objective: c.objective,
          spend: c.metrics.spend,
          conversoes: c.metrics.conversions,
          custo_por_conversao: c.metrics.costPerConversion,
          connectRate: c.metrics.connectRate || 0,
        }));
        setCampaigns(mappedCampaigns);
      }
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
      setError('Erro ao carregar dados da API do Meta. Verifique suas credenciais.');
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const init = async () => {
      try {
        const response = await fetch('/api/meta/check');
        const data = await response.json();
        
        if (!isMounted) return;
        
        if (data.success) {
          setIsConnected(true);
          await fetchAllData(mapDateFilterToApiRange(dateFilter));
        } else {
          setIsConnected(false);
        }
      } catch (err) {
        console.error('[Meta] Error:', err);
        if (isMounted) {
          setIsConnected(false);
          setError('Erro ao conectar com a API do Meta');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    init();
    
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (isConnected && !isLoading) {
      setIsRefreshing(true);
      fetchAllData(mapDateFilterToApiRange(dateFilter)).finally(() => setIsRefreshing(false));
    }
  }, [dateFilter, isConnected, isLoading, fetchAllData]);

  const refreshData = async () => {
    setIsRefreshing(true);
    await fetchAllData(mapDateFilterToApiRange(dateFilter));
    setIsRefreshing(false);
  };

  const filteredCampaigns = useMemo(() => {
    let result = campaigns;
    
    // Filtro por status
    if (statusFilter !== 'all') {
      const statusMap: Record<string, string> = {
        'ACTIVE': 'ATIVA',
        'PAUSED': 'PAUSADA',
        'ARCHIVED': 'ARQUIVADA'
      };
      const targetStatus = statusMap[statusFilter];
      result = result.filter(c => c.status === targetStatus);
    }
    
    // Filtro por busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(c => c.name.toLowerCase().includes(query));
    }
    
    return result;
  }, [campaigns, statusFilter, searchQuery]);

  const totalSpend = filteredCampaigns.reduce((sum, camp) => sum + camp.spend, 0);
  const totalConversoes = filteredCampaigns.reduce((sum, camp) => sum + camp.conversoes, 0);
  const avgCostPerConversao = totalConversoes > 0 ? totalSpend / totalConversoes : 0;

  const dateFilterOptions: { value: DateFilter; label: string }[] = [
    { value: 'all', label: 'Todo período' },
    { value: 'today', label: 'Hoje' },
    { value: 'yesterday', label: 'Ontem' },
    { value: 'last7days', label: '7 dias' },
    { value: 'last30days', label: '30 dias' },
    { value: 'thisMonth', label: 'Este mês' },
    { value: 'lastMonth', label: 'Mês passado' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-[#0668E1] animate-spin mx-auto mb-4" />
          <p className="text-white/70">Conectando com Meta Ads...</p>
        </div>
      </div>
    );
  }

  if (isConnected === false) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Erro de Conexão</h2>
          <p className="text-white/70 mb-6">
            Não foi possível conectar com a API do Meta Ads. 
            Verifique se as variáveis de ambiente META_TOKEN e AD_ACCOUNT_ID estão configuradas corretamente.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-[#0668E1] text-white rounded-lg hover:bg-[#0553b8] transition-colors"
          >
            Tentar Novamente
          </button>
          <a
            href="/menu"
            className="flex items-center justify-center gap-2 mt-4 text-white/70 hover:text-white transition-colors"
          >
            <Home className="w-4 h-4" />
            Voltar ao Menu
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-0 left-1/4 w-96 h-96 bg-[#0668E1] rounded-full opacity-10 blur-[120px]"
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#0668E1] rounded-full opacity-10 blur-[120px]"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -30, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="relative z-10">
        <motion.header
          className="border-b border-white/10 backdrop-blur-xl bg-black/40"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <a href="/menu" className="hover:opacity-80 transition-opacity">
                  <img src="/meta/meta-logo.png" alt="Meta" className="w-8 h-8 object-contain" style={{ maxWidth: '32px', maxHeight: '32px' }} />
                </a>
                <div>
                  <h1 className="text-3xl tracking-tight bg-gradient-to-r from-[#0668E1] to-[#00C6FF] bg-clip-text text-transparent font-bold">
                    Meta Ads
                  </h1>
                  <p className="text-white/50 text-sm">Campanhas e Métricas</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href="/menu"
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl backdrop-blur-xl transition-all flex items-center gap-2"
                >
                  <Home className="w-4 h-4 text-[#0668E1]" />
                  <span className="text-sm">Menu</span>
                </a>
                <motion.button
                  onClick={refreshData}
                  disabled={isRefreshing}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-[#0668E1]/30 rounded-xl backdrop-blur-xl transition-all flex items-center gap-2 group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <RefreshCw
                    className={`w-4 h-4 text-[#0668E1] ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`}
                  />
                  <span className="text-sm">Atualizar</span>
                </motion.button>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Filtro de período */}
            <div className="mb-6 flex items-center gap-2 flex-wrap">
              <Calendar className="w-4 h-4 text-white/50" />
              <span className="text-sm text-white/50 mr-2">Período:</span>
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
                {dateFilterOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setDateFilter(option.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                      dateFilter === option.value
                        ? 'bg-[#0668E1] text-white font-medium'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: DollarSign, label: 'Total Investido', value: formatCurrency(totalSpend), color: '#d4af37' },
                { icon: TrendingUp, label: 'Conversões', value: formatNumber(totalConversoes), color: '#10b981' },
                { icon: Target, label: 'Custo por Conversão', value: formatCurrency(avgCostPerConversao), color: '#f59e0b' },
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  whileHover={{ y: -2, transition: { duration: 0.2 } }}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${stat.color}20` }}>
                      <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                    </div>
                    <div>
                      <div className="text-2xl font-semibold" style={{ color: stat.color }}>
                        {stat.value}
                      </div>
                      <div className="text-xs text-white/50">{stat.label}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.header>

        <div className="max-w-7xl mx-auto px-6 py-6">
          <motion.div
            className="mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-xl font-medium">Campanhas</h2>
                <p className="text-white/50 text-sm">
                  {campaigns.filter(c => c.status === 'ATIVA').length} ativas • {campaigns.filter(c => c.status === 'PAUSADA').length} pausadas • {campaigns.length} total
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Campo de busca */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    placeholder="Buscar campanha..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#0668E1]/50 w-full sm:w-64"
                  />
                </div>
                
                {/* Filtro de status */}
                <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
                  {[
                    { value: 'all' as const, label: 'Todas', count: campaigns.length },
                    { value: 'ACTIVE' as const, label: 'Ativas', count: campaigns.filter(c => c.status === 'ATIVA').length },
                    { value: 'PAUSED' as const, label: 'Pausadas', count: campaigns.filter(c => c.status === 'PAUSADA').length },
                  ].map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => setStatusFilter(filter.value)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                        statusFilter === filter.value
                          ? 'bg-[#0668E1] text-white font-medium'
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {filter.label} ({filter.count})
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Indicador de busca ativa */}
          {searchQuery && (
            <motion.div
              className="mb-4 flex items-center gap-2"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span className="text-sm text-white/50">
                {filteredCampaigns.length} resultado(s) para "{searchQuery}"
              </span>
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs text-[#0668E1] hover:underline"
              >
                Limpar busca
              </button>
            </motion.div>
          )}

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {filteredCampaigns.map((campaign, index) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                index={index}
              />
            ))}
          </motion.div>

          {filteredCampaigns.length === 0 && (
            <motion.div
              className="text-center py-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="text-white/30 text-lg">
                {searchQuery ? `Nenhuma campanha encontrada para "${searchQuery}"` : 'Nenhuma campanha encontrada'}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
