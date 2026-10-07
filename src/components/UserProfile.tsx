import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, Settings, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/contexts/SettingsContext';
import { resetPrefetchState } from '@/hooks/useDataPrefetch';
import { getDisplayInitial, getProviderAvatarUrl, getProviderDisplayName, getProviderEmail, isGenericDisplayName } from '@/lib/profileDisplay';

interface AuthUser {
  id: string;
  email?: string;
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

export default function UserProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const { toast } = useToast();
  const { getText } = useSettings();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get profile data from Supabase
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('display_name, avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();

      const providerName = getProviderDisplayName(user);
      const providerAvatar = getProviderAvatarUrl(user);
      if (profile) {
        const profileName = isGenericDisplayName(profile.display_name) ? providerName : profile.display_name;
        user.user_metadata = {
          ...user.user_metadata,
          name: profileName,
          avatar_url: profile.avatar_url || providerAvatar
        };
      } else if (providerName || providerAvatar) {
        const profilePatch: { user_id: string; display_name?: string; avatar_url?: string } = { user_id: user.id };
        if (providerName) profilePatch.display_name = providerName;
        if (providerAvatar) profilePatch.avatar_url = providerAvatar;
        await supabase.from('user_profiles').upsert(profilePatch, { onConflict: 'user_id' });

        user.user_metadata = {
          ...user.user_metadata,
          name: providerName,
          avatar_url: providerAvatar,
        };
      }
      
      setUser(user);
    };

    getUser();

    // Listen to auth state changes
    // IMPORTANT: never `await` Supabase calls directly inside onAuthStateChange —
    // the callback runs while the auth lock is held, so awaiting a query (which
    // itself needs the lock) deadlocks every later getSession(). That froze the
    // food scanner on phones. Deferring with setTimeout releases the lock first.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => { setTimeout(async () => {
        if (session?.user) {
          // Get profile data from Supabase
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('display_name, avatar_url')
            .eq('user_id', session.user.id)
            .maybeSingle();

          const providerName = getProviderDisplayName(session.user);
          const providerAvatar = getProviderAvatarUrl(session.user);
          if (profile) {
            const profileName = isGenericDisplayName(profile.display_name) ? providerName : profile.display_name;
            session.user.user_metadata = {
              ...session.user.user_metadata,
              name: profileName,
              avatar_url: profile.avatar_url || providerAvatar
            };
          } else if (providerName || providerAvatar) {
            const profilePatch: { user_id: string; display_name?: string; avatar_url?: string } = { user_id: session.user.id };
            if (providerName) profilePatch.display_name = providerName;
            if (providerAvatar) profilePatch.avatar_url = providerAvatar;
            await supabase.from('user_profiles').upsert(profilePatch, { onConflict: 'user_id' });

            session.user.user_metadata = {
              ...session.user.user_metadata,
              name: providerName,
              avatar_url: providerAvatar,
            };
          }
          setUser(session.user);
        } else {
          setUser(null);
        }
      }, 0); }
    );

    // Listen to real-time profile updates (user-scoped channel for RLS)
    let profileChannel: ReturnType<typeof supabase.channel> | null = null;
    supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
      if (!currentUser) return;
      profileChannel = supabase
        .channel(`profile-changes:${currentUser.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'user_profiles',
            filter: `user_id=eq.${currentUser.id}`,
          },
          (payload) => {
            if (payload.new.user_id === currentUser.id) {
              // Update user with new profile data
              currentUser.user_metadata = {
                ...currentUser.user_metadata,
                name: payload.new.display_name,
                avatar_url: payload.new.avatar_url
              };
              setUser({ ...currentUser });
            }
          }
        )
        .subscribe();
    });

    return () => {
      subscription.unsubscribe();
      if (profileChannel) supabase.removeChannel(profileChannel);
    };
  }, []);

  const handleLogout = () => {
    // Reset prefetch state for next login
    resetPrefetchState();
    
    // Instant optimistic logout - clear state and redirect immediately
    localStorage.clear();
    sessionStorage.clear();
    
    // Redirect instantly without waiting for server
    window.location.replace('/auth');
    
    // Sign out from Supabase in background (fire and forget)
    supabase.auth.signOut().catch(console.error);
  };

  if (!user) return null;

  const email = getProviderEmail(user);
  const displayName = getProviderDisplayName(user) || email?.split('@')[0] || 'User';
  const avatarUrl = getProviderAvatarUrl(user);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt={`${displayName} profile photo`} /> : null}
            <AvatarFallback className="bg-background text-primary border-2 border-primary">
              {getDisplayInitial(displayName || email)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            <p className="font-medium">{displayName}</p>
            <p className="w-[200px] truncate text-sm text-muted-foreground">
              {email || 'No email provided'}
            </p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/profile')}>
          <User className="mr-2 h-4 w-4" />
          <span>{getText('profile')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          <span>{getText('settings')}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>{getText('log_out')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}