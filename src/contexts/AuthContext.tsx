/**
 * AuthContext — single source of truth for "who is the current user?".
 *
 * Components anywhere in the tree call `useAuth()` to read:
 *   - user           → the Supabase user object (or null when signed out)
 *   - loading        → true until we've checked the initial session
 *   - isAuthenticated → convenience boolean
 *
 * The provider does two things on mount:
 *   1. Asks Supabase for the persisted session (if any) and stores it.
 *   2. Subscribes to auth state changes so sign-in / sign-out updates the
 *      whole app live — no manual refresh needed.
 *
 * It also handles two redirect rules:
 *   - If the user is signed OUT and not already on a public page, bounce
 *     them to /auth.
 *   - On SIGNED_OUT events (e.g. token expired, manual sign-out), bounce
 *     to /auth too.
 *
 * Guest login: a user with `is_anonymous: true` is a valid Supabase user
 * here — guest mode is just a regular anonymous session, not a separate path.
 */
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface AuthUser {
  id: string;
  email?: string;
  // Set by Supabase when the user signed in via "anonymous" (Guest Login).
  is_anonymous?: boolean;
  user_metadata: {
    name?: string;
    full_name?: string;
    display_name?: string;
    gender?: string;
    date_of_birth?: string;
    avatar_url?: string;
    picture?: string;
  };
  identities?: { identity_data?: Record<string, unknown> | null }[];
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
}

// Default value used when a component reads context outside the provider —
// shouldn't happen in practice, but TypeScript requires a default.
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
});

/** Hook for consumers: `const { user, isAuthenticated } = useAuth();` */
export function useAuth() {
  return useContext(AuthContext);
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // ---- 1. Read the persisted session on first mount -------------------
    // Supabase stored the JWT in localStorage last time the user signed in;
    // `getSession()` decodes it and tells us who they are without a network
    // round-trip (token refresh happens lazily if needed).
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);

        // Bounce unauthenticated users to /auth, unless they're already on a
        // public screen (/auth/*, /demo) — otherwise we'd cause a redirect loop.
        if (!session?.user && !location.pathname.startsWith('/auth') && location.pathname !== '/demo') {
          navigate('/auth', { replace: true });
        }
      } catch (error) {
        console.error('Error getting session:', error);
      } finally {
        // Always clear the loading flag, even on error — otherwise the app
        // would render its "checking session…" UI forever.
        setLoading(false);
      }
    };

    getInitialSession();

    // ---- 2. Subscribe to future auth state changes ----------------------
    // Fires on SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, USER_UPDATED, etc.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);

        if (event === 'SIGNED_OUT') {
          navigate('/auth', { replace: true });
        }
      }
    );

    // Unsubscribe on unmount so we don't leak listeners during hot reload.
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps — this effect must only run once for the app's lifetime.

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}
