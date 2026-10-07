/**
 * AppleAuthService — native "Sign in with Apple" for iOS.
 *
 * Apple Review Guideline 4.8 requires Sign in with Apple whenever an app
 * offers third-party login (e.g. Google). This service bridges the
 * Capacitor plugin to Supabase so the token exchange happens server-side
 * and a session is established just like email/Google flows.
 *
 * Prerequisites (must be done in Apple Developer portal):
 *  1. Enable "Sign in with Apple" capability for the App ID.
 *  2. Add the capability in Xcode (Signing & Capabilities).
 *  3. Configure the Return URL in Apple Developer → Services IDs.
 */
import { Capacitor } from '@capacitor/core';
import { SignInWithApple } from '@capacitor-community/apple-sign-in';
import { supabase } from '@/integrations/supabase/client';
import { isGenericDisplayName } from '@/lib/profileDisplay';

export class AppleAuthService {
  static isNativePlatform(): boolean {
    return Capacitor.isNativePlatform();
  }

  static async signIn(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.isNativePlatform()) {
        // Fallback to Supabase web OAuth on non-native platforms
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'apple',
          options: { redirectTo: `${window.location.origin}/auth/callback` },
        });
        if (error) return { success: false, error: error.message };
        return { success: true };
      }

      const options = {
        clientId: 'uk.org.planik.app',
        redirectURI: 'https://planik.org.uk/auth/callback',
        scopes: 'email name',
        state: crypto.randomUUID(),
        nonce: crypto.randomUUID(),
      };

      const result = await SignInWithApple.authorize(options);
      const identityToken = result.response.identityToken;

      if (!identityToken) {
        return { success: false, error: 'No identity token received from Apple' };
      }

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: identityToken,
      });

      if (error) {
        console.error('Supabase Apple signInWithIdToken error:', error);
        return { success: false, error: error.message };
      }

      if (data.session) {
        // Apple only returns name/email on the very first sign-in — persist
        // them into user_metadata so the profile isn't blank on later logins.
        try {
          const given = result.response.givenName ?? '';
          const family = result.response.familyName ?? '';
          const fullName = `${given} ${family}`.trim();
          const email = result.response.email ?? undefined;
          const existing = data.user?.user_metadata ?? {};
          const patch: Record<string, unknown> = {};
          if (fullName) patch.name = isGenericDisplayName(String(existing.name || existing.full_name || '')) ? fullName : existing.name || existing.full_name;
          if (Object.keys(patch).length > 0 || (email && !data.user?.email)) {
            await supabase.auth.updateUser({
              data: patch,
              ...(email && !data.user?.email ? { email } : {}),
            });
          }
          if (fullName) {
            await supabase.from('user_profiles').upsert({
              user_id: data.user.id,
              display_name: fullName,
            }, { onConflict: 'user_id' });
          }
        } catch (metaErr) {
          console.warn('Could not persist Apple profile info:', metaErr);
        }
        window.location.href = '/';
      }

      return { success: true };
    } catch (err: any) {
      console.error('Apple Sign-In error:', err);
      if (err.message?.includes('canceled') || err.message?.includes('cancelled')) {
        return { success: false, error: 'Sign-in was cancelled' };
      }
      return { success: false, error: err.message || 'Apple Sign-In failed' };
    }
  }
}
