import type { Database } from './database.types';

type InterviewRound = Database['public']['Tables']['interview_rounds']['Row'];

export interface StudentMetrics {
  name: string;
  highestScore: number;
  totalScore: number;
  averageScore: number;
  interviewsGiven: number;
  lastInterviewDate: string;
}

export interface BatchMetrics {
  totalStudents: number;
  totalInterviews: number;
  averageScore: number;
  highestIndividualScore: number;
}

export function calculateStudentMetrics(rounds: InterviewRound[]): StudentMetrics | null {
  if (rounds.length === 0) return null;

  const scores = rounds.map(r => r.score);
  const highestScore = Math.max(...scores);
  const totalScore = scores.reduce((sum, score) => sum + score, 0);
  const averageScore = Number((totalScore / scores.length).toFixed(2));
  const lastDate = rounds.reduce((latest, round) => {
    return new Date(round.interview_date) > new Date(latest) ? round.interview_date : latest;
  }, rounds[0].interview_date);

  return {
    name: rounds[0].student_name,
    highestScore,
    totalScore,
    averageScore,
    interviewsGiven: rounds.length,
    lastInterviewDate: lastDate,
  };
}

export function calculateBatchMetrics(allRounds: InterviewRound[]): BatchMetrics {
  if (allRounds.length === 0) {
    return {
      totalStudents: 0,
      totalInterviews: 0,
      averageScore: 0,
      highestIndividualScore: 0,
    };
  }

  const uniqueStudents = new Set(allRounds.map(r => r.student_name));
  const scores = allRounds.map(r => r.score);
  const totalScore = scores.reduce((sum, score) => sum + score, 0);

  return {
    totalStudents: uniqueStudents.size,
    totalInterviews: allRounds.length,
    averageScore: Number((totalScore / allRounds.length).toFixed(2)),
    highestIndividualScore: Math.max(...scores),
  };
}

export function groupRoundsByStudent(rounds: InterviewRound[]): Map<string, InterviewRound[]> {
  const grouped = new Map<string, InterviewRound[]>();

  rounds.forEach(round => {
    if (!grouped.has(round.student_name)) {
      grouped.set(round.student_name, []);
    }
    grouped.get(round.student_name)!.push(round);
  });

  return grouped;
}

export function getStudentMetricsArray(rounds: InterviewRound[]): StudentMetrics[] {
  const grouped = groupRoundsByStudent(rounds);
  const metrics: StudentMetrics[] = [];

  grouped.forEach((studentRounds, _studentName) => {
    const metric = calculateStudentMetrics(studentRounds);
    if (metric) metrics.push(metric);
  });

  return metrics;
}
