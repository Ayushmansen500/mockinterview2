import { InterviewScoreForm } from './InterviewRoundForm';
import { LeaderboardTable } from './LeaderboardTable';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Loader, AlertCircle } from 'lucide-react';

interface ScoreRecord {
  id: string;
  student_name: string;
  interview_score: number;
  round_number: number;
  feedback: string | null;
  created_at: string;
}

interface AdminDashboardProps {
  hideHeader?: boolean;
}

export function AdminDashboard({ hideHeader = false }: AdminDashboardProps) {
  const { admin } = useAuth();
  const [scores, setScores] = useState<ScoreRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchScores();
  }, [admin?.id]);

  const fetchScores = async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error: fetchError } = await supabase
        .from('interview_leaderboard')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setScores(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading scores');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {!hideHeader && (
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Interview Leaderboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Manage and track student interview scores
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <InterviewScoreForm onScoreAdded={() => fetchScores()} />
        </div>
        <div className="lg:col-span-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : error ? (
            <div className="flex gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-900 dark:text-red-100">{error}</p>
            </div>
          ) : scores.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center">
              <p className="text-slate-600 dark:text-slate-400">
                No interview scores yet. Add one using the form.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
                Interview Scores
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Student</th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-900 dark:text-white">Score</th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-900 dark:text-white">Round</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Feedback</th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-900 dark:text-white">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scores.map((record) => (
                      <tr key={record.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="px-4 py-3 text-slate-900 dark:text-white font-medium">
                          {record.student_name}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-3 py-1 rounded-full font-semibold text-xs ${
                            record.interview_score >= 8 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                            record.interview_score >= 6 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                            'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                          }`}>
                            {record.interview_score}/10
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">
                          Round {record.round_number}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-xs">
                          {record.feedback || '-'}
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400 text-xs">
                          {new Date(record.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
