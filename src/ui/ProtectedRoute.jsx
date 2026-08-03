import React, { useEffect, useState } from 'react';
import useGameStore from '../store/gameStore';
import { getSession } from '../services/api';

export default function ProtectedRoute({ children, allowedRoles }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  
  const setRole = useGameStore((s) => s.setRole);
  const setStudent = useGameStore((s) => s.setStudent);
  const setScreen = useGameStore((s) => s.setScreen);

  useEffect(() => {
    let isMounted = true;
    async function checkAuth() {
      try {
        // 1. First check if we are already authenticated in the local store
        const currentRole = useGameStore.getState().role;
        if (currentRole && allowedRoles.includes(currentRole)) {
          if (isMounted) {
            setAuthorized(true);
            setLoading(false);
          }
          return;
        }

        // 2. Fall back to Supabase session (e.g. on page refresh)
        const user = await getSession();
        if (isMounted) {
          if (user && allowedRoles.includes(user.role)) {
            setRole(user.role);
            setStudent(user.full_name, user.id);
            setAuthorized(true);
          } else {
            setAuthorized(false);
            setScreen('start', '/login');
          }
        }
      } catch (err) {
        if (isMounted) {
          setAuthorized(false);
          setScreen('start', '/login');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    checkAuth();
    return () => { isMounted = false; };
  }, [allowedRoles, setRole, setStudent, setScreen]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#09090b', color: '#fff' }}>
        <div className="btn-spinner" style={{ width: '40px', height: '40px', borderWidth: '4px' }} />
      </div>
    );
  }

  return authorized ? children : null;
}
