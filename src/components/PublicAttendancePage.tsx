import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, CheckCircle, XCircle, Clock, UserCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AttendanceSession {
  id: string;
  session_date: string;
  session_code: string;
  is_active: boolean;
  expires_at: string;
}

export function PublicAttendancePage() {
  const { sessionCode } = useParams<{ sessionCode: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [studentName, setStudentName] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [alreadyMarked, setAlreadyMarked] = useState(false);

  useEffect(() => {
    loadSession();
  }, [sessionCode]);

  const loadSession = async () => {
    if (!sessionCode) {
      setMessage({ type: 'error', text: 'Invalid attendance URL' });
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('attendance_sessions')
        .select('*')
        .eq('session_code', sessionCode)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setMessage({ type: 'error', text: 'Attendance session not found' });
      } else if (!data.is_active) {
        setMessage({ type: 'error', text: 'This attendance session is no longer active' });
      } else if (new Date(data.expires_at) < new Date()) {
        setMessage({ type: 'error', text: 'This attendance session has expired' });
      } else {
        setSession(data);
      }
    } catch (error) {
      console.error('Error loading session:', error);
      setMessage({ type: 'error', text: 'Failed to load attendance session' });
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentName.trim()) {
      setMessage({ type: 'error', text: 'Please enter your name' });
      return;
    }

    if (!session) return;

    setSubmitting(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('attendance_records')
        .insert({
          session_id: session.id,
          student_name: studentName.trim(),
          status: 'present',
          marked_at: new Date().toISOString()
        });

      if (error) {
        if (error.code === '23505') {
          setMessage({
            type: 'error',
            text: 'You have already marked your attendance for this session'
          });
          setAlreadyMarked(true);
        } else {
          throw error;
        }
      } else {
        const markedTime = new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });

        setMessage({
          type: 'success',
          text: `✅ Attendance marked successfully for ${studentName} on ${formatDate(session.session_date)} at ${markedTime}`
        });
        setAlreadyMarked(true);
        setStudentName('');
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      setMessage({ type: 'error', text: 'Failed to mark attendance. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session || message?.type === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Session Unavailable</h2>
          <p className="text-gray-600 mb-6">{message?.text}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserCheck className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mark Attendance</h1>
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(session.session_date)}</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mt-1">
            <Clock className="w-4 h-4" />
            <span>Expires at {formatTime(session.expires_at)}</span>
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <p className="text-sm">{message.text}</p>
          </div>
        )}

        {!alreadyMarked ? (
          <form onSubmit={markAttendance} className="space-y-6">
            <div>
              <label htmlFor="studentName" className="block text-sm font-medium text-gray-700 mb-2">
                Enter Your Name
              </label>
              <input
                type="text"
                id="studentName"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={submitting}
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2">
                Please enter your full name as registered
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting || !studentName.trim()}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Marking...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Mark Present</span>
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-gray-600">
              Your attendance has been recorded. You may close this window.
            </p>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            Having trouble? Contact your administrator
          </p>
        </div>
      </div>
    </div>
  );
}
