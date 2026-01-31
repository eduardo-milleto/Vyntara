import { motion } from 'motion/react';
import { Calendar, Filter, X } from 'lucide-react';
import { useState } from 'react';

export type DateFilter = 'today' | 'yesterday' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'custom';
export type StatusFilter = 'all' | 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
export type ObjectiveFilter = 'all' | 'CONVERSIONS' | 'REACH' | 'TRAFFIC' | 'BRAND_AWARENESS' | 'ENGAGEMENT';

interface FiltersProps {
  dateFilter: DateFilter;
  statusFilter: StatusFilter;
  objectiveFilter: ObjectiveFilter;
  onDateFilterChange: (filter: DateFilter) => void;
  onStatusFilterChange: (filter: StatusFilter) => void;
  onObjectiveFilterChange: (filter: ObjectiveFilter) => void;
  customDateRange?: { start: string; end: string };
  onCustomDateRangeChange?: (range: { start: string; end: string }) => void;
}

export function Filters({
  dateFilter,
  statusFilter,
  objectiveFilter,
  onDateFilterChange,
  onStatusFilterChange,
  onObjectiveFilterChange,
  customDateRange,
  onCustomDateRangeChange,
}: FiltersProps) {
  const [showFilters, setShowFilters] = useState(false);

  const dateOptions: { value: DateFilter; label: string }[] = [
    { value: 'today', label: 'Hoje' },
    { value: 'yesterday', label: 'Ontem' },
    { value: 'last7days', label: 'Últimos 7 dias' },
    { value: 'last30days', label: 'Últimos 30 dias' },
    { value: 'thisMonth', label: 'Este mês' },
    { value: 'lastMonth', label: 'Mês passado' },
    { value: 'custom', label: 'Período customizado' },
  ];

  const statusOptions: { value: StatusFilter; label: string; color: string }[] = [
    { value: 'all', label: 'Todos', color: '#d4af37' },
    { value: 'ACTIVE', label: 'Ativas', color: '#10b981' },
    { value: 'PAUSED', label: 'Pausadas', color: '#f59e0b' },
    { value: 'ARCHIVED', label: 'Arquivadas', color: '#6b7280' },
  ];

  const objectiveOptions: { value: ObjectiveFilter; label: string }[] = [
    { value: 'all', label: 'Todos objetivos' },
    { value: 'CONVERSIONS', label: 'Conversões' },
    { value: 'REACH', label: 'Alcance' },
    { value: 'TRAFFIC', label: 'Tráfego' },
    { value: 'BRAND_AWARENESS', label: 'Reconhecimento' },
    { value: 'ENGAGEMENT', label: 'Engajamento' },
  ];

  return (
    <div className="space-y-4">
      {/* Filter Toggle Button */}
      <motion.button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 border border-[#d4af37]/30 rounded-2xl backdrop-blur-xl transition-all"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Filter className="w-5 h-5 text-[#d4af37]" />
        <span>Filtros Avançados</span>
        {(dateFilter !== 'last7days' || statusFilter !== 'all' || objectiveFilter !== 'all') && (
          <span className="px-2 py-0.5 bg-[#d4af37] text-black text-xs rounded-full">
            Ativos
          </span>
        )}
      </motion.button>

      {/* Filters Panel */}
      <motion.div
        initial={false}
        animate={{
          height: showFilters ? 'auto' : 0,
          opacity: showFilters ? 1 : 0,
        }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-6">
          {/* Date Filter */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-[#d4af37]" />
              <label className="text-sm text-white/60">Período</label>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {dateOptions.map((option) => (
                <motion.button
                  key={option.value}
                  onClick={() => onDateFilterChange(option.value)}
                  className={`px-4 py-2 rounded-xl text-sm transition-all ${
                    dateFilter === option.value
                      ? 'bg-[#d4af37] text-black'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {option.label}
                </motion.button>
              ))}
            </div>

            {/* Custom Date Range */}
            {dateFilter === 'custom' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 grid grid-cols-2 gap-3"
              >
                <div>
                  <label className="text-xs text-white/40 mb-2 block">Data inicial</label>
                  <input
                    type="date"
                    value={customDateRange?.start || ''}
                    onChange={(e) =>
                      onCustomDateRangeChange?.({
                        start: e.target.value,
                        end: customDateRange?.end || '',
                      })
                    }
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-[#d4af37]/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/40 mb-2 block">Data final</label>
                  <input
                    type="date"
                    value={customDateRange?.end || ''}
                    onChange={(e) =>
                      onCustomDateRangeChange?.({
                        start: customDateRange?.start || '',
                        end: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-[#d4af37]/50"
                  />
                </div>
              </motion.div>
            )}
          </div>

          {/* Status Filter */}
          <div>
            <label className="text-sm text-white/60 mb-3 block">Status da Campanha</label>
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <motion.button
                  key={option.value}
                  onClick={() => onStatusFilterChange(option.value)}
                  className={`px-4 py-2 rounded-xl text-sm transition-all ${
                    statusFilter === option.value
                      ? 'border-2'
                      : 'bg-white/5 text-white/60 hover:bg-white/10 border border-transparent'
                  }`}
                  style={
                    statusFilter === option.value
                      ? {
                          backgroundColor: `${option.color}20`,
                          color: option.color,
                          borderColor: option.color,
                        }
                      : {}
                  }
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {option.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Objective Filter */}
          <div>
            <label className="text-sm text-white/60 mb-3 block">Objetivo</label>
            <div className="flex flex-wrap gap-2">
              {objectiveOptions.map((option) => (
                <motion.button
                  key={option.value}
                  onClick={() => onObjectiveFilterChange(option.value)}
                  className={`px-4 py-2 rounded-xl text-sm transition-all ${
                    objectiveFilter === option.value
                      ? 'bg-[#d4af37] text-black'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {option.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Clear Filters */}
          {(dateFilter !== 'last7days' || statusFilter !== 'all' || objectiveFilter !== 'all') && (
            <motion.button
              onClick={() => {
                onDateFilterChange('last7days');
                onStatusFilterChange('all');
                onObjectiveFilterChange('all');
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <X className="w-4 h-4" />
              Limpar filtros
            </motion.button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
