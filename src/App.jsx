import React, { useEffect } from 'react';
import useGameStore from './store/gameStore';
import LandingPage from './ui/LandingPage';
import StartScreen from './ui/StartScreen';
import LabScene from './scene/LabScene';
import Dashboard from './ui/Dashboard';
import FacultyDashboard from './ui/FacultyDashboard';
import ProtectedRoute from './ui/ProtectedRoute';

const routeToScreenMap = {
  '/': 'landing',
  '/login': 'start',
  '/signup': 'start',
  '/student-dashboard': 'dashboard',
  '/dashboard': 'dashboard',
  '/teacher-dashboard': 'faculty-dashboard',
  '/faculty-dashboard': 'faculty-dashboard',
  '/lab': 'lab',
  '/lab/chemistry': 'lab',
  '/lab/physics': 'lab',
};

export default function App() {
  const screen = useGameStore((s) => s.screen);
  const setScreen = useGameStore((s) => s.setScreen);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      const matchedScreen = routeToScreenMap[path] || 'landing';
      setScreen(matchedScreen, window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [setScreen]);

  return (
    <>
      {screen === 'landing' && <LandingPage />}
      {screen === 'start' && <StartScreen />}
      {screen === 'lab' && (
        <ProtectedRoute allowedRoles={['student', 'faculty']}>
          <LabScene />
        </ProtectedRoute>
      )}
      {screen === 'dashboard' && (
        <ProtectedRoute allowedRoles={['student']}>
          <Dashboard />
        </ProtectedRoute>
      )}
      {screen === 'faculty-dashboard' && (
        <ProtectedRoute allowedRoles={['faculty']}>
          <FacultyDashboard />
        </ProtectedRoute>
      )}
    </>
  );
}
