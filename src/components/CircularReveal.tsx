import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';

interface Props {
  centerX?: string;     // where the circle starts (horizontal)
  centerY?: string;     // where the circle starts (vertical)
  color?: string;       // background color
  durationMs?: number;  // reveal animation time
  delayMs?: number;     // delay before starting
}

const CircularReveal: React.FC<Props> = ({
  centerX = '50vw',
  centerY = '40vh',
  color = '#ffffff',
  durationMs = 900,
  delayMs = 50,
}) => {
  const [start, setStart] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    // hide native splash if running on device
    if (Capacitor.isNativePlatform()) {
      SplashScreen.hide().catch(() => {});
    }
    const t = setTimeout(() => setStart(true), delayMs);
    const g = setTimeout(() => setGone(true), delayMs + durationMs + 240);
    return () => {
      clearTimeout(t);
      clearTimeout(g);
    };
  }, [delayMs, durationMs]);

  if (gone) return null;

  return (
    <div
      style={{
        clipPath: start
          ? `circle(0 at ${centerX} ${centerY})`
          : `circle(150vmax at ${centerX} ${centerY})`,
        background: color,
        transition: `clip-path ${durationMs}ms ease-out, opacity 240ms ease ${durationMs}ms`,
        opacity: start ? 0 : 1,
      }}
      className="fixed inset-0 z-[9999] pointer-events-none"
    />
  );
};

export default CircularReveal;
