import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Calendar, Plus, X, Trash2, Copy, Check } from 'lucide-react';

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
  const [showAddModal, setShowAddModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    session_name: '',
    batch_name: '',
    session_code: '',
  });

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('attendance_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setFormData({ ...formData, session_code: code });
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!formData.session_name.trim()) {
        alert('Please enter session name');
        return;
      }
      if (!formData.session_code.trim()) {
        alert('Please enter session code');
        return;
      }

      const { error } = await supabase
        .from('attendance_sessions')
        .insert({
          session_name: formData.session_name.trim(),
          session_code: formData.session_code.trim(),
          batch_name: formData.batch_name.trim() || null,
          admin_id: admin?.id,
        });

      if (error) throw error;

      setFormData({ session_name: '', batch_name: '', session_code: '' });
      setShowAddModal(false);
      fetchSessions();
    } catch (err) {
      alert('Error creating session');
      console.error('Error:', err);
    }
  };

  const handleDeleteSession = async (id: string) => {
    if (!confirm('Delete this session?')) return;

    try {
      const { error } = await supabase
        .from('attendance_sessions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchSessions();
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading) {
    return <div className="text-center py-12 text-slate-600 dark:text-slate-400">Loading...</div>;
  }

  if (sessions.length === 0 && !showAddModal) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center">
        <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
          No Sessions Found
        </h3>
        <p className="text-slate-600 dark:text-slate-400 mb-4">
          Create your first attendance session to get started.
        </p>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors inline-flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create Session
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Attendance Sessions
        </h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Session
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {sessions.map(session => (
          <div
            key={session.id}
            className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between hover:shadow-md transition-shadow"
          >
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
                {new Date(session.created_at).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
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
              <button
                onClick={() => handleDeleteSession(session.id)}
                className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                Create New Session
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Session Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.session_name}
                  onChange={(e) => setFormData({ ...formData, session_name: e.target.value })}
                  placeholder="e.g., Round 1"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Batch Name
                </label>
                <input
                  type="text"
                  value={formData.batch_name}
                  onChange={(e) => setFormData({ ...formData, batch_name: e.target.value })}
                  placeholder="e.g., Batch A"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Session Code <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.session_code}
                    onChange={(e) => setFormData({ ...formData, session_code: e.target.value })}
                    placeholder="Code"
                    className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
