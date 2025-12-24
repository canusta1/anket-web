import React, { useEffect, useRef, useCallback } from 'react';
import './ParticleBackground.css';

const ParticleBackground = () => {
    const canvasRef = useRef(null);
    const particlesRef = useRef([]);
    const mouseRef = useRef({ x: 0, y: 0 });
    const animationRef = useRef(null);

    // Particle ayarları
    const PARTICLE_COUNT = 80;
    const PARTICLE_SPEED = 0.5;
    const CONNECTION_DISTANCE = 120;
    const MOUSE_INFLUENCE_RADIUS = 150;

    // Renk paleti (AI görseline uyumlu turkuaz/mor tonları)
    const COLORS = {
        particle: { r: 0, g: 206, b: 209 },      // #00CED1 - Turkuaz (Ana)
        particleAlt: { r: 155, g: 93, b: 229 },  // #9B5DE5 - Mor/Purple
        connection: { r: 78, g: 205, b: 196 },   // #4ECDC4 - Açık turkuaz bağlantı
        mouseConnection: { r: 106, g: 90, b: 205 } // #6A5ACD - Slate blue mouse bağlantı
    };

    const createParticle = useCallback((width, height) => {
        const useAltColor = Math.random() > 0.5;
        const color = useAltColor ? COLORS.particleAlt : COLORS.particle;

        return {
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * PARTICLE_SPEED * 2,
            vy: (Math.random() - 0.5) * PARTICLE_SPEED * 2,
            size: Math.random() * 3 + 2,
            alpha: Math.random() * 0.5 + 0.2,
            baseAlpha: Math.random() * 0.5 + 0.2,
            color: color,
            pulseOffset: Math.random() * Math.PI * 2 // Her particle farklı pulse fazında
        };
    }, []);

    const initParticles = useCallback((width, height) => {
        const particles = [];
        for (let i = 0; i < PARTICLE_COUNT; i++) {
            particles.push(createParticle(width, height));
        }
        particlesRef.current = particles;
    }, [createParticle]);

    const animate = useCallback((ctx, width, height, time) => {
        ctx.clearRect(0, 0, width, height);

        const particles = particlesRef.current;
        const mouse = mouseRef.current;

        // Particle'ları güncelle ve çiz
        particles.forEach((particle, i) => {
            // Mouse etkisi
            const dx = mouse.x - particle.x;
            const dy = mouse.y - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < MOUSE_INFLUENCE_RADIUS && distance > 0) {
                const force = (MOUSE_INFLUENCE_RADIUS - distance) / MOUSE_INFLUENCE_RADIUS * 0.015;
                particle.vx += dx / distance * force;
                particle.vy += dy / distance * force;
            }

            // Hız sönümleme
            particle.vx *= 0.99;
            particle.vy *= 0.99;

            // Minimum hız
            const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
            if (speed < PARTICLE_SPEED * 0.4) {
                particle.vx += (Math.random() - 0.5) * 0.08;
                particle.vy += (Math.random() - 0.5) * 0.08;
            }

            // Pozisyon güncelle
            particle.x += particle.vx;
            particle.y += particle.vy;

            // Kenarlardan geç
            if (particle.x < 0) particle.x = width;
            if (particle.x > width) particle.x = 0;
            if (particle.y < 0) particle.y = height;
            if (particle.y > height) particle.y = 0;

            // Pulse efekti
            const pulse = Math.sin(time * 0.002 + particle.pulseOffset) * 0.2 + 0.8;

            // Mouse yakınlığına göre alpha
            let alpha = particle.baseAlpha * pulse;
            if (distance < MOUSE_INFLUENCE_RADIUS) {
                alpha = particle.baseAlpha + (1 - particle.baseAlpha) * (1 - distance / MOUSE_INFLUENCE_RADIUS) * 0.6;
            }

            // Particle çiz
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${alpha})`;
            ctx.fill();

            // Glow efekti
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
            const gradient = ctx.createRadialGradient(
                particle.x, particle.y, 0,
                particle.x, particle.y, particle.size * 2
            );
            gradient.addColorStop(0, `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${alpha * 0.3})`);
            gradient.addColorStop(1, 'transparent');
            ctx.fillStyle = gradient;
            ctx.fill();

            // Particle'lar arası bağlantı
            for (let j = i + 1; j < particles.length; j++) {
                const p2 = particles[j];
                const connDx = particle.x - p2.x;
                const connDy = particle.y - p2.y;
                const connDistance = Math.sqrt(connDx * connDx + connDy * connDy);

                if (connDistance < CONNECTION_DISTANCE) {
                    const opacity = (1 - connDistance / CONNECTION_DISTANCE) * 0.35;
                    ctx.beginPath();
                    ctx.moveTo(particle.x, particle.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = `rgba(${COLORS.connection.r}, ${COLORS.connection.g}, ${COLORS.connection.b}, ${opacity})`;
                    ctx.lineWidth = 0.8;
                    ctx.stroke();
                }
            }

            // Mouse'a bağlantı
            if (distance < MOUSE_INFLUENCE_RADIUS) {
                const opacity = (1 - distance / MOUSE_INFLUENCE_RADIUS) * 0.5;
                ctx.beginPath();
                ctx.moveTo(particle.x, particle.y);
                ctx.lineTo(mouse.x, mouse.y);
                ctx.strokeStyle = `rgba(${COLORS.mouseConnection.r}, ${COLORS.mouseConnection.g}, ${COLORS.mouseConnection.b}, ${opacity})`;
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        });
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');

        const resizeCanvas = () => {
            const parent = canvas.parentElement;
            if (parent) {
                canvas.width = parent.offsetWidth;
                canvas.height = parent.offsetHeight;

                if (particlesRef.current.length === 0) {
                    initParticles(canvas.width, canvas.height);
                }
            }
        };

        const handleMouseMove = (e) => {
            const rect = canvas.getBoundingClientRect();
            mouseRef.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        };

        const handleMouseLeave = () => {
            mouseRef.current = { x: -1000, y: -1000 };
        };

        const loop = (time) => {
            if (canvas.width > 0 && canvas.height > 0) {
                animate(ctx, canvas.width, canvas.height, time);
            }
            animationRef.current = requestAnimationFrame(loop);
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseleave', handleMouseLeave);
        animationRef.current = requestAnimationFrame(loop);

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            canvas.removeEventListener('mousemove', handleMouseMove);
            canvas.removeEventListener('mouseleave', handleMouseLeave);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [animate, initParticles]);

    return (
        <canvas
            ref={canvasRef}
            className="particle-canvas"
            aria-hidden="true"
        />
    );
};

export default ParticleBackground;
