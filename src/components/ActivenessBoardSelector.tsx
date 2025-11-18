import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface ActivenessRecord {
  id: string;
  student_name: string;
  activeness_score: number;
  duration_minutes: number | null;
  zoom_session_id: string | null;
  created_at: string;
}

export function ActivenessBoardSelector() {
  const { admin } = useAuth();
  const [scores, setScores] = useState<ActivenessRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // Form state
  const [studentName, setStudentName] = useState('');
  const [activenessScore, setActivenessScore] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [zoomSessionId, setZoomSessionId] = useState('');

  useEffect(() => {
    fetchScores();
  }, [admin?.id]);

  const fetchScores = async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error: fetchError } = await supabase
        .from('zoom_activeness_dashboard')
        .select('*')
        .order('activeness_score', { ascending: false })
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setFormLoading(true);

    try {
      if (!studentName.trim()) {
        throw new Error('Student name is required');
      }
      if (!activenessScore || parseFloat(activenessScore) < 0 || parseFloat(activenessScore) > 100) {
        throw new Error('Score must be between 0 and 100');
      }

      const { error: insertError } = await supabase
        .from('zoom_activeness_dashboard')
        .insert({
          student_name: studentName.trim(),
          activeness_score: parseFloat(activenessScore),
          duration_minutes: durationMinutes ? parseInt(durationMinutes) : null,
          zoom_session_id: zoomSessionId.trim() || null,
          admin_id: admin?.id,
        });

      if (insertError) throw insertError;

      setFormSuccess(`Activeness score added for ${studentName}!`);
      setStudentName('');
      setActivenessScore('');
      setDurationMinutes('');
      setZoomSessionId('');
      
      fetchScores();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error adding score');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Zoom Activeness Board
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Track student activeness during Zoom sessions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
              Add Activeness Score
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Student Name *
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Enter student name"
                  required
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Activeness Score (0-100) *
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={activenessScore}
                  onChange={(e) => setActivenessScore(e.target.value)}
                  placeholder="Enter score"
                  required
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  min="0"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(e.target.value)}
                  placeholder="e.g., 60"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Zoom Session ID (Optional)
                </label>
                <input
                  type="text"
                  value={zoomSessionId}
                  onChange={(e) => setZoomSessionId(e.target.value)}
                  placeholder="e.g., 123456789"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {formError && (
                <div className="flex gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-sm text-red-900 dark:text-red-100">{formError}</p>
                </div>
              )}

              {formSuccess && (
                <div className="flex gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <p className="text-sm text-green-900 dark:text-green-100">{formSuccess}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={formLoading}
                className="w-full flex items-center justify-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                {formLoading ? 'Adding...' : 'Add Score'}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-6 h-6 animate-spin text-green-600" />
            </div>
          ) : error ? (
            <div className="flex gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-900 dark:text-red-100">{error}</p>
            </div>
          ) : scores.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center">
              <p className="text-slate-600 dark:text-slate-400">
                No activeness scores yet. Add one using the form.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
                Activeness Scores
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Rank</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Student</th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-900 dark:text-white">Score</th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-900 dark:text-white">Duration</th>
                      <th className="px-4 py-3 text-center font-semibold text-slate-900 dark:text-white">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scores.map((record, idx) => (
                      <tr key={record.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">#{idx + 1}</td>
                        <td className="px-4 py-3 text-slate-900 dark:text-white font-medium">
                          {record.student_name}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-3 py-1 rounded-full font-semibold text-xs ${
                            record.activeness_score >= 80 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                            record.activeness_score >= 60 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                            'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                          }`}>
                            {record.activeness_score}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">
                          {record.duration_minutes ? `${record.duration_minutes} min` : '-'}
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
