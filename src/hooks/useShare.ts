import { useState, useEffect } from "react";

interface ShareData {
  title: string;
  text: string;
  url?: string;
}

export const useShare = () => {
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && !!navigator.share);
  }, []);

  const shareNative = async (data: ShareData) => {
    if (!navigator.share) {
      throw new Error('Native share not supported');
    }
    
    try {
      await navigator.share(data);
      return true;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return false;
      }
      throw error;
    }
  };

  const shareToTwitter = (text: string) => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'width=550,height=420');
  };

  const shareToFacebook = (url: string = window.location.href) => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(fbUrl, '_blank', 'width=550,height=420');
  };

  const shareToWhatsApp = (text: string) => {
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      return false;
    }
  };

  const generateWorkoutShareText = (workoutData: {
    planName: string;
    exerciseCount: number;
    totalSets: number;
    totalWeight?: number;
  }) => {
    const { planName, exerciseCount, totalSets, totalWeight } = workoutData;
    
    let text = `💪 Just crushed my ${planName} workout!\n\n`;
    text += `✅ ${exerciseCount} exercises\n`;
    text += `✅ ${totalSets} total sets\n`;
    if (totalWeight) {
      text += `✅ ${totalWeight}kg total volume\n`;
    }
    text += `\n#fitness #workout #gains`;
    
    return text;
  };

  const generateProgressShareText = (progressData: {
    exerciseName: string;
    weight: number;
    reps: number;
    improvement?: string;
  }) => {
    const { exerciseName, weight, reps, improvement } = progressData;
    
    let text = `🏆 New Personal Record!\n\n`;
    text += `${exerciseName}: ${weight}kg × ${reps} reps\n`;
    if (improvement) {
      text += `${improvement}\n`;
    }
    text += `\n#fitness #PR #gains`;
    
    return text;
  };

  return {
    canShare,
    shareNative,
    shareToTwitter,
    shareToFacebook,
    shareToWhatsApp,
    copyToClipboard,
    generateWorkoutShareText,
    generateProgressShareText
  };
};
