import { useParams } from 'react-router-dom';

export function PublicLeaderboard() {
  const { publicId } = useParams();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">
          Interview Leaderboard
        </h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-slate-600">
            Public leaderboard view for ID: {publicId}
          </p>
        </div>
      </div>
    </div>
  );
}
