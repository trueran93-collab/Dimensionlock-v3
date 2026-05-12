import React, { useEffect, useState } from 'react';

export default function BossWarning({ floor }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 200);
    const t2 = setTimeout(() => setPhase(2), 800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const bossNames = ['The Lurker\'s Shadow', 'Void Harbinger', 'Dimensional Plague', 'The Endless Warden'];
  const bossName = bossNames[Math.floor((floor - 1) / 5) % bossNames.length];

  return (
    <div
      data-testid="boss-warning"
      style={{
        position: 'absolute', inset: 0,
        background: 'rgba(10,0,0,0.96)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Cormorant Garamond', serif",
        overflow: 'hidden'
      }}
    >
      {/* Flashing red border */}
      <div style={{
        position: 'absolute', inset: 0,
        border: '4px solid #ff3366',
        boxShadow: 'inset 0 0 60px rgba(255,51,102,0.3), 0 0 30px rgba(255,51,102,0.5)',
        animation: 'boss-flash 0.5s ease-in-out infinite alternate',
        pointerEvents: 'none'
      }} />

      {/* Warning text */}
      <div style={{
        opacity: phase >= 1 ? 1 : 0,
        transform: phase >= 1 ? 'none' : 'translateY(-20px)',
        transition: 'all 0.4s ease'
      }}>
        <p style={{
          color: '#ff3366', fontSize: 12, letterSpacing: '0.7em',
          textTransform: 'uppercase', textAlign: 'center', marginBottom: 20,
          fontFamily: "'JetBrains Mono', monospace",
          textShadow: '0 0 20px #ff3366',
          animation: 'pulse-warning 0.8s ease-in-out infinite'
        }}>
          !! WARNING !!
        </p>

        <h1 style={{
          color: '#fff', fontSize: 'clamp(2rem, 6vw, 5rem)',
          fontWeight: 700, textAlign: 'center', margin: '0 0 12px',
          textShadow: '0 0 40px #ff3366, 0 0 80px #ff000044',
          letterSpacing: '0.05em',
          animation: 'boss-shake 0.1s ease-in-out infinite alternate'
        }}>
          LURKER APPROACHES
        </h1>
      </div>

      {/* Boss name */}
      <div style={{
        opacity: phase >= 2 ? 1 : 0,
        transform: phase >= 2 ? 'none' : 'translateY(20px)',
        transition: 'all 0.5s ease 0.3s',
        textAlign: 'center', marginTop: 24
      }}>
        <div style={{
          width: 120, height: 1, background: '#ff3366', margin: '0 auto 20px',
          boxShadow: '0 0 10px #ff3366'
        }} />
        <p style={{
          color: '#ff3366', fontSize: 'clamp(1rem, 2.5vw, 1.5rem)',
          letterSpacing: '0.2em', textTransform: 'uppercase',
          textShadow: '0 0 15px #ff3366'
        }}>
          {bossName}
        </p>
        <p style={{
          color: '#ffffff55', fontSize: 12, marginTop: 12,
          fontFamily: "'Outfit', sans-serif", fontStyle: 'italic'
        }}>
          Floor {floor} — The Lurker's Servant descends...
        </p>
      </div>

      {/* Atmospheric orbs */}
      {[...Array(8)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: `${30 + i * 15}px`,
          height: `${30 + i * 15}px`,
          borderRadius: '50%',
          background: 'radial-gradient(circle, #ff336622 0%, transparent 70%)',
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animation: `float-boss ${2 + i * 0.4}s ease-in-out infinite alternate`,
          pointerEvents: 'none'
        }} />
      ))}

      <style>{`
        @keyframes boss-flash { from { box-shadow: inset 0 0 60px rgba(255,51,102,0.2), 0 0 20px rgba(255,51,102,0.4); } to { box-shadow: inset 0 0 100px rgba(255,51,102,0.5), 0 0 50px rgba(255,51,102,0.8); } }
        @keyframes pulse-warning { 0%, 100% { opacity: 0.7; } 50% { opacity: 1; } }
        @keyframes boss-shake { from { transform: translateX(-1px); } to { transform: translateX(1px); } }
        @keyframes float-boss { from { transform: translateY(-10px) scale(0.9); opacity: 0.3; } to { transform: translateY(10px) scale(1.1); opacity: 0.7; } }
      `}</style>
    </div>
  );
}
