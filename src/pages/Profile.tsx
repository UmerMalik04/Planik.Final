import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, Trophy, Flame, Target, Zap, Calendar, Star, ArrowLeft, Dumbbell, Users, Weight } from 'lucide-react';
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
}

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
  }, []);

  const loadAchievements = () => {
    // Mock achievements - in real app, load from database
    const userAchievements: Achievement[] = [
      {
        id: '1',
        title: 'Consistency King',
        description: 'Work out 7 days in a row',
        icon: <Flame className="h-6 w-6" />,
        completed: true,
        completedAt: new Date('2024-01-15')
      },
      {
        id: '2',
        title: '10 Workout Club',
        description: 'Complete 10 workouts',
        icon: <Dumbbell className="h-6 w-6" />,
        completed: true,
        progress: 10,
        maxProgress: 10,
        completedAt: new Date('2024-01-20')
      },
      {
        id: '3',
        title: '100kg Bench Club',
        description: 'Bench press 100kg or more',
        icon: <Weight className="h-6 w-6" />,
        completed: false,
        progress: 85,
        maxProgress: 100
      },
      {
        id: '4',
        title: 'Perfect Overload',
        description: 'Increase weight in every workout for a week',
        icon: <Zap className="h-6 w-6" />,
        completed: true,
        completedAt: new Date('2024-01-25')
      },
      {
        id: '5',
        title: 'Early Bird',
        description: 'Complete 5 morning workouts',
        icon: <Star className="h-6 w-6" />,
        completed: false,
        progress: 3,
        maxProgress: 5
      }
    ];

    setAchievements(userAchievements);
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

  const handleProfilePictureChange = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const imageUrl = e.target?.result as string;
          
          try {
            // Get current users array
            const savedUsers = JSON.parse(localStorage.getItem('mock-users') || '[]');
            
            // Update the user in the array
            const userIndex = savedUsers.findIndex((u: any) => u.email === user.email);
            if (userIndex !== -1) {
              savedUsers[userIndex].user_metadata = {
                ...savedUsers[userIndex].user_metadata,
                avatar_url: imageUrl
              };
            } else {
              // If user not found, add them
              savedUsers.push({
                ...user,
                user_metadata: {
                  ...user.user_metadata,
                  avatar_url: imageUrl
                }
              });
            }
            
            // Save updated users array
            localStorage.setItem('mock-users', JSON.stringify(savedUsers));
            
            // Update current user
            const updatedUser = {
              ...user,
              user_metadata: {
                ...user.user_metadata,
                avatar_url: imageUrl
              }
            };
            
            // Save current user separately for immediate access
            localStorage.setItem('current-user', JSON.stringify(updatedUser));
            
            // Also save just the avatar URL for easy access
            localStorage.setItem('user-avatar', imageUrl);
            
            // Update state immediately
            setUser(updatedUser);
            
            // Force a page refresh to ensure all components update
            window.dispatchEvent(new Event('storage'));
            
            toast({
              title: "Profile Picture Updated",
              description: "Your profile picture has been changed successfully.",
            });
          } catch (error) {
            console.error('Profile picture update error:', error);
            toast({
              title: "Error",
              description: "Failed to update profile picture. Please try again.",
              variant: "destructive",
            });
          }
        };
        reader.readAsDataURL(file);
      }
    };
    
    input.click();
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
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user.user_metadata?.avatar_url} alt={displayName} />
                  <AvatarFallback className="text-2xl">
                    {displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
                  onClick={handleProfilePictureChange}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              
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
            <div className="grid gap-4 md:grid-cols-2">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`relative p-4 rounded-lg border-2 transition-all ${
                    achievement.completed 
                      ? 'border-widget bg-primary/5' 
                      : 'border-muted bg-muted/20'
                  }`}
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
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ 
                                width: `${(achievement.progress / achievement.maxProgress) * 100}%` 
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}