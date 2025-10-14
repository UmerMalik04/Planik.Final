import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Share2, Twitter, Facebook, MessageCircle, Copy, Check } from "lucide-react";
import { useShare } from "@/hooks/useShare";
import { toast } from "sonner";

interface ShareWorkoutProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workoutData: {
    planName: string;
    exerciseCount: number;
    totalSets: number;
    totalWeight?: number;
  };
}

export const ShareWorkout = ({ open, onOpenChange, workoutData }: ShareWorkoutProps) => {
  const { 
    canShare, 
    shareNative, 
    shareToTwitter, 
    shareToFacebook, 
    shareToWhatsApp, 
    copyToClipboard,
    generateWorkoutShareText 
  } = useShare();
  
  const [copied, setCopied] = useState(false);
  
  const shareText = generateWorkoutShareText(workoutData);

  const handleNativeShare = async () => {
    try {
      await shareNative({
        title: 'My Workout',
        text: shareText
      });
      toast.success("Shared successfully!");
    } catch (error) {
      toast.error("Failed to share");
    }
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(shareText);
    if (success) {
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("Failed to copy");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto">
        <SheetHeader>
          <SheetTitle>Share Your Workout</SheetTitle>
          <SheetDescription>
            Share your achievement with friends
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-4">
          {/* Preview */}
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm whitespace-pre-line">{shareText}</p>
          </div>

          {/* Share Buttons */}
          <div className="grid grid-cols-2 gap-3">
            {canShare && (
              <Button
                onClick={handleNativeShare}
                variant="outline"
                className="w-full flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            )}
            
            <Button
              onClick={() => shareToTwitter(shareText)}
              variant="outline"
              className="w-full flex items-center gap-2"
            >
              <Twitter className="w-4 h-4" />
              Twitter
            </Button>
            
            <Button
              onClick={() => shareToFacebook()}
              variant="outline"
              className="w-full flex items-center gap-2"
            >
              <Facebook className="w-4 h-4" />
              Facebook
            </Button>
            
            <Button
              onClick={() => shareToWhatsApp(shareText)}
              variant="outline"
              className="w-full flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </Button>
            
            <Button
              onClick={handleCopy}
              variant="outline"
              className="w-full flex items-center gap-2 col-span-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy to Clipboard
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
