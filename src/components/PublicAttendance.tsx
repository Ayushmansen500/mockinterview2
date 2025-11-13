import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';

interface AttendanceSession {
  id: string;
  session_name: string;
  session_date: string;
  is_active: boolean;
  expires_at: string;
  batch_name: string;
}

export function PublicAttendance() {
  const { sessionCode } = useParams<{ sessionCode: string }>();
  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [alreadyMarked, setAlreadyMarked] = useState(false);

  useEffect(() => {
    loadSession();
  }, [sessionCode]);

  const loadSession = async () => {
    if (!sessionCode) return;

    setLoading(true);

    const { data, error: fetchError } = await supabase
      .from('attendance_sessions')
      .select('*')
      .eq('session_code', sessionCode)
      .maybeSingle();

    if (fetchError || !data) {
      setError('Invalid or expired attendance link');
      setLoading(false);
      return;
    }

    const expiresAt = new Date(data.expires_at);
    const now = new Date();

    if (!data.is_active || expiresAt < now) {
      setError('This attendance link has expired');
      setSession(data);
      setLoading(false);
      return;
    }

    setSession(data);
    setLoading(false);
  };

  const checkDuplicateSubmission = async (name: string): Promise<boolean> => {
    if (!session) return false;

    const { data } = await supabase
      .from('attendance_records')
      .select('id')
      .eq('session_id', session.id)
      .eq('student_name', name)
      .maybeSingle();

    return !!data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (!session) {
      setError('Session not found');
      setSubmitting(false);
      return;
    }

    const isDuplicate = await checkDuplicateSubmission(studentName.trim());

    if (isDuplicate) {
      setAlreadyMarked(true);
      setError('You have already marked attendance for this session');
      setSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase
      .from('attendance_records')
      .insert({
        session_id: session.id,
        student_name: studentName.trim(),
        student_email: studentEmail.trim() || null,
        status: 'present',
      });

    setSubmitting(false);

    if (insertError) {
      if (insertError.message.includes('duplicate') || insertError.code === '23505') {
        setAlreadyMarked(true);
        setError('You have already marked attendance for this session');
      } else {
        setError(`Failed to mark attendance: ${insertError.message}`);
      }
      return;
    }

    setSuccess(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="text-center">
          <Clock className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Loading attendance session...</p>
        </div>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center">
          <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Link Expired
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Attendance Marked Successfully!
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Your attendance has been recorded for:
          </p>
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
            <p className="font-semibold text-slate-900 dark:text-white">
              {session?.session_name}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              {session && new Date(session.session_date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Mark Your Attendance
          </h1>
          {session && (
            <div className="mt-4 bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
              <p className="font-semibold text-slate-900 dark:text-white">
                {session.session_name}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {new Date(session.session_date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Batch: {session.batch_name}
              </p>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
          {error && !alreadyMarked && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {alreadyMarked ? (
            <div className="text-center py-8">
              <AlertCircle className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Already Marked
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                You have already marked your attendance for this session.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your.email@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Clock className="w-5 h-5 animate-spin" />
                    Marking Attendance...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Mark Present
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
