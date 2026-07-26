import React, { useEffect, useRef } from 'react';

export default function SilverRain({ opacity = 1.0 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Resize canvas
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Rain drop particle class
    class Drop {
      constructor(canvasWidth) {
        this.reset(canvasWidth, true);
      }

      reset(canvasWidth, initial = false) {
        this.x = Math.random() * canvasWidth;
        this.y = initial ? Math.random() * -window.innerHeight : -100;
        // Slow motion falling speed (1px to 3px per frame)
        this.speed = 0.5 + Math.random() * 1.5;
        // Elongated strands (40px to 120px long)
        this.length = 50 + Math.random() * 150;
        // Variable thickness (0.5px to 2px)
        this.thickness = 0.5 + Math.random() * 1.5;
        // Alpha for soft depth
        this.alpha = 0.1 + Math.random() * 0.6;
      }

      update(canvasWidth, canvasHeight) {
        this.y += this.speed;
        if (this.y > canvasHeight) {
          this.reset(canvasWidth);
        }
      }

      draw(context) {
        // Draw elongated silver strand
        context.beginPath();
        context.moveTo(this.x, this.y);
        context.lineTo(this.x, this.y + this.length);
        
        // Metallic Silver Rain color gradient (#C8CCD1 to semi-transparent)
        const gradient = context.createLinearGradient(this.x, this.y, this.x, this.y + this.length);
        gradient.addColorStop(0, `rgba(200, 204, 209, ${this.alpha})`);
        gradient.addColorStop(0.5, `rgba(244, 241, 234, ${this.alpha * 1.2})`); // Bone white glint
        gradient.addColorStop(1, 'rgba(200, 204, 209, 0)');

        context.strokeStyle = gradient;
        context.lineWidth = this.thickness;
        context.stroke();
      }
    }

    // Initialize particles (dense strands)
    const particleCount = 150;
    const drops = [];
    for (let i = 0; i < particleCount; i++) {
      drops.push(new Drop(canvas.width));
    }

    // Animation Loop
    const render = () => {
      // Clear with slight trailing opacity for a soft metallic motion blur
      ctx.fillStyle = 'rgba(10, 10, 10, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      drops.forEach((drop) => {
        drop.update(canvas.width, canvas.height);
        drop.draw(ctx);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: opacity,
        mixBlendMode: 'screen',
      }}
    />
  );
}
