import { motion } from 'motion/react';
import { Pause, Play, DollarSign, TrendingUp, Target, MessageCircle } from 'lucide-react';
import { formatCurrency, formatNumber } from '../utils/formatters';

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

interface CampaignCardProps {
  campaign: Campaign;
  index: number;
}

export function CampaignCard({ campaign, index }: CampaignCardProps) {
  const statusConfig = {
    ATIVA: { label: 'Ativa', color: '#10b981', icon: Play },
    PAUSADA: { label: 'Pausada', color: '#f59e0b', icon: Pause },
    ARQUIVADA: { label: 'Arquivada', color: '#6b7280', icon: Pause },
  };

  const status = statusConfig[campaign.status];
  const StatusIcon = status.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.05,
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{
        y: -4,
        transition: { duration: 0.2 },
      }}
      className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 overflow-hidden hover:border-[#d4af37]/30 transition-all duration-300"
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-[#d4af37]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        initial={false}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <motion.div
                className="px-2.5 py-1 rounded-full text-xs flex items-center gap-1.5"
                style={{
                  backgroundColor: `${status.color}20`,
                  color: status.color,
                  border: `1px solid ${status.color}40`,
                }}
              >
                <StatusIcon className="w-3 h-3" />
                {status.label}
              </motion.div>
            </div>
            <h3 className="text-base font-medium text-white/90 group-hover:text-[#d4af37] transition-colors duration-300 truncate">
              {campaign.name}
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          <div className="text-center p-2.5 bg-white/5 rounded-xl">
            <DollarSign className="w-4 h-4 text-[#d4af37] mx-auto mb-1" />
            <div className="text-base font-semibold text-[#d4af37]">
              {formatCurrency(campaign.spend)}
            </div>
            <div className="text-xs text-white/50">Investido</div>
          </div>
          
          <div className="text-center p-2.5 bg-white/5 rounded-xl">
            <TrendingUp className="w-4 h-4 text-[#10b981] mx-auto mb-1" />
            <div className="text-base font-semibold text-[#10b981]">
              {formatNumber(campaign.conversoes)}
            </div>
            <div className="text-xs text-white/50">Conversões</div>
          </div>
          
          <div className="text-center p-2.5 bg-white/5 rounded-xl">
            <Target className="w-4 h-4 text-[#f59e0b] mx-auto mb-1" />
            <div className="text-base font-semibold text-[#f59e0b]">
              {formatCurrency(campaign.custo_por_conversao)}
            </div>
            <div className="text-xs text-white/50">Custo/Conv.</div>
          </div>
          
          <div className="text-center p-2.5 bg-white/5 rounded-xl">
            <MessageCircle className="w-4 h-4 text-[#0668E1] mx-auto mb-1" />
            <div className="text-base font-semibold text-[#0668E1]">
              {campaign.connectRate.toFixed(1)}%
            </div>
            <div className="text-xs text-white/50">Connect Rate</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
