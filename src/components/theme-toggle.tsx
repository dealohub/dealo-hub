'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        aria-label="Toggle theme"
        className="fixed bottom-4 end-4 z-50 hidden md:grid h-10 w-10 place-items-center rounded-full border border-border bg-background/80 text-foreground shadow-lg backdrop-blur"
      />
    );
  }

  const current = theme === 'system' ? resolvedTheme : theme;
  const isDark = current === 'dark';

  return (
    <button
      type="button"
      aria-label="Toggle theme"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="fixed bottom-4 end-4 z-50 hidden md:grid h-10 w-10 place-items-center rounded-full border border-border bg-background/80 text-foreground shadow-lg backdrop-blur transition hover:bg-muted"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
