/**
 * GoogleAuthService — handles "Sign in with Google" on every platform.
 *
 * Two completely different code paths:
 *  1. NATIVE (iOS/Android via Capacitor)
 *       The Capacitor plugin opens the native Google sign-in sheet
 *       (much nicer UX than a web popup), returns an ID token, and we
 *       trade it for a Supabase session via `signInWithIdToken`.
 *  2. WEB
 *       We hand control to Supabase's OAuth redirect flow. The user is
 *       sent to Google, then back to /auth/callback where Supabase parses
 *       the redirect fragment and finalises the session.
 *
 * `initialize()` is idempotent — we only configure the native plugin once
 * per app launch, and only on actual native platforms.
 */
import { Capacitor } from '@capacitor/core';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { supabase } from '@/integrations/supabase/client';
import { isGenericDisplayName } from '@/lib/profileDisplay';

export class GoogleAuthService {
  private static initialized = false;

  static async initialize() {
    if (this.initialized) return;
    
    if (Capacitor.isNativePlatform()) {
      try {
        await GoogleAuth.initialize({
          clientId: '876860682396-snp1r9u16ftm6mgoksm8348guoerjlnu.apps.googleusercontent.com',
          scopes: ['profile', 'email'],
          grantOfflineAccess: true,
        });
        this.initialized = true;
        console.log('GoogleAuth initialized successfully');
      } catch (error) {
        console.error('GoogleAuth initialization error:', error);
      }
    }
  }

  static isNativePlatform(): boolean {
    return Capacitor.isNativePlatform();
  }

  static async signIn(): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if we're on native platform
      const isNative = Capacitor.isNativePlatform();
      console.log('Google Sign-In - isNative:', isNative, 'platform:', Capacitor.getPlatform());

      if (isNative) {
        // Native Google Sign-In using Capacitor plugin
        try {
          await this.initialize();
          
          console.log('Attempting native Google Sign-In...');
          const googleUser = await GoogleAuth.signIn();
          console.log('Native Google Sign-In result:', googleUser);
          
          if (!googleUser.authentication.idToken) {
            return { success: false, error: 'No ID token received from Google' };
          }

          // Sign in to Supabase with the Google ID token
          const { data, error } = await supabase.auth.signInWithIdToken({
            provider: 'google',
            token: googleUser.authentication.idToken,
          });

          if (error) {
            console.error('Supabase signInWithIdToken error:', error);
            return { success: false, error: error.message };
          }

          // Persist profile info (name, avatar) into user_metadata so the
          // Profile screen shows the user's real name instead of "User".
          try {
            const name = (googleUser as any).displayName || (googleUser as any).name;
            const avatar = (googleUser as any).imageUrl;
            const existing = data.user?.user_metadata ?? {};
            const patch: Record<string, unknown> = {};
            if (name) patch.name = isGenericDisplayName(String(existing.name || existing.full_name || '')) ? name : existing.name || existing.full_name;
            if (avatar) patch.avatar_url = existing.avatar_url || existing.picture || avatar;
            if (Object.keys(patch).length > 0) {
              await supabase.auth.updateUser({ data: patch });
            }
            if (name || avatar) {
              const profilePatch: { user_id: string; display_name?: string; avatar_url?: string } = { user_id: data.user.id };
              if (name) profilePatch.display_name = name;
              if (avatar) profilePatch.avatar_url = avatar;
              await supabase.from('user_profiles').upsert(profilePatch, { onConflict: 'user_id' });
            }
          } catch (metaErr) {
            console.warn('Could not persist Google profile info:', metaErr);
          }

          console.log('Supabase auth successful');
          return { success: true };
        } catch (nativeError: any) {
          console.error('Native Google Sign-In error:', nativeError);
          
          // If native sign-in fails with specific errors, provide helpful message
          if (nativeError.message?.includes('No matching client found') ||
              nativeError.message?.includes('clientId')) {
            return { 
              success: false, 
              error: 'Google Sign-In not configured. Please add your Google Web Client ID to capacitor.config.ts' 
            };
          }
          
          throw nativeError;
        }
      } else {
        // Web OAuth flow - use Supabase OAuth redirect
        console.log('Using web OAuth flow...');
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`
          }
        });

        if (error) {
          return { success: false, error: error.message };
        }

        return { success: true };
      }
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      
      // Handle user cancellation
      if (error.message?.includes('popup_closed') || 
          error.message?.includes('cancelled') ||
          error.message?.includes('canceled') ||
          error.message?.includes('user_cancelled')) {
        return { success: false, error: 'Sign-in was cancelled' };
      }
      
      return { success: false, error: error.message || 'Google Sign-In failed' };
    }
  }

  static async signOut() {
    try {
      if (Capacitor.isNativePlatform()) {
        await GoogleAuth.signOut();
      }
    } catch (error) {
      console.error('Google Sign-Out error:', error);
    }
  }
}
