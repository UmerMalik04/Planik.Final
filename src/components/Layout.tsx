import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, BarChart3, RotateCcw, History } from "lucide-react";
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

  const navItems = [
    { icon: Home, path: "/", label: "Home" },
    { icon: History, path: "/history", label: "History" },
    { icon: BarChart3, path: "/progress", label: "Progress" }
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
                <item.icon className="w-6 h-6" />
                <span className="text-xs">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}