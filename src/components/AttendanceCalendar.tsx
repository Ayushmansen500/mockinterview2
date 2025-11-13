import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AttendanceSession {
  id: string;
  session_date: string;
  session_name: string;
}

interface AttendanceCalendarProps {
  sessions: AttendanceSession[];
  onDateSelect: (date: string) => void;
  selectedDate: string | null;
}

interface DayAttendance {
  date: string;
  count: number;
  sessionId: string;
  percentage: number;
}

export function AttendanceCalendar({ sessions, onDateSelect, selectedDate }: AttendanceCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [dayAttendance, setDayAttendance] = useState<Map<string, DayAttendance>>(new Map());

  useEffect(() => {
    loadMonthAttendance();
  }, [currentMonth, sessions]);

  const loadMonthAttendance = async () => {
    const attendanceMap = new Map<string, DayAttendance>();

    for (const session of sessions) {
      const sessionDate = new Date(session.session_date);
      const currentDate = new Date(currentMonth);

      if (sessionDate.getMonth() === currentDate.getMonth() &&
          sessionDate.getFullYear() === currentDate.getFullYear()) {

        const { data } = await supabase
          .from('attendance_records')
          .select('id, status')
          .eq('session_id', session.id);

        if (data) {
          const presentCount = data.filter(r => r.status === 'present').length;
          const totalCount = data.length;
          const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

          attendanceMap.set(session.session_date, {
            date: session.session_date,
            count: presentCount,
            sessionId: session.id,
            percentage,
          });
        }
      }
    }

    setDayAttendance(attendanceMap);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 70) return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700';
    if (percentage >= 50) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700';
    return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700';
  };

  const days = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
          <CalendarIcon className="w-5 h-5" />
          Attendance Calendar
        </h3>
        <div className="flex items-center gap-4">
          <button
            onClick={previousMonth}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
          <span className="text-sm font-medium text-slate-900 dark:text-white min-w-[150px] text-center">
            {monthName}
          </span>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-sm font-semibold text-slate-600 dark:text-slate-400 py-2">
            {day}
          </div>
        ))}

        {days.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const dateKey = formatDateKey(day);
          const attendance = dayAttendance.get(dateKey);
          const isSelected = selectedDate === dateKey;
          const isToday = formatDateKey(new Date()) === dateKey;

          return (
            <button
              key={dateKey}
              onClick={() => attendance && onDateSelect(dateKey)}
              disabled={!attendance}
              className={`aspect-square rounded-lg border-2 transition-all relative ${
                isSelected
                  ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30'
                  : attendance
                  ? `${getAttendanceColor(attendance.percentage)} border-opacity-50 hover:border-opacity-100 cursor-pointer`
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30 cursor-default'
              }`}
            >
              <div className="absolute top-1 left-1 text-xs font-medium">
                {day.getDate()}
              </div>
              {isToday && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-blue-600 rounded-full" />
              )}
              {attendance && (
                <div className="absolute bottom-1 left-0 right-0 text-center">
                  <div className="text-lg font-bold">{attendance.count}</div>
                  <div className="text-xs">{attendance.percentage}%</div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900/30 border-2 border-green-300 dark:border-green-700" />
          <span className="text-slate-600 dark:text-slate-400">&gt;70%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-100 dark:bg-yellow-900/30 border-2 border-yellow-300 dark:border-yellow-700" />
          <span className="text-slate-600 dark:text-slate-400">50-70%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-100 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700" />
          <span className="text-slate-600 dark:text-slate-400">&lt;50%</span>
        </div>
      </div>
    </div>
  );
}
