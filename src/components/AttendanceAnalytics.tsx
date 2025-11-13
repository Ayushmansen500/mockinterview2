import { Users, CheckCircle, XCircle, TrendingUp } from 'lucide-react';

interface AttendanceAnalyticsProps {
  presentCount: number;
  totalCount: number;
  attendancePercentage: number;
}

export function AttendanceAnalytics({ presentCount, totalCount, attendancePercentage }: AttendanceAnalyticsProps) {
  const absentCount = totalCount - presentCount;

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 70) return 'text-green-600 dark:text-green-400';
    if (percentage >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getPercentageBg = (percentage: number) => {
    if (percentage >= 70) return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    if (percentage >= 50) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
  };

  const cards = [
    {
      icon: Users,
      label: 'Total Students',
      value: totalCount,
      color: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      icon: CheckCircle,
      label: 'Present',
      value: presentCount,
      color: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
      iconColor: 'text-green-600 dark:text-green-400',
    },
    {
      icon: XCircle,
      label: 'Absent',
      value: absentCount,
      color: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
      iconColor: 'text-red-600 dark:text-red-400',
    },
    {
      icon: TrendingUp,
      label: 'Attendance %',
      value: `${attendancePercentage}%`,
      color: getPercentageBg(attendancePercentage),
      iconColor: getPercentageColor(attendancePercentage),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`rounded-lg border p-6 transition-all ${card.color}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2 rounded-lg ${card.color}`}>
                <Icon className={`w-6 h-6 ${card.iconColor}`} />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
              {card.label}
            </p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {card.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
