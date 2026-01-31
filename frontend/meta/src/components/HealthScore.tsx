import { motion } from 'motion/react';

interface HealthScoreProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function HealthScore({ score, size = 'md', showLabel = true }: HealthScoreProps) {
  const getScoreConfig = (score: number) => {
    if (score >= 90) {
      return {
        label: 'Excelente',
        color: '#10b981',
        gradient: ['#10b981', '#059669'],
      };
    } else if (score >= 70) {
      return {
        label: 'Bom',
        color: '#3b82f6',
        gradient: ['#3b82f6', '#2563eb'],
      };
    } else if (score >= 40) {
      return {
        label: 'Regular',
        color: '#f59e0b',
        gradient: ['#f59e0b', '#d97706'],
      };
    } else {
      return {
        label: 'Crítico',
        color: '#ef4444',
        gradient: ['#ef4444', '#dc2626'],
      };
    }
  };

  const config = getScoreConfig(score);
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const sizes = {
    sm: { container: 60, text: 'text-sm', label: 'text-xs' },
    md: { container: 100, text: 'text-xl', label: 'text-sm' },
    lg: { container: 140, text: 'text-3xl', label: 'text-base' },
  };

  const currentSize = sizes[size];

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: currentSize.container, height: currentSize.container }}>
        <svg
          className="transform -rotate-90"
          width={currentSize.container}
          height={currentSize.container}
        >
          <defs>
            <linearGradient id={`healthGradient-${score}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={config.gradient[0]} />
              <stop offset="100%" stopColor={config.gradient[1]} />
            </linearGradient>
          </defs>

          {/* Background Circle */}
          <circle
            cx={currentSize.container / 2}
            cy={currentSize.container / 2}
            r="45"
            stroke="#ffffff10"
            strokeWidth="8"
            fill="none"
          />

          {/* Progress Circle */}
          <motion.circle
            cx={currentSize.container / 2}
            cy={currentSize.container / 2}
            r="45"
            stroke={`url(#healthGradient-${score})`}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            style={{
              strokeDasharray: circumference,
            }}
          />

          {/* Glow Effect */}
          <circle
            cx={currentSize.container / 2}
            cy={currentSize.container / 2}
            r="45"
            stroke={config.color}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            opacity="0.3"
            filter="blur(4px)"
            style={{
              strokeDasharray: circumference,
              strokeDashoffset,
            }}
          />
        </svg>

        {/* Score Text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
            className={`${currentSize.text}`}
            style={{ color: config.color }}
          >
            {Math.round(score)}
          </motion.div>
        </div>
      </div>

      {showLabel && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <div
            className={`${currentSize.label} px-3 py-1 rounded-full`}
            style={{
              backgroundColor: `${config.color}20`,
              color: config.color,
              border: `1px solid ${config.color}40`,
            }}
          >
            {config.label}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Calculate health score based on campaign metrics
export function calculateHealthScore(campaign: {
  ctr: number;
  cost_per_conversion: number;
  frequency: number;
  impressions: number;
  conversions: number;
}): number {
  let score = 0;

  // CTR Score (0-30 points)
  if (campaign.ctr >= 3) score += 30;
  else if (campaign.ctr >= 2) score += 25;
  else if (campaign.ctr >= 1.5) score += 20;
  else if (campaign.ctr >= 1) score += 15;
  else if (campaign.ctr >= 0.5) score += 10;
  else score += 5;

  // Cost per Conversion Score (0-30 points)
  if (campaign.cost_per_conversion <= 10) score += 30;
  else if (campaign.cost_per_conversion <= 15) score += 25;
  else if (campaign.cost_per_conversion <= 20) score += 20;
  else if (campaign.cost_per_conversion <= 30) score += 15;
  else if (campaign.cost_per_conversion <= 50) score += 10;
  else score += 5;

  // Frequency Score (0-20 points) - ideal is 1.5-2.5
  if (campaign.frequency >= 1.5 && campaign.frequency <= 2.5) score += 20;
  else if (campaign.frequency >= 1 && campaign.frequency < 1.5) score += 15;
  else if (campaign.frequency >= 2.5 && campaign.frequency < 3.5) score += 15;
  else if (campaign.frequency < 1) score += 10;
  else score += 5;

  // Volume Score (0-20 points)
  if (campaign.impressions >= 100000) score += 20;
  else if (campaign.impressions >= 50000) score += 15;
  else if (campaign.impressions >= 10000) score += 10;
  else if (campaign.impressions >= 5000) score += 5;

  return Math.min(Math.round(score), 100);
}
