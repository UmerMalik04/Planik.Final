import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, BarChart3, RotateCcw, History, Dumbbell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog";
import UserProfile from './UserProfile';
import { useSettings } from "@/contexts/SettingsContext";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  const { getText } = useSettings();
  
  const navItems = [
    { icon: Home, path: "/", label: getText('home') },
    { icon: Dumbbell, path: "/exercises", label: getText('exercises_tab') },
    { icon: User, path: "/body-map", label: getText('body_map_tab') },
    { icon: BarChart3, path: "/progress", label: getText('progress') },
    { icon: History, path: "/history", label: getText('history') }
  ];

  // Don't show navigation on auth pages
  if (location.pathname === '/auth' || location.pathname === '/auth/callback') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with user profile */}
      <header className="bg-card border-b border-border px-4 py-3">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold text-foreground">Planik</h1>
          <UserProfile />
        </div>
      </header>
      
      {/* Main content */}
      <main className="pb-20">
        {children}
      </main>
      
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border px-6 py-3">
        <div className="flex justify-around items-center max-w-md mx-auto">
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.path;

            return (
              <Button
                key={item.path}
                variant="ghost"
                size="sm"
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-1 p-2 h-auto ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}