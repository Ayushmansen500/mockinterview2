import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, Users, UserCheck, TrendingUp, Clock, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AttendanceSession {
  id: string;
  session_date: string;
  session_name: string;
  session_code: string;
  is_active: boolean;
  created_at: string;
}

interface AttendanceRecord {
  id: string;
  student_name: string;
  marked_at: string;
  status: string;
}

export function PublicAttendanceView() {
  const { publicId } = useParams<{ publicId: string }>();
  const [session, setSession] = useState<AttendanceSession | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAttendance();
  }, [publicId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh && session) {
      interval = setInterval(() => {
        loadAttendance(true);
      }, 30000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, session]);

  const loadAttendance = async (isRefresh = false) => {
    if (!publicId) {
      setError('Invalid attendance link');
      setLoading(false);
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from('attendance_sessions')
        .select('*')
        .eq('public_id', publicId)
        .maybeSingle();

      if (sessionError) throw sessionError;

      if (!sessionData) {
        setError('Attendance session not found');
        setLoading(false);
        return;
      }

      if (!sessionData.is_active) {
        setError('This attendance session is no longer active');
      }

      setSession(sessionData);

      const { data: recordsData, error: recordsError } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('session_id', sessionData.id)
        .order('marked_at', { ascending: true });

      if (recordsError) throw recordsError;

      setRecords(recordsData || []);
    } catch (err) {
      console.error('Error loading attendance:', err);
      setError('Failed to load attendance data');
    } finally {
      setLoading(false);
      setRefreshing(false);
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  const totalPresent = records.length;
  const attendancePercentage = totalPresent > 0 ? 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{session?.session_name}</h1>
                <div className="flex items-center gap-2 text-blue-100">
                  <Calendar className="w-4 h-4" />
                  <span>{session && formatDate(session.session_date)}</span>
                </div>
              </div>
              <div className="text-right">
                {error ? (
                  <span className="px-3 py-1 bg-red-500 text-white text-sm font-medium rounded-full">
                    Inactive
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-green-500 text-white text-sm font-medium rounded-full flex items-center gap-1">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    Live
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Batch Attendance Overview</h2>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  Auto-refresh
                </label>
                <button
                  onClick={() => loadAttendance(true)}
                  disabled={refreshing}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium mb-1">Total Present</p>
                    <p className="text-4xl font-bold text-blue-900">{totalPresent}</p>
                  </div>
                  <div className="w-14 h-14 bg-blue-200 rounded-full flex items-center justify-center">
                    <UserCheck className="w-7 h-7 text-blue-700" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 font-medium mb-1">Attendance Rate</p>
                    <p className="text-4xl font-bold text-green-900">{attendancePercentage.toFixed(0)}%</p>
                  </div>
                  <div className="w-14 h-14 bg-green-200 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-7 h-7 text-green-700" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 font-medium mb-1">Last Updated</p>
                    <p className="text-lg font-bold text-purple-900">
                      {records.length > 0 ? formatTime(records[records.length - 1].marked_at) : 'N/A'}
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-purple-200 rounded-full flex items-center justify-center">
                    <Clock className="w-7 h-7 text-purple-700" />
                  </div>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Present Students ({totalPresent})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {records.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center">
                          <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                          <p className="text-gray-500">No students have marked attendance yet</p>
                          <p className="text-gray-400 text-sm mt-1">This page updates automatically every 30 seconds</p>
                        </td>
                      </tr>
                    ) : (
                      records.map((record, index) => (
                        <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mr-3 shadow-sm">
                                <span className="text-sm font-bold text-white">
                                  {record.student_name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="text-sm font-medium text-gray-900">
                                {record.student_name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-3 py-1 inline-flex items-center gap-1 text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              <UserCheck className="w-3 h-3" />
                              Present
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatTime(record.marked_at)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Public Attendance View</h4>
                  <p className="text-sm text-blue-700">
                    This page shows real-time attendance for {session?.session_name}.
                    Students can see who's present in the class. Data auto-refreshes every 30 seconds when enabled.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
