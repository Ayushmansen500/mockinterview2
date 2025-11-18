import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, ChevronDown, AlertCircle } from 'lucide-react';

interface ActivenessRecord {
  id: string;
  student_name: string;
  activeness_score: number;
  duration_minutes: number | null;
  created_at: string;
}

export function ActivenessBoardSelector() {
  const { admin } = useAuth();
  const [scores, setScores] = useState<ActivenessRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState({
    student_name: '',
    activeness_score: 50,
    duration_minutes: '',
  });

  useEffect(() => {
    fetchScores();
  }, []);

  const fetchScores = async () => {
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

  const handleAddScore = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    try {
      if (!formData.student_name.trim()) {
        throw new Error('Student name is required');
      }
      if (formData.activeness_score < 0 || formData.activeness_score > 100) {
        throw new Error('Score must be between 0 and 100');
      }

      const { error: insertError } = await supabase
        .from('zoom_activeness_dashboard')
        .insert({
          student_name: formData.student_name.trim(),
          activeness_score: formData.activeness_score,
          duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
          admin_id: admin?.id,
        });

      if (insertError) throw insertError;

      setFormData({ student_name: '', activeness_score: 50, duration_minutes: '' });
      setShowForm(false);
      fetchScores();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error adding score');
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
      fetchScores();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-600 dark:text-slate-400">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Zoom Activeness Board
          </h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Score
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleAddScore} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 mb-4">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Student Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.student_name}
                  onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Activeness Score (0-100) *
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={formData.activeness_score}
                    onChange={(e) => setFormData({ ...formData, activeness_score: parseInt(e.target.value) })}
                    className="flex-1 h-2 bg-slate-300 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="w-12 text-center font-bold text-slate-900 dark:text-white">
                    {formData.activeness_score}%
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Optional"
                />
              </div>

              {formError && (
                <div className="flex gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-900 dark:text-red-100">{formError}</p>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                >
                  Save Score
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {error && (
        <div className="flex gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
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
  );
}
