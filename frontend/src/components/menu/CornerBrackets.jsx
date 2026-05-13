import React from 'react';

// SVG L-shaped corner brackets positioned at the four corners of the menu.
export default function CornerBrackets({ compact }) {
  const sz = compact ? 22 : 36;
  const inset = compact ? 8 : 16;
  const wrap = (pos) => ({ position: 'absolute', ...pos, width: sz, height: sz, pointerEvents: 'none', zIndex: 2 });
  const corner = (flip) => (
    <svg width={sz} height={sz} viewBox="0 0 36 36" fill="none"
      style={{ transform: `scale(${flip.x ? -1 : 1}, ${flip.y ? -1 : 1})` }}>
      <polyline points="36,2 2,2 2,36" stroke="#7c3aed" strokeWidth="1.5" opacity="0.8"/>
      <polyline points="36,2 2,2 2,36" stroke="#a855f7" strokeWidth="0.5" opacity="0.5"/>
    </svg>
  );
  return (
    <>
      <div style={wrap({ top: inset,    left: inset })}> {corner({ x: false, y: false })}</div>
      <div style={wrap({ top: inset,    right: inset })}>{corner({ x: true,  y: false })}</div>
      <div style={wrap({ bottom: inset, left: inset })}> {corner({ x: false, y: true  })}</div>
      <div style={wrap({ bottom: inset, right: inset })}>{corner({ x: true,  y: true  })}</div>
    </>
  );
}
