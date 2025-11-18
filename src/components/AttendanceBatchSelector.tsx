import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, AlertCircle, CheckCircle, Loader, Copy, Check } from 'lucide-react';

interface SessionRecord {
  id: string;
  session_name: string;
  session_code: string;
  batch_name: string | null;
  created_at: string;
}

export function AttendanceBatchSelector() {
  const { admin } = useAuth();
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [sessionName, setSessionName] = useState('');
  const [sessionCode, setSessionCode] = useState('');
  const [batchName, setBatchName] = useState('');

  useEffect(() => {
    fetchSessions();
  }, [admin?.id]);

  const fetchSessions = async () => {
    setLoading(true);
    setError('');

    try {
      const { data, error: fetchError } = await supabase
        .from('attendance_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setSessions(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading sessions');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setSessionCode(code);
  };

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setFormLoading(true);

    try {
      if (!sessionName.trim()) {
        throw new Error('Session name is required');
      }
      if (!sessionCode.trim()) {
        throw new Error('Session code is required');
      }

      const { error: insertError } = await supabase
        .from('attendance_sessions')
        .insert({
          session_name: sessionName.trim(),
          session_code: sessionCode.trim(),
          batch_name: batchName.trim() || null,
          admin_id: admin?.id,
        });

      if (insertError) throw insertError;

      setFormSuccess(`Session "${sessionName}" created with code: ${sessionCode}`);
      setSessionName('');
      setSessionCode('');
      setBatchName('');
      
      fetchSessions();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error creating session');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Attendance Tracker
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Create sessions and track student attendance
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
              Create Attendance Session
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Session Name *
                </label>
                <input
                  type="text"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="e.g., Mock Interview Round 1"
                  required
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Batch Name
                </label>
                <input
                  type="text"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                  placeholder="e.g., Batch A"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Session Code *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={sessionCode}
                    onChange={(e) => setSessionCode(e.target.value)}
                    placeholder="Auto or manual code"
                    required
                    className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={generateCode}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg transition-colors font-semibold"
                  >
                    Generate
                  </button>
                </div>
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
                className="w-full flex items-center justify-center gap-2 px-6 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white font-medium rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5" />
                {formLoading ? 'Creating...' : 'Create Session'}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-6 h-6 animate-spin text-orange-600" />
            </div>
          ) : error ? (
            <div className="flex gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-900 dark:text-red-100">{error}</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center">
              <p className="text-slate-600 dark:text-slate-400">
                No sessions yet. Create one using the form.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
                Active Sessions
              </h2>
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">
                          {session.session_name}
                        </h3>
                        {session.batch_name && (
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Batch: {session.batch_name}
                          </p>
                        )}
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                          Created: {new Date(session.created_at).toLocaleString()}
                        </p>
                      </div>
                      <button
                        onClick={() => copyToClipboard(session.session_code, session.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-100 dark:bg-orange-900/30 hover:bg-orange-200 dark:hover:bg-orange-900/50 text-orange-700 dark:text-orange-300 rounded-lg transition-colors font-mono font-semibold text-sm"
                      >
                        {session.session_code}
                        {copiedId === session.id ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
