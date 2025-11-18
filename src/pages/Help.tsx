import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, Dumbbell, Calendar, TrendingUp, Apple, Droplet, Map, Settings, User } from 'lucide-react';

export default function Help() {
  const navigate = useNavigate();

  const helpSections = [
    {
      icon: Dumbbell,
      title: "Getting Started",
      items: [
        {
          question: "How do I create my first workout plan?",
          answer: "Navigate to the home screen and tap 'Create Plan'. Choose a template or start from scratch. Add exercises by searching the exercise library, then set your desired sets, reps, and weights for each exercise."
        },
        {
          question: "What's the difference between templates and custom plans?",
          answer: "Templates are pre-built workout plans designed for specific goals (strength, hypertrophy, etc.). Custom plans let you build your own routine from scratch with complete flexibility."
        }
      ]
    },
    {
      icon: Calendar,
      title: "Workout Plans & Exercise",
      items: [
        {
          question: "How do I start a workout?",
          answer: "Go to your workout plan and tap 'Start Workout'. You'll be guided through each exercise with rest timers between sets. Log your sets, reps, and weight as you complete them."
        },
        {
          question: "Can I edit exercises in my plan?",
          answer: "Yes! Open your workout plan, tap on any exercise, and you can modify sets, reps, weight, or remove it entirely. You can also reorder exercises by dragging them."
        },
        {
          question: "How do I add warmup sets?",
          answer: "When adding or editing an exercise, enable the 'Warmup Set' toggle. This lets you track lighter warmup sets separately from your working sets."
        }
      ]
    },
    {
      icon: TrendingUp,
      title: "Progress Tracking",
      items: [
        {
          question: "How do I track my progress?",
          answer: "Visit the Progress page to view charts of your workout volume, personal records, and body measurements over time. The app automatically tracks PRs when you log weights heavier than previous sessions."
        },
        {
          question: "What is workout volume?",
          answer: "Workout volume is calculated as sets × reps × weight. It's displayed in your workout history and helps you track overall training intensity over time."
        },
        {
          question: "How do I log body measurements?",
          answer: "Go to Settings > Profile and scroll to 'Body Measurements'. You can log weight, body fat percentage, and other metrics with dates to track changes."
        }
      ]
    },
    {
      icon: Apple,
      title: "Diet Tracking",
      items: [
        {
          question: "How do I log meals?",
          answer: "Go to the Diet Tracker page, select the meal type (breakfast, lunch, dinner, snack), and either search for foods in the database or manually enter nutritional information."
        },
        {
          question: "Can I set calorie and macro goals?",
          answer: "Yes! Go to Settings > Goals to set daily targets for calories, protein, carbs, and fats. Your diet tracker will show progress toward these goals."
        },
        {
          question: "How do I use the food recognition feature?",
          answer: "Tap the camera icon in the diet tracker to take a photo of your meal. The AI will analyze it and estimate calories and macronutrients (requires internet connection)."
        }
      ]
    },
    {
      icon: Droplet,
      title: "Water & Wellness",
      items: [
        {
          question: "How do I track water intake?",
          answer: "Use the water tracker widget on the home screen. Tap the '+' button to add water (default 250ml per tap). You can customize the amount in settings."
        },
        {
          question: "How do I set fitness goals?",
          answer: "Go to Settings > Goals to set targets for weekly workout frequency, target weight, daily water intake, and nutritional goals."
        }
      ]
    },
    {
      icon: Map,
      title: "Exercise Library & Body Map",
      items: [
        {
          question: "How do I find exercises for specific muscles?",
          answer: "Visit the Exercise Library and use the muscle group filter buttons at the top. You can also use the search bar to find exercises by name."
        },
        {
          question: "What is the Body Map feature?",
          answer: "The Body Map is an interactive diagram showing muscle groups. Tap any muscle to see exercises that target it, making it easy to plan balanced workouts."
        },
        {
          question: "How do I view exercise instructions?",
          answer: "Tap any exercise in the library to see detailed step-by-step instructions, targeted muscle groups, and proper form guidance."
        }
      ]
    },
    {
      icon: User,
      title: "Profile & Account",
      items: [
        {
          question: "How do I update my profile?",
          answer: "Go to Settings > Profile to update your display name, avatar, and personal information. Changes sync across all your devices."
        },
        {
          question: "Is my data synced across devices?",
          answer: "Yes! All your workout plans, history, diet logs, and settings are stored in the cloud and automatically sync when you sign in on any device."
        },
        {
          question: "How do I enable biometric login?",
          answer: "Go to Settings > Security and enable biometric authentication. You'll be able to use fingerprint or face recognition to quickly access the app."
        }
      ]
    },
    {
      icon: Settings,
      title: "Settings & Customization",
      items: [
        {
          question: "How do I change the app theme?",
          answer: "Go to Settings > Appearance to switch between light and dark mode, and choose from various color themes to personalize your experience."
        },
        {
          question: "Can I customize rest timer duration?",
          answer: "Yes! When creating or editing a workout plan, you can set a custom default rest timer. You can also adjust it during workouts."
        },
        {
          question: "How do I customize home screen widgets?",
          answer: "On the home screen, long-press any widget to drag and reorder them. Some widgets can be hidden from Settings > Preferences."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="hover:bg-accent"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">Help & Tutorials</h1>
          <p className="text-sm text-muted-foreground">
            Everything you need to know about using Planik
          </p>
        </div>
      </div>

      {/* Help sections */}
      <div className="space-y-4">
        {helpSections.map((section, sectionIndex) => {
          const Icon = section.icon;
          return (
            <Card key={sectionIndex} className="border-2 border-[hsl(var(--widget-border))]">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {section.items.map((item, itemIndex) => (
                    <AccordionItem key={itemIndex} value={`item-${sectionIndex}-${itemIndex}`}>
                      <AccordionTrigger className="text-left">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground leading-relaxed">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Contact support card */}
      <Card className="border-2 border-primary/20 bg-primary/5">
        <CardContent className="pt-6 text-center space-y-2">
          <p className="text-foreground font-medium">Still need help?</p>
          <p className="text-sm text-muted-foreground">
            If you couldn't find what you're looking for, feel free to reach out to our support team.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
