import { motion } from 'motion/react';
import { Clock, Play, Pause, DollarSign, Target, Edit, AlertCircle } from 'lucide-react';

export interface CampaignEvent {
  id: string;
  type: 'status_change' | 'budget_change' | 'objective_change' | 'creative_update' | 'alert';
  timestamp: Date;
  description: string;
  metadata?: Record<string, any>;
}

interface EventLogProps {
  events: CampaignEvent[];
}

export function EventLog({ events }: EventLogProps) {
  const eventConfig = {
    status_change: {
      icon: Play,
      color: '#10b981',
      bg: '#10b98120',
    },
    budget_change: {
      icon: DollarSign,
      color: '#d4af37',
      bg: '#d4af3720',
    },
    objective_change: {
      icon: Target,
      color: '#3b82f6',
      bg: '#3b82f620',
    },
    creative_update: {
      icon: Edit,
      color: '#8b5cf6',
      bg: '#8b5cf620',
    },
    alert: {
      icon: AlertCircle,
      color: '#ef4444',
      bg: '#ef444420',
    },
  };

  const sortedEvents = [...events].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-[#d4af37]/20 rounded-xl">
          <Clock className="w-5 h-5 text-[#d4af37]" />
        </div>
        <div>
          <h3 className="text-xl">Histórico de Eventos</h3>
          <p className="text-sm text-white/50">{events.length} eventos registrados</p>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {sortedEvents.length === 0 ? (
          <div className="text-center py-8 text-white/40">
            Nenhum evento registrado ainda
          </div>
        ) : (
          sortedEvents.map((event, index) => {
            const config = eventConfig[event.type];
            const Icon = config.icon;

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative pl-8 pb-6 last:pb-0"
              >
                {/* Timeline Line */}
                {index < sortedEvents.length - 1 && (
                  <div className="absolute left-[11px] top-8 bottom-0 w-0.5 bg-white/10" />
                )}

                {/* Icon */}
                <div
                  className="absolute left-0 top-0 p-1.5 rounded-lg"
                  style={{ backgroundColor: config.bg }}
                >
                  <Icon className="w-4 h-4" style={{ color: config.color }} />
                </div>

                {/* Content */}
                <div className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-all">
                  <p className="text-sm leading-relaxed mb-2">{event.description}</p>
                  <div className="flex items-center gap-4 text-xs text-white/40">
                    <span>
                      {event.timestamp.toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                      <span className="px-2 py-0.5 bg-white/10 rounded">
                        {Object.entries(event.metadata)[0][0]}: {Object.entries(event.metadata)[0][1]}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
