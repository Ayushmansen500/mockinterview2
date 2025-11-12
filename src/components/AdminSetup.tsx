import { useNavigate } from 'react-router-dom';

export function AdminSetup() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-8 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
          Admin Setup
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Setup wizard for initial configuration
        </p>
        <button
          onClick={() => navigate('/login')}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Go to Login
        </button>
      </div>
    </div>
  );
}
