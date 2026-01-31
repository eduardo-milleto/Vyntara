import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, TrendingUp, TrendingDown, AlertCircle, Info, X } from 'lucide-react';
import { useState } from 'react';

export interface Alert {
  id: string;
  type: 'warning' | 'danger' | 'info' | 'success';
  title: string;
  message: string;
  campaignId?: string;
  timestamp: Date;
}

interface AlertsPanelProps {
  alerts: Alert[];
  onDismiss: (id: string) => void;
}

export function AlertsPanel({ alerts, onDismiss }: AlertsPanelProps) {
  const [expanded, setExpanded] = useState(true);

  const alertConfig = {
    warning: {
      icon: AlertTriangle,
      color: '#f59e0b',
      bg: '#f59e0b20',
      border: '#f59e0b40',
    },
    danger: {
      icon: AlertCircle,
      color: '#ef4444',
      bg: '#ef444420',
      border: '#ef444440',
    },
    info: {
      icon: Info,
      color: '#3b82f6',
      bg: '#3b82f620',
      border: '#3b82f640',
    },
    success: {
      icon: TrendingUp,
      color: '#10b981',
      bg: '#10b98120',
      border: '#10b98140',
    },
  };

  if (alerts.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-6"
    >
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#ef4444]/20 rounded-xl">
              <AlertCircle className="w-5 h-5 text-[#ef4444]" />
            </div>
            <div className="text-left">
              <h3 className="text-lg">Alertas e Notificações</h3>
              <p className="text-sm text-white/50">{alerts.length} alertas ativos</p>
            </div>
          </div>
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        </button>

        {/* Alerts List */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-white/10"
            >
              <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
                {alerts.map((alert, index) => {
                  const config = alertConfig[alert.type];
                  const Icon = config.icon;

                  return (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className="group relative rounded-xl p-4 transition-all hover:scale-[1.02]"
                      style={{
                        backgroundColor: config.bg,
                        border: `1px solid ${config.border}`,
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="p-2 rounded-lg flex-shrink-0"
                          style={{ backgroundColor: `${config.color}30` }}
                        >
                          <Icon className="w-5 h-5" style={{ color: config.color }} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h4 className="mb-1" style={{ color: config.color }}>
                            {alert.title}
                          </h4>
                          <p className="text-sm text-white/70 leading-relaxed">
                            {alert.message}
                          </p>
                          <p className="text-xs text-white/40 mt-2">
                            {alert.timestamp.toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>

                        <motion.button
                          onClick={() => onDismiss(alert.id)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <X className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
