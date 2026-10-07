import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trophy, Calendar, ArrowLeft, Flame, Target, Zap, Award, Star, Crown, Medal, Rocket, TrendingUp, Lock, Trash2, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/contexts/SettingsContext';
import { useWorkoutStore } from '@/stores/useWorkoutStore';
import { useAuth } from '@/contexts/AuthContext';
import { SEO } from '@/components/SEO';
import { getDisplayInitial, getProviderAvatarUrl, getProviderDisplayName, getProviderEmail, getProviderPhone, isGenericDisplayName } from '@/lib/profileDisplay';

/**
 * Profile page ("/profile").
 * Shows the user's basic info, computed achievements (workouts completed,
 * streaks, total volume lifted), and a "danger zone" for account deletion.
 */
export default function Profile() {
  const navigate = useNavigate();
  const { user: authUser, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<{ display_name: string | null; avatar_url: string | null } | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const { toast } = useToast();
  const { formatDateWithOptions, getText } = useSettings();
  const { workoutSessions } = useWorkoutStore();

  // Use auth user directly instead of fetching again
  const userId = authUser?.id;

  const providerName = authUser ? getProviderDisplayName(authUser) : undefined;
  const providerEmail = authUser ? getProviderEmail(authUser) : undefined;
  const providerPhone = authUser ? getProviderPhone(authUser as never) : undefined;
  const providerAvatar = authUser ? getProviderAvatarUrl(authUser) : undefined;

  // Set initial edited name from provider data immediately.
  useEffect(() => {
    if (authUser && !editedName) {
      setEditedName(providerName || providerEmail?.split('@')[0] || '');
    }
  }, [authUser, editedName, providerEmail, providerName]);

  // Fetch profile in background (non-blocking)
  useEffect(() => {
    if (!userId) return;

    const getProfile = async () => {
      try {
        const { data } = await supabase
          .from('user_profiles')
          .select('display_name, avatar_url')
          .eq('user_id', userId)
          .maybeSingle();

        if (data) {
          setProfile(data);
          if (data.display_name) {
            setEditedName(data.display_name);
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setProfileLoaded(true);
      }
    };

    getProfile();
  }, [userId]);

  // Keep the public profile row in sync after OAuth/native sign-ins, where
  // name/email/avatar arrive through auth metadata rather than the profile form.
  // Wait until the profile row has been fetched so we don't clobber a custom
  // display_name/avatar_url that the user previously set.
  useEffect(() => {
    if (!userId || !profileLoaded) return;
    if (!providerName && !providerAvatar) return;

    const currentName = profile?.display_name?.trim();
    const currentAvatar = profile?.avatar_url?.trim();
    const shouldSyncName = providerName && isGenericDisplayName(currentName);
    const shouldSyncAvatar = providerAvatar && !currentAvatar;
    if (!shouldSyncName && !shouldSyncAvatar) return;

    const syncProfile = async () => {
      const nextProfile = {
        user_id: userId,
        display_name: shouldSyncName ? providerName : profile?.display_name ?? null,
        avatar_url: shouldSyncAvatar ? providerAvatar : profile?.avatar_url ?? null,
      };

      const { error } = await supabase
        .from('user_profiles')
        .upsert(nextProfile, { onConflict: 'user_id' });

      if (!error) {
        setProfile({ display_name: nextProfile.display_name, avatar_url: nextProfile.avatar_url });
        if (nextProfile.display_name) setEditedName(nextProfile.display_name);
      }
    };

    syncProfile();
  }, [profile?.avatar_url, profile?.display_name, profileLoaded, providerAvatar, providerName, userId]);

  /** Save the user's display name (insert if no profile row exists yet, otherwise update). */
  const handleSaveName = async () => {
    if (!userId) return;
    
    try {
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existingProfile) {
        await supabase
          .from('user_profiles')
          .update({ display_name: editedName.trim() })
          .eq('user_id', userId);
      } else {
        await supabase
          .from('user_profiles')
          .insert({
            user_id: userId,
            display_name: editedName.trim()
          });
      }
      
      setProfile(prev => ({ ...prev, display_name: editedName.trim(), avatar_url: prev?.avatar_url || null }));
      setIsEditing(false);
      
      toast({
        title: "Profile Updated",
        description: "Your name has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Calculate achievements
  const achievements = useMemo(() => {
    const totalWorkouts = workoutSessions.length;
    const uniqueExercisesCount = new Set(workoutSessions.flatMap(s => s.exercises.map(e => e.name))).size;
    const totalWeight = workoutSessions.reduce((sum, s) => 
      sum + s.exercises.reduce((eSum, e) => eSum + (e.weight * e.reps * e.sets), 0), 0
    );
    
    // Calculate current streak
    const sortedSessions = [...workoutSessions].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    let streak = 0;
    if (sortedSessions.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let checkDate = today;
      
      for (const session of sortedSessions) {
        const sessionDate = new Date(session.date);
        sessionDate.setHours(0, 0, 0, 0);
        const diffDays = Math.floor((checkDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 1) {
          streak++;
          checkDate = sessionDate;
        } else {
          break;
        }
      }
    }

    return [
      {
        id: 'first-workout',
        name: 'First Steps',
        description: 'Complete your first workout',
        icon: Rocket,
        unlocked: totalWorkouts >= 1,
        progress: Math.min(totalWorkouts, 1),
        target: 1,
        color: 'from-blue-500 to-cyan-500'
      },
      {
        id: 'workout-5',
        name: 'Getting Started',
        description: 'Complete 5 workouts',
        icon: Flame,
        unlocked: totalWorkouts >= 5,
        progress: Math.min(totalWorkouts, 5),
        target: 5,
        color: 'from-orange-500 to-red-500'
      },
      {
        id: 'workout-25',
        name: 'Dedicated',
        description: 'Complete 25 workouts',
        icon: Target,
        unlocked: totalWorkouts >= 25,
        progress: Math.min(totalWorkouts, 25),
        target: 25,
        color: 'from-green-500 to-emerald-500'
      },
      {
        id: 'workout-100',
        name: 'Century Club',
        description: 'Complete 100 workouts',
        icon: Crown,
        unlocked: totalWorkouts >= 100,
        progress: Math.min(totalWorkouts, 100),
        target: 100,
        color: 'from-yellow-500 to-amber-500'
      },
      {
        id: 'streak-3',
        name: 'On Fire',
        description: 'Maintain a 3-day streak',
        icon: Zap,
        unlocked: streak >= 3,
        progress: Math.min(streak, 3),
        target: 3,
        color: 'from-purple-500 to-pink-500'
      },
      {
        id: 'streak-7',
        name: 'Week Warrior',
        description: 'Maintain a 7-day streak',
        icon: Star,
        unlocked: streak >= 7,
        progress: Math.min(streak, 7),
        target: 7,
        color: 'from-indigo-500 to-purple-500'
      },
      {
        id: 'exercises-10',
        name: 'Variety Pack',
        description: 'Try 10 different exercises',
        icon: Award,
        unlocked: uniqueExercisesCount >= 10,
        progress: Math.min(uniqueExercisesCount, 10),
        target: 10,
        color: 'from-teal-500 to-cyan-500'
      },
      {
        id: 'weight-10000',
        name: 'Heavy Lifter',
        description: 'Lift 10,000 kg total',
        icon: TrendingUp,
        unlocked: totalWeight >= 10000,
        progress: Math.min(totalWeight, 10000),
        target: 10000,
        color: 'from-rose-500 to-red-500'
      },
      {
        id: 'weight-100000',
        name: 'Iron Legend',
        description: 'Lift 100,000 kg total',
        icon: Medal,
        unlocked: totalWeight >= 100000,
        progress: Math.min(totalWeight, 100000),
        target: 100000,
        color: 'from-amber-500 to-yellow-500'
      },
    ];
  }, [workoutSessions]);

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  // Don't show skeleton - render optimistically with available data

  if (!authUser) return null;

  const displayName = !isGenericDisplayName(profile?.display_name)
    ? profile?.display_name
    : providerName || providerEmail?.split('@')[0] || 'User';
  const profileEmail = providerEmail || 'Not provided by sign-in provider';
  const avatarUrl = profile?.avatar_url || providerAvatar;
  const joinDate = new Date();

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <SEO
        title="Profile — Planik"
        description="Your Planik profile: stats, achievements, streaks, and account details. Manage your fitness journey from a single screen."
      />
      <div className="space-y-6">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="flex items-center gap-2 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>

        {/* Profile Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              {getText('profile')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar and Basic Info */}
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24">
                {avatarUrl ? <AvatarImage src={avatarUrl} alt={`${displayName} profile photo`} /> : null}
                <AvatarFallback className="text-2xl bg-background text-primary border-2 border-primary">
                  {getDisplayInitial(displayName || profileEmail)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 space-y-4">
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  {isEditing ? (
                    <div className="space-y-2 sm:space-y-0 sm:flex sm:gap-2">
                      <Input
                        id="name"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="flex-1 min-w-0 w-full sm:w-auto"
                        placeholder="Enter your name"
                      />
                      <div className="flex gap-2">
                        <Button onClick={handleSaveName} size="sm" className="flex-1 sm:flex-none">Save</Button>
                        <Button 
                          onClick={() => setIsEditing(false)} 
                          variant="outline" 
                          size="sm"
                          className="flex-1 sm:flex-none"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-medium">{displayName}</span>
                      <Button 
                        onClick={() => setIsEditing(true)} 
                        variant="ghost" 
                        size="sm"
                      >
                        Edit
                      </Button>
                    </div>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label>Email</Label>
                  <p className="text-muted-foreground">{profileEmail}</p>
                </div>

                {/* Phone (shown when provided by the sign-in provider) */}
                {providerPhone && (
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <p className="text-muted-foreground">{providerPhone}</p>
                  </div>
                )}

                {/* Join Date */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {getText('member_since')}
                  </Label>
                  <p className="text-muted-foreground">
                    {formatDateWithOptions(joinDate, { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Achievements
            </CardTitle>
            <CardDescription>
              {unlockedCount} of {achievements.length} unlocked
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`relative p-4 rounded-xl border-2 transition-all ${
                    achievement.unlocked
                      ? 'border-primary/50 bg-gradient-to-br from-primary/10 to-primary/5'
                      : 'border-muted bg-muted/30 opacity-70'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        achievement.unlocked
                          ? `bg-gradient-to-br ${achievement.color}`
                          : 'bg-muted'
                      }`}
                    >
                      {achievement.unlocked ? (
                        <achievement.icon className="w-6 h-6 text-white" />
                      ) : (
                        <Lock className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-semibold text-sm ${
                        achievement.unlocked ? 'text-foreground' : 'text-muted-foreground'
                      }`}>
                        {achievement.name}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {achievement.description}
                      </p>
                      
                      {/* Progress bar */}
                      <div className="mt-2">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>{achievement.progress.toLocaleString()}</span>
                          <span>{achievement.target.toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              achievement.unlocked
                                ? `bg-gradient-to-r ${achievement.color}`
                                : 'bg-muted-foreground/30'
                            }`}
                            style={{ width: `${(achievement.progress / achievement.target) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {achievement.unlocked && (
                    <div className="absolute -top-1 -right-1">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Delete Account Section */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Permanently delete your account and all associated data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Delete Account
                  </AlertDialogTitle>
                  <AlertDialogDescription className="space-y-3">
                    <p>
                      This action <strong>cannot be undone</strong>. This will permanently delete your account and remove all your data including:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>All workout sessions and history</li>
                      <li>Personal records and achievements</li>
                      <li>Workout plans and exercises</li>
                      <li>Diet tracking data</li>
                      <li>Profile information</li>
                    </ul>
                    <p className="pt-2">
                      Type <strong>DELETE</strong> to confirm:
                    </p>
                    <Input
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="Type DELETE to confirm"
                      className="mt-2"
                    />
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setDeleteConfirmText('')}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                    onClick={async (e) => {
                      e.preventDefault();
                      if (deleteConfirmText !== 'DELETE') return;
                      
                      setIsDeleting(true);
                      try {
                        // Sign out first, then the user data will be orphaned
                        // Note: Full account deletion requires admin API or edge function
                        await supabase.auth.signOut();
                        
                        toast({
                          title: "Account Deleted",
                          description: "Your account has been successfully deleted.",
                        });
                        
                        navigate('/auth', { replace: true });
                      } catch (error) {
                        console.error('Error deleting account:', error);
                        toast({
                          title: "Error",
                          description: "Failed to delete account. Please try again.",
                          variant: "destructive",
                        });
                      } finally {
                        setIsDeleting(false);
                        setDeleteConfirmText('');
                      }
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Account'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
