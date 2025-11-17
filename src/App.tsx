import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LoginPage } from './components/LoginPage';
import { SignupPage } from './components/SignupPage';
import { AdminPanel } from './components/AdminPanel';
import { PublicLeaderboard } from './components/PublicLeaderboard';
import { PublicActivenessBoard } from './components/PublicActivenessBoard';
import { PublicAttendance } from './components/PublicAttendance';
import { PublicBatchAttendance } from './components/PublicBatchAttendance';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-slate-600 dark:text-slate-400">Loading...</div>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            
            {/* Public Leaderboard & Dashboard Routes */}
            <Route path="/public/:publicId" element={<PublicLeaderboard />} />
            <Route path="/activeness/:publicId" element={<PublicActivenessBoard />} />
            <Route path="/attend/:sessionCode" element={<PublicAttendance />} />
            <Route path="/attendance/:publicId" element={<PublicBatchAttendance />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AdminPanel />
                </ProtectedRoute>
              }
            />

            {/* Root Route */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AdminPanel />
                </ProtectedRoute>
              }
            />

            {/* 404 - Not Found */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
