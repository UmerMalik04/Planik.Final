import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, Trophy, Flame, Target, Zap, Calendar, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const [user, setUser] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setEditedName(user?.user_metadata?.name || '');
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
        icon: <Trophy className="h-6 w-6" />,
        completed: true,
        progress: 10,
        maxProgress: 10,
        completedAt: new Date('2024-01-20')
      },
      {
        id: '3',
        title: '100kg Bench Club',
        description: 'Bench press 100kg or more',
        icon: <Target className="h-6 w-6" />,
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
      // In real app, update user metadata
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
    // Mock profile picture change
    toast({
      title: "Profile Picture",
      description: "Profile picture upload would open here.",
    });
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
  const joinDate = new Date('2024-01-01'); // Mock join date

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="space-y-6">
        {/* Profile Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Profile
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
                    <div className="flex gap-2">
                      <Input
                        id="name"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="flex-1"
                      />
                      <Button onClick={handleSaveName} size="sm">Save</Button>
                      <Button 
                        onClick={() => setIsEditing(false)} 
                        variant="outline" 
                        size="sm"
                      >
                        Cancel
                      </Button>
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
                    Member Since
                  </Label>
                  <p className="text-muted-foreground">
                    {joinDate.toLocaleDateString('en-US', { 
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
              Achievements
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
                      ? 'border-primary bg-primary/5' 
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
                            <Badge variant="default" className="text-xs">Completed</Badge>
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