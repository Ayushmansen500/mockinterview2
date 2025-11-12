import { Users, BarChart3, TrendingUp, Trophy } from 'lucide-react';
import type { BatchMetrics } from '../lib/scoring';

interface AnalyticsDashboardProps {
  metrics: BatchMetrics;
  loading?: boolean;
}

export function AnalyticsDashboard({ metrics, loading = false }: AnalyticsDashboardProps) {
  const cards = [
    {
      icon: Users,
      label: 'Total Students',
      value: metrics.totalStudents,
      color: 'blue',
    },
    {
      icon: BarChart3,
      label: 'Total Interviews',
      value: metrics.totalInterviews,
      color: 'purple',
    },
    {
      icon: TrendingUp,
      label: 'Average Score',
      value: `${metrics.averageScore}/10`,
      color: 'green',
    },
    {
      icon: Trophy,
      label: 'Highest Score',
      value: `${metrics.highestIndividualScore}/10`,
      color: 'yellow',
    },
  ];

  const colorStyles = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
  };

  const iconColors = {
    blue: 'text-blue-600 dark:text-blue-400',
    purple: 'text-purple-600 dark:text-purple-400',
    green: 'text-green-600 dark:text-green-400',
    yellow: 'text-yellow-600 dark:text-yellow-400',
    red: 'text-red-600 dark:text-red-400',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        const bgStyle = colorStyles[card.color as keyof typeof colorStyles];
        const iconStyle = iconColors[card.color as keyof typeof iconColors];

        return (
          <div
            key={idx}
            className={`rounded-lg border p-6 transition-all ${
              loading ? 'opacity-50' : ''
            } ${bgStyle}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2 rounded-lg ${bgStyle}`}>
                <Icon className={`w-6 h-6 ${iconStyle}`} />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
              {card.label}
            </p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {loading ? '-' : card.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
