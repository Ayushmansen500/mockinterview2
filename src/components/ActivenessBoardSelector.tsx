import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, ChevronDown, AlertCircle } from 'lucide-react';

interface ActivenessScore {
  id: string;
  student_name: string;
  activeness_score: number;
  duration_minutes: number | null;
  created_at: string;
}

export function ActivenessBoardSelector() {
  const { admin } = useAuth();
  const [scores, setScores] = useState<ActivenessScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadScores();
  }, []);

  const loadScores = async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error: fetchError } = await supabase
        .from('zoom_activeness_dashboard')
        .select('*')
        .order('activeness_score', { ascending: false });

      if (fetchError) throw fetchError;
      setScores(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading scores');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteScore = async (id: string) => {
    if (!confirm('Delete this score?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('zoom_activeness_dashboard')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      loadScores();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-600 dark:text-slate-400">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Zoom Activeness Board
          </h2>
        </div>

        {error && (
          <div className="flex gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-4">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-900 dark:text-red-100">{error}</p>
          </div>
        )}

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          {scores.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-slate-600 dark:text-slate-400">No activeness scores yet.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Rank</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900 dark:text-white">Student</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-slate-900 dark:text-white">Score</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-slate-900 dark:text-white">Duration</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-slate-900 dark:text-white">Date</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-slate-900 dark:text-white">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {scores.map((score, idx) => (
                  <tr key={score.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-white">#{idx + 1}</td>
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-white font-medium">{score.student_name}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        score.activeness_score >= 80 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                        score.activeness_score >= 60 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                        'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                      }`}>
                        {score.activeness_score}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-slate-600 dark:text-slate-400">
                      {score.duration_minutes ? `${score.duration_minutes}m` : '-'}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-slate-600 dark:text-slate-400">
                      {new Date(score.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleDeleteScore(score.id)}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
