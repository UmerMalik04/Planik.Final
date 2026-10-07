/**
 * useNativeAppleAuth — bridge between the iOS native wrapper and Supabase.
 *
 * The native iOS wrapper sets `window.isNativeApp = true` and dispatches
 * `appleAuthSuccess` after native Sign in with Apple. The credential detail
 * contains `identityToken` and — ONLY on the very first sign-in for that
 * Apple ID — `email` and `fullName` ({ givenName, familyName }). On every
 * subsequent sign-in Apple omits both, so we must persist what we get the
 * first time and merge it into Supabase user_metadata.
 */
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isGenericDisplayName } from '@/lib/profileDisplay';

interface AppleFullName {
  givenName?: string | null;
  familyName?: string | null;
}

interface AppleCredential {
  identityToken?: string;
  email?: string | null;
  fullName?: AppleFullName | null;
  givenName?: string | null;
  familyName?: string | null;
  phone?: string | null;
  phoneNumber?: string | null;
  user?: string | null;
  [key: string]: unknown;
}

declare global {
  interface Window {
    isNativeApp?: boolean;
  }
}

function buildDisplayName(cred: AppleCredential | null): string | undefined {
  if (!cred) return undefined;
  const given = cred.fullName?.givenName ?? cred.givenName ?? undefined;
  const family = cred.fullName?.familyName ?? cred.familyName ?? undefined;
  const name = [given, family].filter(Boolean).join(' ').trim();
  return name || undefined;
}

async function exchangeIdentityToken(credential: AppleCredential) {
  const identityToken = credential.identityToken;
  if (!identityToken) return false;

  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: identityToken,
  });
  if (error) {
    console.error('Supabase Apple Sign-In Error:', error.message);
    return false;
  }
  if (!data?.session) return false;

  // Merge first-time profile info (name/email) into user_metadata. Apple
  // only sends these on the first sign-in, so we also persist to localStorage
  // for cold restores.
  try {
    const name = buildDisplayName(credential);
    const email = credential.email ?? undefined;
    const phone = credential.phone ?? credential.phoneNumber ?? undefined;
    const existing = (data.user?.user_metadata ?? {}) as Record<string, unknown>;
    const patch: Record<string, unknown> = {};
    if (name && isGenericDisplayName(String(existing.name || existing.full_name || ''))) {
      patch.name = name;
      patch.full_name = name;
    }
    if (email && !existing.email) patch.email = email;
    if (phone && !existing.phone) patch.phone = phone;

    if (Object.keys(patch).length > 0 || (email && !data.user?.email)) {
      await supabase.auth.updateUser({
        data: patch,
        ...(email && !data.user?.email ? { email } : {}),
      });
    }

    if (name || email) {
      await supabase.from('user_profiles').upsert({
        user_id: data.user.id,
        ...(name ? { display_name: name } : {}),
      }, { onConflict: 'user_id' });
    }
  } catch (err) {
    console.warn('Could not persist Apple profile info:', err);
  }

  window.location.href = '/';
  return true;
}

function readStoredCredential(): AppleCredential | null {
  try {
    const raw = localStorage.getItem('apple_credential');
    if (raw) {
      const parsed = JSON.parse(raw) as AppleCredential;
      if (parsed?.identityToken) return parsed;
    }
    const token = localStorage.getItem('auth_token');
    if (token) return { identityToken: token };
  } catch {
    /* ignore malformed storage */
  }
  return null;
}

function persistCredential(cred: AppleCredential) {
  try {
    // Merge with anything already stored so we never lose the first-time
    // name/email even if a later event omits them.
    const prev = readStoredCredential() ?? {};
    const merged: AppleCredential = {
      ...prev,
      ...cred,
      fullName: cred.fullName ?? prev.fullName ?? null,
      email: cred.email ?? prev.email ?? null,
    };
    localStorage.setItem('apple_credential', JSON.stringify(merged));
    if (cred.identityToken) {
      localStorage.setItem('auth_token', cred.identityToken);
    }
  } catch {
    /* ignore quota / serialization errors */
  }
}

export function useNativeAppleAuth() {
  useEffect(() => {
    if (typeof window === 'undefined' || !window.isNativeApp) return;

    const handleAppleAuthSuccess = async (event: Event) => {
      const credential = (event as CustomEvent<AppleCredential>).detail;
      if (!credential?.identityToken) return;
      console.log('Received Apple credentials from native wrapper');
      persistCredential(credential);
      await exchangeIdentityToken(credential);
    };

    window.addEventListener('appleAuthSuccess', handleAppleAuthSuccess);

    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) return;
        const stored = readStoredCredential();
        if (stored?.identityToken) {
          await exchangeIdentityToken(stored);
        }
      } catch (err) {
        console.error('Error restoring Apple session from storage:', err);
      }
    })();

    return () => {
      window.removeEventListener('appleAuthSuccess', handleAppleAuthSuccess);
    };
  }, []);
}
