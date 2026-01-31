import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatCurrency, formatNumber, formatPercentage } from '../utils/formatters';

interface ComparisonMetric {
  label: string;
  current: number;
  previous: number;
  format: 'currency' | 'number' | 'percentage';
  suffix?: string;
}

interface ComparisonChartProps {
  metrics: ComparisonMetric[];
  periodLabel: { current: string; previous: string };
}

export function ComparisonChart({ metrics, periodLabel }: ComparisonChartProps) {
  const formatValue = (value: number, format: ComparisonMetric['format'], suffix?: string) => {
    if (format === 'currency') return formatCurrency(value);
    if (format === 'percentage') return formatPercentage(value);
    return formatNumber(value) + (suffix || '');
  };

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return { percentage: 0, isPositive: true, isNeutral: true };
    const percentage = ((current - previous) / previous) * 100;
    return {
      percentage: Math.abs(percentage),
      isPositive: percentage > 0,
      isNeutral: Math.abs(percentage) < 0.1,
    };
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <div className="mb-6">
        <h3 className="text-xl mb-2">Comparação de Períodos</h3>
        <div className="flex items-center gap-4 text-sm text-white/50">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-[#d4af37] rounded-full" />
            {periodLabel.current}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-white/30 rounded-full" />
            {periodLabel.previous}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {metrics.map((metric, index) => {
          const change = calculateChange(metric.current, metric.previous);
          const maxValue = Math.max(metric.current, metric.previous);

          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="space-y-2"
            >
              {/* Metric Label and Values */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">{metric.label}</span>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-[#d4af37]">
                    {formatValue(metric.current, metric.format, metric.suffix)}
                  </span>
                  <span className="text-sm text-white/30">
                    {formatValue(metric.previous, metric.format, metric.suffix)}
                  </span>
                </div>
              </div>

              {/* Progress Bars */}
              <div className="space-y-1.5">
                {/* Current Period Bar */}
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[#d4af37] to-[#ffd700]"
                    initial={{ width: 0 }}
                    animate={{ width: `${(metric.current / maxValue) * 100}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: index * 0.1 + 0.2 }}
                  />
                </div>

                {/* Previous Period Bar */}
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-white/30"
                    initial={{ width: 0 }}
                    animate={{ width: `${(metric.previous / maxValue) * 100}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: index * 0.1 + 0.2 }}
                  />
                </div>
              </div>

              {/* Change Indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 + 0.5 }}
                className="flex items-center gap-2"
              >
                {change.isNeutral ? (
                  <Minus className="w-4 h-4 text-white/40" />
                ) : change.isPositive ? (
                  <TrendingUp className="w-4 h-4 text-[#10b981]" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-[#ef4444]" />
                )}
                <span
                  className="text-sm"
                  style={{
                    color: change.isNeutral
                      ? '#ffffff60'
                      : change.isPositive
                      ? '#10b981'
                      : '#ef4444',
                  }}
                >
                  {change.isNeutral
                    ? 'Sem mudanças'
                    : `${change.isPositive ? '+' : '-'}${change.percentage.toFixed(1)}%`}
                </span>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
