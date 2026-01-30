import { useEffect, useRef } from 'react';

export type MatrixColor = 'green' | 'blue' | 'yellow' | 'red' | 'white' | 'purple';

interface MatrixRainProps {
  color?: MatrixColor;
}

const COLOR_MAP: Record<MatrixColor, { main: string; bright: string }> = {
  green: { main: '#22c55e20', bright: '#86efac' },   // Default - pass/success
  blue: { main: '#3b82f620', bright: '#93c5fd' },    // Restart/in progress
  yellow: { main: '#eab30820', bright: '#fde047' },  // Warning/error
  red: { main: '#ef444420', bright: '#fca5a5' },     // Failed
  white: { main: '#ffffff10', bright: '#ffffff' },   // Start/neutral
  purple: { main: '#a855f720', bright: '#d8b4fe' },  // Achievement
};

export default function MatrixRain({ color = 'green' }: MatrixRainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Matrix characters (mix of katakana, numbers, and symbols)
    const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%^&*';
    const charArray = chars.split('');

    const fontSize = 14;
    const columns = Math.floor(canvas.width / fontSize);

    // Array to track y position of each column
    const drops: number[] = [];
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -100;
    }

    const colors = COLOR_MAP[color];
    let animationId: number;

    const draw = () => {
      // Semi-transparent background for trail effect
      ctx.fillStyle = 'rgba(17, 24, 39, 0.05)'; // dark gray with low opacity
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        // Random character
        const char = charArray[Math.floor(Math.random() * charArray.length)];
        
        // Draw character
        const x = i * fontSize;
        const y = drops[i] * fontSize;
        
        // Brighter for the leading character
        if (Math.random() > 0.98) {
          ctx.fillStyle = colors.bright;
        } else {
          ctx.fillStyle = colors.main;
        }
        
        ctx.fillText(char, x, y);

        // Reset drop to top with random delay
        if (y > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }

      animationId = requestAnimationFrame(draw);
    };

    // Start animation with slight delay
    const timeoutId = setTimeout(() => {
      draw();
    }, 100);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
      clearTimeout(timeoutId);
    };
  }, [color]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-30"
      style={{ background: 'transparent' }}
    />
  );
}
