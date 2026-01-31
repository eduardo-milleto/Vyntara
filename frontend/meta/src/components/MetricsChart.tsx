import { motion } from 'motion/react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useState } from 'react';
import { formatCurrency, formatNumber } from '../utils/formatters';

interface Insight {
  date: string;
  impressions: number;
  clicks: number;
  spend: number;
  conversoes: number;
}

interface MetricsChartProps {
  insights: Insight[];
}

export function MetricsChart({ insights }: MetricsChartProps) {
  const [activeChart, setActiveChart] = useState<'impressions' | 'clicks' | 'spend' | 'conversoes'>('impressions');

  const chartConfig = {
    impressions: {
      label: 'Impressões',
      color: '#d4af37',
      dataKey: 'impressions',
    },
    clicks: {
      label: 'Cliques',
      color: '#3b82f6',
      dataKey: 'clicks',
    },
    spend: {
      label: 'Investimento',
      color: '#d4af37',
      dataKey: 'spend',
    },
    conversoes: {
      label: 'Conversões',
      color: '#10b981',
      dataKey: 'conversoes',
    },
  };

  const config = chartConfig[activeChart];

  // Format date for display
  const formattedData = insights.map(insight => ({
    ...insight,
    dateFormatted: new Date(insight.date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    }),
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-black/95 backdrop-blur-xl border border-[#d4af37]/30 rounded-2xl p-4 shadow-2xl"
        >
          <p className="text-white/60 text-sm mb-2">
            {new Date(payload[0].payload.date).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-6">
              <span className="text-sm text-white/60">Impressões:</span>
              <span className="text-[#d4af37]">{formatNumber(payload[0].payload.impressions)}</span>
            </div>
            <div className="flex items-center justify-between gap-6">
              <span className="text-sm text-white/60">Cliques:</span>
              <span className="text-[#3b82f6]">{formatNumber(payload[0].payload.clicks)}</span>
            </div>
            <div className="flex items-center justify-between gap-6">
              <span className="text-sm text-white/60">Conversões:</span>
              <span className="text-[#10b981]">{formatNumber(payload[0].payload.conversoes)}</span>
            </div>
            <div className="flex items-center justify-between gap-6">
              <span className="text-sm text-white/60">Investimento:</span>
              <span className="text-[#d4af37]">{formatCurrency(payload[0].payload.spend)}</span>
            </div>
          </div>
        </motion.div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Chart Type Selector */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        {(Object.keys(chartConfig) as Array<keyof typeof chartConfig>).map((key, index) => (
          <motion.button
            key={key}
            onClick={() => setActiveChart(key)}
            className={`px-5 py-2.5 rounded-xl transition-all whitespace-nowrap ${
              activeChart === key
                ? 'bg-[#d4af37] text-black'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            {chartConfig[key].label}
          </motion.button>
        ))}
      </div>

      {/* Area Chart */}
      <motion.div
        key={activeChart}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
      >
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={formattedData}>
            <defs>
              <linearGradient id={`gradient-${activeChart}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={config.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={config.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis
              dataKey="dateFormatted"
              stroke="#ffffff40"
              style={{ fontSize: '12px' }}
              tickLine={false}
            />
            <YAxis
              stroke="#ffffff40"
              style={{ fontSize: '12px' }}
              tickLine={false}
              tickFormatter={(value) => {
                if (activeChart === 'spend') {
                  return `R$ ${value}`;
                }
                if (value >= 1000) {
                  return `${(value / 1000).toFixed(0)}k`;
                }
                return value;
              }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: config.color, strokeWidth: 2 }} />
            <Area
              type="monotone"
              dataKey={config.dataKey}
              stroke={config.color}
              strokeWidth={3}
              fill={`url(#gradient-${activeChart})`}
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Bar Chart Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
      >
        <h4 className="text-lg mb-4">Comparação Completa</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={formattedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
            <XAxis
              dataKey="dateFormatted"
              stroke="#ffffff40"
              style={{ fontSize: '12px' }}
              tickLine={false}
            />
            <YAxis
              stroke="#ffffff40"
              style={{ fontSize: '12px' }}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff10' }} />
            <Bar dataKey="conversoes" fill="#10b981" radius={[8, 8, 0, 0]} animationDuration={1000} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Performance Trends */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            label: 'Tendência de Impressões',
            value: insights.length > 1
              ? ((insights[insights.length - 1].impressions - insights[0].impressions) / insights[0].impressions * 100).toFixed(1)
              : '0',
            positive: insights.length > 1 && insights[insights.length - 1].impressions > insights[0].impressions,
          },
          {
            label: 'Tendência de Cliques',
            value: insights.length > 1
              ? ((insights[insights.length - 1].clicks - insights[0].clicks) / insights[0].clicks * 100).toFixed(1)
              : '0',
            positive: insights.length > 1 && insights[insights.length - 1].clicks > insights[0].clicks,
          },
          {
            label: 'Tendência de Conversões',
            value: insights.length > 1
              ? ((insights[insights.length - 1].conversoes - insights[0].conversoes) / insights[0].conversoes * 100).toFixed(1)
              : '0',
            positive: insights.length > 1 && insights[insights.length - 1].conversoes > insights[0].conversoes,
          },
        ].map((trend, index) => (
          <motion.div
            key={trend.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5"
          >
            <div className="text-sm text-white/50 mb-2">{trend.label}</div>
            <div className={`text-2xl flex items-center gap-2 ${trend.positive ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
              {trend.positive ? '+' : ''}{trend.value}%
              <svg
                className={`w-5 h-5 ${trend.positive ? '' : 'rotate-180'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
