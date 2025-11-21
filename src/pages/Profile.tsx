import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Flame, Target, Zap, Calendar, Star, ArrowLeft, Dumbbell, Users, Weight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/contexts/SettingsContext';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  progress?: number;
  maxProgress?: number;
  completedAt?: Date;
  achievementId?: string;
}

const getIconComponent = (iconName: string) => {
  const icons: Record<string, React.ReactNode> = {
    Flame: <Flame className="h-6 w-6" />,
    Trophy: <Trophy className="h-6 w-6" />,
    Star: <Star className="h-6 w-6" />,
    Dumbbell: <Dumbbell className="h-6 w-6" />,
    Zap: <Zap className="h-6 w-6" />,
    Weight: <Weight className="h-6 w-6" />,
    Target: <Target className="h-6 w-6" />,
  };
  return icons[iconName] || <Trophy className="h-6 w-6" />;
};

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const { toast } = useToast();
  const { formatDateWithOptions, getText, formatWeight } = useSettings();

  useEffect(() => {
    const getUser = async () => {
      // First try to get user from localStorage (for updated profile data)
      const savedUser = localStorage.getItem('current-user');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setEditedName(parsedUser?.user_metadata?.name || '');
      } else {
        // Fallback to Supabase if no saved user
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        setEditedName(user?.user_metadata?.name || '');
      }
      loadAchievements();
    };

    getUser();

    // Set up realtime subscription for achievement updates
    const channel = supabase
      .channel('user_achievements_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_achievements',
        },
        (payload) => {
          console.log('Achievement update:', payload);
          loadAchievements();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadAchievements = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      console.log('Loading achievements for user:', currentUser?.id);
      if (!currentUser) {
        console.log('No user found, cannot load achievements');
        return;
      }

      // Load all achievements
      const { data: allAchievements, error: achievementsError } = await supabase
        .from('achievements')
        .select('*')
        .order('target_value', { ascending: true });

      if (achievementsError) throw achievementsError;

      // Load user's achievement progress
      const { data: userProgress, error: progressError } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', currentUser.id);

      if (progressError) throw progressError;

      // Create a map of user progress
      const progressMap = new Map(
        userProgress?.map(p => [p.achievement_id, p]) || []
      );

      // Get user's workout statistics to calculate progress
      const { data: sessions } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('user_id', currentUser.id);

      const totalWorkouts = sessions?.length || 0;

      // Map achievements with progress
      const achievementsWithProgress = allAchievements?.map(achievement => {
        const userProg = progressMap.get(achievement.id);
        const isCompleted = userProg?.completed || false;

        // Calculate current progress based on metric
        let currentProgress = userProg?.current_progress || 0;
        
        // Auto-calculate progress for workouts_completed metric
        if (achievement.metric === 'workouts_completed') {
          currentProgress = totalWorkouts;
        }

        return {
          id: achievement.id,
          achievementId: achievement.id,
          title: achievement.title,
          description: achievement.description,
          icon: getIconComponent(achievement.icon),
          completed: isCompleted,
          progress: currentProgress,
          maxProgress: achievement.target_value,
          completedAt: userProg?.completed_at ? new Date(userProg.completed_at) : undefined,
        };
      }) || [];

      // Check for newly completed achievements
      for (const achievement of achievementsWithProgress) {
        const userProg = progressMap.get(achievement.achievementId!);
        const wasCompleted = userProg?.completed || false;
        const isNowCompleted = achievement.progress! >= achievement.maxProgress!;

        if (isNowCompleted && !wasCompleted) {
          // Mark as completed in database
          if (userProg) {
            await supabase
              .from('user_achievements')
              .update({
                completed: true,
                completed_at: new Date().toISOString(),
                current_progress: achievement.progress,
              })
              .eq('id', userProg.id);
          } else {
            await supabase
              .from('user_achievements')
              .insert({
                user_id: currentUser.id,
                achievement_id: achievement.achievementId!,
                completed: true,
                completed_at: new Date().toISOString(),
                current_progress: achievement.progress,
              });
          }

          // Show notification
          toast({
            title: "🎉 Achievement Unlocked!",
            description: `${achievement.title} - ${achievement.description}`,
            duration: 5000,
          });

          // Trigger animation
          triggerAchievementAnimation(achievement.id);
        } else if (!isNowCompleted && userProg && achievement.progress !== userProg.current_progress) {
          // Update progress
          await supabase
            .from('user_achievements')
            .update({
              current_progress: achievement.progress,
            })
            .eq('id', userProg.id);
        } else if (!isNowCompleted && !userProg && achievement.progress! > 0) {
          // Create initial progress entry
          await supabase
            .from('user_achievements')
            .insert({
              user_id: currentUser.id,
              achievement_id: achievement.achievementId!,
              completed: false,
              current_progress: achievement.progress,
            });
        }
      }

      // Show only incomplete achievements (up to 5)
      const incompleteAchievements = achievementsWithProgress.filter(a => !a.completed);
      const displayAchievements = incompleteAchievements.slice(0, 5);

      console.log('Display achievements:', displayAchievements);
      setAchievements(displayAchievements);
    } catch (error) {
      console.error('Error loading achievements:', error);
      toast({
        title: "Error",
        description: "Failed to load achievements. Please refresh the page.",
        variant: "destructive",
      });
    }
  };

  const handleSaveName = async () => {
    try {
      // Update user in localStorage
      const savedUsers = JSON.parse(localStorage.getItem('mock-users') || '[]');
      const userIndex = savedUsers.findIndex((u: any) => u.email === user.email);
      if (userIndex !== -1) {
        savedUsers[userIndex].user_metadata.name = editedName;
        localStorage.setItem('mock-users', JSON.stringify(savedUsers));
        localStorage.setItem('current-user', JSON.stringify(savedUsers[userIndex]));
      }
      
      const updatedUser = {
        ...user,
        user_metadata: {
          ...user.user_metadata,
          name: editedName
        }
      };
      setUser(updatedUser);
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


  const triggerAchievementAnimation = (achievementId: string) => {
    // Create confetti animation effect
    const confettiElement = document.createElement('div');
    confettiElement.innerHTML = '🎉🔥';
    confettiElement.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-6xl animate-bounce z-50';
    document.body.appendChild(confettiElement);
    
    setTimeout(() => {
      document.body.removeChild(confettiElement);
    }, 2000);
  };

  if (!user) return null;

  const displayName = user.user_metadata?.name || user.email?.split('@')[0] || 'User';
  const joinDate = user.created_at ? new Date(user.created_at) : new Date();

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
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
                <AvatarFallback className="text-2xl bg-background text-primary border-2 border-primary">
                  {displayName.charAt(0).toUpperCase()}
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
                  <p className="text-muted-foreground">{user.email}</p>
                </div>

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
              <Trophy className="h-5 w-5" />
              {getText('achievements')}
            </CardTitle>
            <CardDescription>
              Your fitness milestones and accomplishments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {achievements.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No achievements to display yet. Complete your first workout to unlock achievements!
              </p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className="relative p-4 rounded-lg border-2 border-primary bg-background transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${
                      achievement.completed ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      {achievement.icon}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{achievement.title}</h3>
                        {achievement.completed && (
                          <div className="flex items-center gap-1">
                            <Badge variant="default" className="text-xs">{getText('completed')}</Badge>
                            <span 
                              className="text-lg cursor-pointer hover:animate-bounce"
                              onClick={() => triggerAchievementAnimation(achievement.id)}
                            >
                              🎉🔥
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {achievement.description}
                      </p>
                      
                      {achievement.progress !== undefined && achievement.maxProgress && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>Progress</span>
                            <span>{achievement.progress}/{achievement.maxProgress}</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ 
                                width: `${Math.min(100, (achievement.progress / achievement.maxProgress) * 100)}%` 
                              }}
                            />
                          </div>
                        </div>
                      )}
                      
                      {achievement.completedAt && (
                        <p className="text-xs text-muted-foreground">
                          Completed on {achievement.completedAt.toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}