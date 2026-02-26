import { SimStats } from '@/lib/simulation';
import { motion } from 'framer-motion';

interface StatsPanelProps {
  stats: SimStats;
  totalNodes: number;
}

const statItems = [
  { key: 'healthy' as const, label: 'Healthy', colorClass: 'text-sim-healthy' },
  { key: 'infected' as const, label: 'Infected', colorClass: 'text-sim-infected' },
  { key: 'recovered' as const, label: 'Fact-Checked', colorClass: 'text-sim-recovered' },
  { key: 'aware' as const, label: 'Aware', colorClass: 'text-sim-aware' },
];

export default function StatsPanel({ stats, totalNodes }: StatsPanelProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {statItems.map(({ key, label, colorClass }) => (
        <motion.div
          key={key}
          className="bg-secondary rounded-lg p-3 border border-border"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1">
            {label}
          </div>
          <div className={`text-2xl font-mono font-bold ${colorClass}`}>
            {stats[key]}
          </div>
          <div className="text-xs text-muted-foreground font-mono">
            {totalNodes > 0 ? ((stats[key] / totalNodes) * 100).toFixed(1) : 0}%
          </div>
        </motion.div>
      ))}
    </div>
  );
}
