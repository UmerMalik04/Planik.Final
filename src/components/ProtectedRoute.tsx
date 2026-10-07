import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import PageShell from '@/components/PageShell';

interface ProtectedRouteProps {
  children: ReactNode;
}

/** True when this device has a stored Supabase session from a previous launch. */
function hasStoredSession(): boolean {
  try {
    return Object.keys(localStorage).some(
      (key) => key.startsWith('sb-') && key.endsWith('-auth-token')
    );
  } catch {
    return false;
  }
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    // A returning user is almost certainly still signed in, so render the
    // screen straight away instead of holding a blank frame while Supabase
    // re-validates the stored token in the background. Users with no stored
    // session get the layout shell (never a spinner) for the few ms it takes.
    return hasStoredSession() ? <>{children}</> : <PageShell />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
