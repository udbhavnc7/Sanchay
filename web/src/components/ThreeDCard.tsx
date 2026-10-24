import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { sound } from '../utils/audio';
import { Snowflake, Eye, EyeOff, RotateCw, Sparkles, CreditCard } from 'lucide-react';

interface ThreeDCardProps {
  isFrozen: boolean;
  onToggleFreeze: () => void;
  spendingLimit: number;
  monthlySpent: number;
}

export type CardFinish = 'obsidian' | 'gold' | 'platinum' | 'emerald';

// Card finish color palettes
const finishConfigs = {
  obsidian: {
    color: 0x111317,
    metalness: 0.85,
    roughness: 0.25,
    accent: '#FF5722',
    glow: 'rgba(255, 87, 34, 0.4)',
  },
  gold: {
    color: 0xd4af37,
    metalness: 0.95,
    roughness: 0.18,
    accent: '#fef08a',
    glow: 'rgba(212, 175, 55, 0.45)',
  },
  platinum: {
    color: 0xcccccc,
    metalness: 0.98,
    roughness: 0.15,
    accent: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.4)',
  },
  emerald: {
    color: 0x064e3b,
    metalness: 0.88,
    roughness: 0.22,
    accent: '#10b981',
    glow: 'rgba(16, 185, 129, 0.45)',
  },
};

export const ThreeDCard: React.FC<ThreeDCardProps> = ({
  isFrozen,
  onToggleFreeze,
  spendingLimit,
  monthlySpent,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showCvv, setShowCvv] = useState(false);
  const [finish, setFinish] = useState<CardFinish>('obsidian');

  // Three.js instances ref
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cardGroupRef = useRef<THREE.Group | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const lightRef = useRef<THREE.PointLight | null>(null);
  const targetRotationY = useRef(0);
  const frostParticlesRef = useRef<THREE.Points | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 440;
    const height = 280;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 4.2;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 2.5, 10);
    pointLight.position.set(2, 2, 3);
    scene.add(pointLight);
    lightRef.current = pointLight;

    const fillLight = new THREE.DirectionalLight(0xffeedd, 0.8);
    fillLight.position.set(-3, -2, 2);
    scene.add(fillLight);

    // 5. Card Group
    const cardGroup = new THREE.Group();
    scene.add(cardGroup);
    cardGroupRef.current = cardGroup;

    // Card Body (Credit card standard ratio 85.6mm x 53.98mm ~ 1.586 : 1)
    const cardWidth = 3.2;
    const cardHeight = 2.02;
    const cardDepth = 0.05;

    // Helper to generate rounded box
    const cardGeo = new THREE.BoxGeometry(cardWidth, cardHeight, cardDepth, 8, 8, 2);

    // Dynamic front texture with canvas
    const createFrontTexture = () => {
      const c = document.createElement('canvas');
      c.width = 1024;
      c.height = 646;
      const ctx = c.getContext('2d');
      if (!ctx) return new THREE.CanvasTexture(c);

      // Base gradient
      const bgGrad = ctx.createLinearGradient(0, 0, 1024, 646);
      if (finish === 'obsidian') {
        bgGrad.addColorStop(0, '#1c1f26');
        bgGrad.addColorStop(0.5, '#0e1014');
        bgGrad.addColorStop(1, '#050608');
      } else if (finish === 'gold') {
        bgGrad.addColorStop(0, '#dfba4e');
        bgGrad.addColorStop(0.5, '#b8860b');
        bgGrad.addColorStop(1, '#8b6508');
      } else if (finish === 'platinum') {
        bgGrad.addColorStop(0, '#e2e8f0');
        bgGrad.addColorStop(0.5, '#94a3b8');
        bgGrad.addColorStop(1, '#475569');
      } else {
        bgGrad.addColorStop(0, '#047857');
        bgGrad.addColorStop(0.5, '#064e3b');
        bgGrad.addColorStop(1, '#022c22');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1024, 646);

      // Luxury micro-grid pattern
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 1024; i += 32) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 646);
        ctx.stroke();
      }
      for (let j = 0; j < 646; j += 32) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(1024, j);
        ctx.stroke();
      }

      // Watermark curves
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(880, 500, 240, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(880, 500, 320, 0, Math.PI * 2);
      ctx.stroke();

      // Top Brand: Sanchay Gold Emblem + Wordmark
      const markImg = new Image();
      markImg.src = '/sanchay-mark.png';
      markImg.onload = () => {
        ctx.drawImage(markImg, 60, 52, 40, 50);
        texture.needsUpdate = true;
      };

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 34px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('SANCHAY', 112, 90);

      ctx.fillStyle = '#c5a059';
      ctx.font = '700 13px "JetBrains Mono", monospace';
      ctx.fillText('WORLD ELITE TITANIUM', 114, 114);

      // Contactless icon
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 3;
      for (let r = 1; r <= 3; r++) {
        ctx.beginPath();
        ctx.arc(380, 85, r * 10, -Math.PI / 3, Math.PI / 3);
        ctx.stroke();
      }

      // Metallic EMV Chip
      const chipX = 60;
      const chipY = 180;
      const chipW = 100;
      const chipH = 80;
      const chipGrad = ctx.createLinearGradient(chipX, chipY, chipX + chipW, chipY + chipH);
      chipGrad.addColorStop(0, '#ffe082');
      chipGrad.addColorStop(0.5, '#ffd54f');
      chipGrad.addColorStop(1, '#ffb300');
      ctx.fillStyle = chipGrad;
      ctx.roundRect(chipX, chipY, chipW, chipH, 12);
      ctx.fill();

      // Chip micro circuits
      ctx.strokeStyle = '#b28704';
      ctx.lineWidth = 2;
      ctx.strokeRect(chipX + 16, chipY + 12, chipW - 32, chipH - 24);
      ctx.beginPath();
      ctx.moveTo(chipX + chipW / 2, chipY);
      ctx.lineTo(chipX + chipW / 2, chipY + chipH);
      ctx.moveTo(chipX, chipY + chipH / 2);
      ctx.lineTo(chipX + chipW, chipY + chipH / 2);
      ctx.stroke();

      // Card Number
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 44px "JetBrains Mono", monospace';
      ctx.fillText('••••  ••••  ••••  6782', 60, 360);

      // Cardholder & Expiry
      ctx.font = '600 15px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.fillText('CARDHOLDER', 60, 480);
      ctx.fillText('EXPIRES', 420, 480);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px "JetBrains Mono", monospace';
      ctx.fillText('CODE XR', 60, 520);
      ctx.fillText('09/29', 420, 520);

      // Luxury Mastercard Dual Circles
      ctx.fillStyle = '#ff5f00';
      ctx.beginPath();
      ctx.arc(880, 520, 44, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(235, 0, 27, 0.9)';
      ctx.beginPath();
      ctx.arc(830, 520, 44, 0, Math.PI * 2);
      ctx.fill();

      // Spending limit gauge along bottom edge
      const pct = Math.min(1, monthlySpent / (spendingLimit || 5500));
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(0, 634, 1024, 12);
      const barGrad = ctx.createLinearGradient(0, 0, 1024 * pct, 0);
      barGrad.addColorStop(0, '#ff5722');
      barGrad.addColorStop(1, '#ff9800');
      ctx.fillStyle = barGrad;
      ctx.fillRect(0, 634, 1024 * pct, 12);

      const texture = new THREE.CanvasTexture(c);
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return texture;
    };

    // Back Texture
    const createBackTexture = () => {
      const c = document.createElement('canvas');
      c.width = 1024;
      c.height = 646;
      const ctx = c.getContext('2d');
      if (!ctx) return new THREE.CanvasTexture(c);

      // Base back
      ctx.fillStyle = finish === 'obsidian' ? '#090a0d' : '#1e232a';
      ctx.fillRect(0, 0, 1024, 646);

      // Magnetic Black Stripe
      ctx.fillStyle = '#020202';
      ctx.fillRect(0, 70, 1024, 120);

      // Signature & CVV Panel
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(60, 240, 600, 70);

      // Security lines on strip
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      for (let k = 0; k < 600; k += 16) {
        ctx.beginPath();
        ctx.moveTo(60 + k, 240);
        ctx.lineTo(80 + k, 310);
        ctx.stroke();
      }

      // CVV
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 30px "JetBrains Mono", monospace';
      ctx.fillText(showCvv ? '841' : '•••', 560, 286);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '14px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('SECURITY CODE (CVV)', 680, 282);

      // Hologram sticker
      const holoGrad = ctx.createLinearGradient(780, 360, 920, 500);
      holoGrad.addColorStop(0, '#38bdf8');
      holoGrad.addColorStop(0.33, '#ec4899');
      holoGrad.addColorStop(0.66, '#eab308');
      holoGrad.addColorStop(1, '#10b981');
      ctx.fillStyle = holoGrad;
      ctx.roundRect(780, 360, 150, 110, 10);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px Syne, sans-serif';
      ctx.fillText('SANCHAY', 805, 420);
      ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('AUTHENTIC TITANIUM', 795, 442);

      // Fine print
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '14px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('For authorized corporate signature only. Issued by Sanchay Apex Federal Reserve.', 60, 420);
      ctx.fillText('Customer Support: +1 (800) 555-SANCHAY • vertix.sanchay.finance', 60, 450);

      const texture = new THREE.CanvasTexture(c);
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      return texture;
    };

    const frontTex = createFrontTexture();
    const backTex = createBackTexture();

    const edgeMat = new THREE.MeshStandardMaterial({
      color: finishConfigs[finish].color,
      metalness: finishConfigs[finish].metalness,
      roughness: finishConfigs[finish].roughness,
    });

    const frontMat = new THREE.MeshStandardMaterial({
      map: frontTex,
      metalness: 0.6,
      roughness: 0.35,
    });

    const backMat = new THREE.MeshStandardMaterial({
      map: backTex,
      metalness: 0.5,
      roughness: 0.4,
    });

    // Materials order for BoxGeometry: [right, left, top, bottom, front, back]
    const cardMesh = new THREE.Mesh(cardGeo, [
      edgeMat,
      edgeMat,
      edgeMat,
      edgeMat,
      frontMat,
      backMat,
    ]);
    cardGroup.add(cardMesh);

    // 6. Frost / Freeze Particles Grid
    const particleCount = 180;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let p = 0; p < particleCount * 3; p += 3) {
      positions[p] = (Math.random() - 0.5) * 3.8;
      positions[p + 1] = (Math.random() - 0.5) * 2.6;
      positions[p + 2] = (Math.random() - 0.5) * 0.4;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x67e8f9,
      size: 0.05,
      transparent: true,
      opacity: isFrozen ? 0.85 : 0,
    });
    const frostParticles = new THREE.Points(particleGeo, particleMat);
    cardGroup.add(frostParticles);
    frostParticlesRef.current = frostParticles;

    // Mouse movement listener
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseRef.current.targetX = x * 0.45;
      mouseRef.current.targetY = y * 0.35;
    };

    const handleMouseLeave = () => {
      mouseRef.current.targetX = 0;
      mouseRef.current.targetY = 0;
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);

    // Animation loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      // Smooth inertia rotation
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.1;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.1;

      // Flip interpolation
      const currentY = cardGroup.rotation.y;
      cardGroup.rotation.y += (targetRotationY.current + mouseRef.current.x - currentY) * 0.08;
      cardGroup.rotation.x += (-mouseRef.current.y - cardGroup.rotation.x) * 0.08;

      // Dynamic light tracking
      if (lightRef.current) {
        lightRef.current.position.x = mouseRef.current.x * 4;
        lightRef.current.position.y = mouseRef.current.y * 4;
      }

      // Freeze particle float
      if (frostParticlesRef.current && isFrozen) {
        frostParticlesRef.current.rotation.z += 0.005;
        const pos = frostParticlesRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 1; i < pos.length; i += 3) {
          pos[i] += Math.sin(Date.now() * 0.003 + i) * 0.001;
        }
        frostParticlesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };
    animate();

    // Resize observer
    const resizeObserver = new ResizeObserver(() => {
      if (!container || !rendererRef.current) return;
      const newWidth = container.clientWidth;
      camera.aspect = newWidth / height;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, height);
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      resizeObserver.disconnect();
      renderer.dispose();
      frontTex.dispose();
      backTex.dispose();
      cardGeo.dispose();
    };
  }, [finish, isFrozen, showCvv, spendingLimit, monthlySpent]);

  // Flip trigger
  const handleFlipCard = () => {
    sound.flip();
    const nextFlipped = !isFlipped;
    setIsFlipped(nextFlipped);
    targetRotationY.current = nextFlipped ? Math.PI : 0;
  };

  const handleToggleFreezeAction = () => {
    sound.laser();
    onToggleFreeze();
  };

  const handleToggleCvv = () => {
    sound.click();
    setShowCvv(!showCvv);
  };

  return (
    <div className="card-studio-container">
      {/* 3D Canvas Viewport */}
      <div className="relative group perspective-1000 cursor-grab active:cursor-grabbing">
        <div
          ref={mountRef}
          className="card-3d-viewport w-full h-[280px] flex items-center justify-center transition-all duration-300"
        />

        {/* Live Status Badges */}
        <div className="absolute top-3 left-4 flex items-center gap-2 pointer-events-none">
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider backdrop-blur-md flex items-center gap-1.5 ${
              isFrozen
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}
          >
            {isFrozen ? (
              <>
                <Snowflake size={12} className="animate-spin" /> FROZEN
              </>
            ) : (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> ACTIVE
              </>
            )}
          </span>
          <span className="card-visa-badge px-2 py-0.5 rounded-full text-xs font-medium text-slate-400 bg-black/40 backdrop-blur-md border border-white/5">
            VISA INFINITE
          </span>
        </div>

        {/* Interactive Tilt Hint */}
        <div className="card-webgl-hint absolute bottom-2 left-1/2 -translate-x-1/2 text-[11px] text-slate-400 opacity-60 group-hover:opacity-100 transition-opacity flex items-center gap-1 pointer-events-none">
          <Sparkles size={11} className="text-amber-400" />
          <span>Interactive 3D WebGL • Move cursor to tilt</span>
        </div>
      </div>

      {/* Card Finish Material Selector */}
      <div className="mt-4 flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-slate-400 mr-1">Finish:</span>
          {(['obsidian', 'gold', 'platinum', 'emerald'] as CardFinish[]).map((f) => (
            <button
              key={f}
              onClick={() => {
                sound.click();
                setFinish(f);
              }}
              title={f.toUpperCase()}
              className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center ${
                finish === f
                  ? 'border-white scale-110 shadow-lg'
                  : 'border-transparent opacity-70 hover:opacity-100'
              }`}
              style={{
                background:
                  f === 'obsidian'
                    ? '#111317'
                    : f === 'gold'
                    ? '#d4af37'
                    : f === 'platinum'
                    ? '#94a3b8'
                    : '#047857',
              }}
            />
          ))}
        </div>

        {/* Quick Flip Button */}
        <button
          onClick={handleFlipCard}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: 700,
            padding: '7px 16px',
            borderRadius: '9999px',
            backgroundColor: 'var(--bg-pill)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-main)',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <RotateCw size={13} className={isFlipped ? 'rotate-180 transition-transform' : ''} />
          <span>{isFlipped ? 'Show Front' : 'Flip Card'}</span>
        </button>
      </div>

      {/* Primary Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '18px' }}>
        <button
          onClick={handleToggleFreezeAction}
          className={`card-action-tile ${isFrozen ? 'frozen' : ''}`}
        >
          <Snowflake
            size={18}
            className={`transition-transform ${isFrozen ? 'text-cyan-400 rotate-180' : 'text-slate-400'}`}
          />
          <span style={{ fontSize: '12px', fontWeight: 700 }}>{isFrozen ? 'Unfreeze' : 'Freeze Card'}</span>
        </button>

        <button
          onClick={handleToggleCvv}
          className="card-action-tile"
        >
          {showCvv ? <EyeOff size={18} style={{ color: 'var(--accent-orange)' }} /> : <Eye size={18} style={{ color: 'var(--text-muted)' }} />}
          <span style={{ fontSize: '12px', fontWeight: 700 }}>{showCvv ? 'Hide CVV' : 'Reveal CVV'}</span>
        </button>

        <button
          onClick={() => {
            sound.click();
            navigator.clipboard.writeText('4532 8921 6782 9014');
            sound.success();
            alert('Card number copied to clipboard securely!');
          }}
          className="card-action-tile"
        >
          <CreditCard size={18} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '12px', fontWeight: 700 }}>Copy Number</span>
        </button>
      </div>
    </div>
  );
};
