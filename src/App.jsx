import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';

// Lazy load all pages for code splitting
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Accounts = lazy(() => import('./pages/Accounts'));
const Automation = lazy(() => import('./pages/Automation'));
const Reports = lazy(() => import('./pages/Reports'));
const Logs = lazy(() => import('./pages/Logs'));
const ErrorScreenshots = lazy(() => import('./pages/ErrorScreenshots'));
const Settings = lazy(() => import('./pages/Settings'));

function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<LoadingSpinner fullScreen />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route 
              path="dashboard" 
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <Dashboard />
                </Suspense>
              } 
            />
            <Route 
              path="accounts" 
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <Accounts />
                </Suspense>
              } 
            />
            <Route 
              path="automation" 
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <Automation />
                </Suspense>
              } 
            />
            <Route 
              path="reports" 
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <Reports />
                </Suspense>
              } 
            />
            <Route 
              path="logs" 
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <Logs />
                </Suspense>
              } 
            />
            <Route 
              path="error-screenshots" 
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <ErrorScreenshots />
                </Suspense>
              } 
            />
            <Route 
              path="settings" 
              element={
                <Suspense fallback={<LoadingSpinner />}>
                  <Settings />
                </Suspense>
              } 
            />
          </Route>
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}

export default App;

