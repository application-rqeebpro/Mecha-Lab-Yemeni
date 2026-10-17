import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Cpu } from 'lucide-react';

interface AppLogoSecretTriggerProps {
  onTrigger: () => void;
  className?: string;
}

const HOLD_DURATION_MS = 20000; // 20 seconds as requested: "عندما اضغط على شعار التطبيق لمده عشرين ثانيه"

export const AppLogoSecretTrigger: React.FC<AppLogoSecretTriggerProps> = ({
  onTrigger,
  className = ''
}) => {
  const [isPressing, setIsPressing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0); // 0 to 100
  const [secondsLeft, setSecondsLeft] = useState<number>(20);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPressing(false);
    setProgress(0);
    setSecondsLeft(20);
  }, []);

  const handleStartHold = (e: React.SyntheticEvent) => {
    // Prevent context menu or image drags on mobile
    if (e.cancelable && e.type === 'touchstart') {
      // Don't prevent default completely to allow normal touch, but handle it cleanly
    }

    cleanup();
    setIsPressing(true);
    startTimeRef.current = Date.now();
    setProgress(0);
    setSecondsLeft(20);

    // Update progress frequently for ultra-smooth animation
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min(100, (elapsed / HOLD_DURATION_MS) * 100);
      const remainingSec = Math.max(0, Math.ceil((HOLD_DURATION_MS - elapsed) / 1000));
      setProgress(pct);
      setSecondsLeft(remainingSec);
    }, 100);

    // Completion after 20 seconds
    timerRef.current = setTimeout(() => {
      cleanup();
      try {
        if ('vibrate' in navigator) {
          navigator.vibrate([150, 80, 150]);
        }
      } catch {}
      onTrigger();
    }, HOLD_DURATION_MS);
  };

  const handleEndHold = () => {
    cleanup();
  };

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  // Circumference for circular progress indicator
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none cursor-pointer ${className}`}
      onMouseDown={handleStartHold}
      onMouseUp={handleEndHold}
      onMouseLeave={handleEndHold}
      onTouchStart={handleStartHold}
      onTouchEnd={handleEndHold}
      onTouchCancel={handleEndHold}
      onContextMenu={(e) => {
        // Prevent default context menu on long press
        if (isPressing) e.preventDefault();
      }}
      title="المختبر الافتراضي لهندسة الميكاترونكس"
    >
      {/* Visual Circular Progress Ring for 20-second secret hold */}
      {isPressing && (
        <svg
          className="absolute -inset-2.5 w-[56px] h-[56px] sm:w-[60px] sm:h-[60px] -rotate-90 pointer-events-none z-20 animate-pulse"
          viewBox="0 0 52 52"
        >
          <circle
            cx="26"
            cy="26"
            r={radius}
            stroke="currentColor"
            strokeWidth="3.5"
            fill="transparent"
            className="text-amber-500/20"
          />
          <circle
            cx="26"
            cy="26"
            r={radius}
            stroke="currentColor"
            strokeWidth="3.5"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="text-amber-400 transition-all duration-100 ease-linear"
          />
        </svg>
      )}

      {/* Main Logo Graphic */}
      <div 
        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl p-0.5 shadow-lg transition-transform duration-200 ${
          isPressing 
            ? 'scale-95 bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 shadow-amber-500/40' 
            : 'bg-gradient-to-tr from-purple-600 via-indigo-600 to-emerald-400 shadow-purple-900/30'
        }`}
      >
        <div className="w-full h-full bg-slate-950 rounded-[10px] sm:rounded-[14px] flex items-center justify-center relative overflow-hidden">
          <Cpu className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${isPressing ? 'text-amber-400 animate-spin' : 'text-emerald-400'}`} />

          {/* Tiny countdown pill visible during holding */}
          {isPressing && (
            <div className="absolute inset-0 bg-slate-950/90 flex items-center justify-center">
              <span className="text-[10px] sm:text-xs font-mono font-bold text-amber-400">
                {secondsLeft}s
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
