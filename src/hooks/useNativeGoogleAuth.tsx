/**
 * useNativeGoogleAuth — bridge between the native wrapper and Supabase for
 * "Sign in with Google". Mirrors useNativeAppleAuth.
 *
 * The native wrapper dispatches `googleAuthSuccess` with a credential detail
 * that contains at minimum an `idToken`. It may also include `name`,
 * `givenName`, `familyName`, `email`, and `imageUrl` from the Google account.
 *
 * Unlike Apple, Google returns profile info on every sign-in, but we still
 * persist locally so a cold app start can restore the session offline.
 */
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isGenericDisplayName } from '@/lib/profileDisplay';

interface GoogleCredential {
  idToken?: string;
  authentication?: { idToken?: string };
  email?: string | null;
  name?: string | null;
  displayName?: string | null;
  givenName?: string | null;
  familyName?: string | null;
  imageUrl?: string | null;
  [key: string]: unknown;
}

function extractIdToken(cred: GoogleCredential | null | undefined): string | undefined {
  if (!cred) return undefined;
  return cred.idToken ?? cred.authentication?.idToken;
}

function buildDisplayName(cred: GoogleCredential): string | undefined {
  const name = cred.name ?? cred.displayName ?? undefined;
  if (name && name.trim()) return name.trim();
  const combined = [cred.givenName, cred.familyName].filter(Boolean).join(' ').trim();
  return combined || undefined;
}

async function exchangeIdentityToken(credential: GoogleCredential) {
  const idToken = extractIdToken(credential);
  if (!idToken) return false;

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: idToken,
  });
  if (error) {
    console.error('Supabase Google Sign-In Error:', error.message);
    return false;
  }
  if (!data?.session) return false;

  try {
    const name = buildDisplayName(credential);
    const email = credential.email ?? undefined;
    const avatar = credential.imageUrl ?? undefined;
    const existing = data.user?.user_metadata ?? {};
    const patch: Record<string, unknown> = {};
    if (name) patch.name = isGenericDisplayName(String(existing.name || existing.full_name || '')) ? name : existing.name || existing.full_name;
    if (avatar) patch.avatar_url = existing.avatar_url || existing.picture || avatar;
    if (Object.keys(patch).length > 0 || (email && !data.user?.email)) {
      await supabase.auth.updateUser({
        data: { ...patch },
        ...(email && !data.user?.email ? { email } : {}),
      });
    }

    if (name || avatar) {
      const profilePatch: { user_id: string; display_name?: string; avatar_url?: string } = { user_id: data.user.id };
      if (name) profilePatch.display_name = name;
      if (avatar) profilePatch.avatar_url = avatar;
      await supabase.from('user_profiles').upsert(profilePatch, { onConflict: 'user_id' });
    }
  } catch (err) {
    console.warn('Could not persist Google profile info:', err);
  }

  window.location.href = '/';
  return true;
}

function readStoredCredential(): GoogleCredential | null {
  try {
    const raw = localStorage.getItem('google_credential');
    if (raw) {
      const parsed = JSON.parse(raw) as GoogleCredential;
      if (extractIdToken(parsed)) return parsed;
    }
  } catch {
    /* ignore malformed storage */
  }
  return null;
}

function persistCredential(cred: GoogleCredential) {
  try {
    const prev = readStoredCredential() ?? {};
    const merged: GoogleCredential = {
      ...prev,
      ...cred,
      name: cred.name ?? prev.name ?? null,
      email: cred.email ?? prev.email ?? null,
      givenName: cred.givenName ?? prev.givenName ?? null,
      familyName: cred.familyName ?? prev.familyName ?? null,
      imageUrl: cred.imageUrl ?? prev.imageUrl ?? null,
    };
    localStorage.setItem('google_credential', JSON.stringify(merged));
  } catch {
    /* ignore quota / serialization errors */
  }
}

export function useNativeGoogleAuth() {
  useEffect(() => {
    if (typeof window === 'undefined' || !window.isNativeApp) return;

    const handleGoogleAuthSuccess = async (event: Event) => {
      const credential = (event as CustomEvent<GoogleCredential>).detail;
      if (!extractIdToken(credential)) return;
      console.log('Received Google credentials from native wrapper');
      persistCredential(credential);
      await exchangeIdentityToken(credential);
    };

    window.addEventListener('googleAuthSuccess', handleGoogleAuthSuccess);

    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) return;
        const stored = readStoredCredential();
        if (stored && extractIdToken(stored)) {
          await exchangeIdentityToken(stored);
        }
      } catch (err) {
        console.error('Error restoring Google session from storage:', err);
      }
    })();

    return () => {
      window.removeEventListener('googleAuthSuccess', handleGoogleAuthSuccess);
    };
  }, []);
}
