import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { LeaderboardTable } from './LeaderboardTable';
import { StudentRoundsModal } from './StudentRoundsModal';
import { InterviewRoundForm } from './InterviewRoundForm';
import { LogOut, Plus, Download, Share2, Moon, Sun } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { calculateBatchMetrics, getStudentMetricsArray } from '../lib/scoring';
import type { StudentMetrics, BatchMetrics } from '../lib/scoring';

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
  const { admin, signOut } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [scores, setScores] = useState<ScoreRecord[]>([]);
  const [studentMetrics, setStudentMetrics] = useState<StudentMetrics[]>([]);
  const [batchMetrics, setBatchMetrics] = useState<BatchMetrics>({
    totalStudents: 0,
    totalInterviews: 0,
    averageScore: 0,
    highestIndividualScore: 0,
  });
  const [selectedStudent, setSelectedStudent] = useState<StudentMetrics | null>(null);
  const [showRoundForm, setShowRoundForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadScores();
  }, []);

  useEffect(() => {
    if (scores.length > 0) {
      const metrics = getStudentMetricsArray(convertToRounds(scores));
      setStudentMetrics(metrics);
      setBatchMetrics(calculateBatchMetrics(convertToRounds(scores)));
    } else {
      setStudentMetrics([]);
      setBatchMetrics({
        totalStudents: 0,
        totalInterviews: 0,
        averageScore: 0,
        highestIndividualScore: 0,
      });
    }
  }, [scores]);

  const loadScores = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('interview_leaderboard')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setScores(data || []);
    } catch (err) {
      console.error('Error loading scores:', err);
    } finally {
      setLoading(false);
    }
  };

  const convertToRounds = (scores: ScoreRecord[]) => {
    return scores.map(s => ({
      id: s.id,
      student_name: s.student_name,
      round_number: s.round_number,
      score: s.interview_score,
      interview_date: s.created_at,
      interviewer_name: '',
      strengths: '',
      weaknesses: '',
      feedback: s.feedback || '',
      notes: '',
      leaderboard_id: '',
      created_at: s.created_at,
      updated_at: s.created_at,
    }));
  };

  const handleSaveRound = async (roundData: any) => {
    try {
      const { error } = await supabase
        .from('interview_leaderboard')
        .insert({
          student_name: roundData.student_name,
          interview_score: roundData.score,
          round_number: roundData.round_number,
          feedback: roundData.feedback || null,
          admin_id: admin?.id,
        });

      if (error) throw error;

      setShowRoundForm(false);
      loadScores();
    } catch (err) {
      console.error('Error saving round:', err);
      alert('Failed to save interview round');
    }
  };

  const handleDeleteRound = async (roundId: string) => {
    try {
      const { error } = await supabase
        .from('interview_leaderboard')
        .delete()
        .eq('id', roundId);

      if (error) throw error;
      loadScores();
    } catch (err) {
      console.error('Error deleting round:', err);
    }
  };

  const copyPublicLink = () => {
    const url = `${window.location.origin}/public/leaderboard`;
    navigator.clipboard.writeText(url);
    alert('Public link copied!');
  };

  const handleExport = () => {
    const dataStr = JSON.stringify({ scores }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', 'interview_scores.json');
    link.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-slate-600 dark:text-slate-400">Loading...</div>
      </div>
    );
  }

  const selectedStudentRounds = selectedStudent
    ? scores.filter(r => r.student_name === selectedStudent.name)
    : [];

  const content = (
    <div>
      {!hideHeader && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
            Interview Leaderboard
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Manage student interview rounds and scores
          </p>
        </div>
      )}

      {!hideHeader && (
        <div className="mb-6 flex flex-wrap gap-3">
          <button
            onClick={() => setShowRoundForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Record Interview
          </button>
          <button
            onClick={copyPublicLink}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Share2 className="w-5 h-5" />
            Copy Public Link
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors"
          >
            <Download className="w-5 h-5" />
            Export
          </button>
        </div>
      )}

      <AnalyticsDashboard metrics={batchMetrics} />

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">
          Student Leaderboard
        </h2>
        <LeaderboardTable
          students={studentMetrics}
          onStudentClick={setSelectedStudent}
        />
      </div>

      {showRoundForm && (
        <InterviewRoundForm
          leaderboardId="default"
          onSave={handleSaveRound}
          onClose={() => setShowRoundForm(false)}
        />
      )}

      {selectedStudent && (
        <StudentRoundsModal
          student={selectedStudent}
          rounds={selectedStudentRounds}
          onClose={() => setSelectedStudent(null)}
          onDeleteRound={handleDeleteRound}
        />
      )}
    </div>
  );

  if (hideHeader) {
    return content;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Interview Leaderboard
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Welcome, {admin?.name}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                title={isDark ? 'Light mode' : 'Dark mode'}
              >
                {isDark ? (
                  <Sun className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                ) : (
                  <Moon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                )}
              </button>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {content}
      </main>
    </div>
  );
}
