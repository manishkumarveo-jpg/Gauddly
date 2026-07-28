import React, { useEffect, useRef } from 'react';

export default function SilverRain({ opacity = 1.0 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Enhanced rain drop — varying speed, opacity, length, pulse
    class Drop {
      constructor(canvasWidth) {
        this.reset(canvasWidth, true);
      }

      reset(canvasWidth, initial = false) {
        this.x         = Math.random() * canvasWidth;
        this.y         = initial ? Math.random() * -window.innerHeight : -(60 + Math.random() * 100);
        // 3 speed tiers: slow foreground, medium, fast distant
        const tier     = Math.random();
        this.speed     = tier < 0.33 ? 0.3 + Math.random() * 0.5
                       : tier < 0.66 ? 0.8 + Math.random() * 1.2
                       :               1.8 + Math.random() * 2.0;
        this.length    = 40 + Math.random() * 160;
        this.thickness = 0.3 + Math.random() * 1.6;
        // Each drop fades in and out softly
        this.alphaBase = 0.05 + Math.random() * 0.55;
        this.alphaOsc  = Math.random() * Math.PI * 2; // phase offset for flicker
        this.flickerSpeed = 0.008 + Math.random() * 0.025;
      }

      update(canvasWidth, canvasHeight) {
        this.y        += this.speed;
        this.alphaOsc += this.flickerSpeed;
        if (this.y > canvasHeight + this.length) {
          this.reset(canvasWidth);
        }
      }

      draw(context) {
        const flickerAmt = 0.18 * Math.sin(this.alphaOsc);
        const alpha      = Math.max(0, Math.min(1, this.alphaBase + flickerAmt));

        context.beginPath();
        context.moveTo(this.x, this.y);
        context.lineTo(this.x, this.y + this.length);

        const gradient = context.createLinearGradient(this.x, this.y, this.x, this.y + this.length);
        gradient.addColorStop(0,   `rgba(200, 204, 209, 0)`);
        gradient.addColorStop(0.2, `rgba(200, 204, 209, ${alpha})`);
        gradient.addColorStop(0.5, `rgba(244, 241, 234, ${Math.min(1, alpha * 1.3)})`); // bright glint
        gradient.addColorStop(0.8, `rgba(200, 204, 209, ${alpha * 0.6})`);
        gradient.addColorStop(1,   `rgba(200, 204, 209, 0)`);

        context.strokeStyle = gradient;
        context.lineWidth   = this.thickness;
        context.stroke();
      }
    }

    // More drops for a denser ethereal effect
    const particleCount = 200;
    const drops         = [];
    for (let i = 0; i < particleCount; i++) {
      drops.push(new Drop(canvas.width));
    }

    const render = () => {
      // Softer trailing for elegant motion blur
      ctx.fillStyle = 'rgba(10, 10, 10, 0.12)';
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
