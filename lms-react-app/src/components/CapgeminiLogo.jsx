// Capgemini brand mark + wordmark
// Primary brand colour: #0070AD

export function CapgeminiMark({ size = 36 }) {
  // The Capgemini logo is a tilted square (diamond orientation)
  // with a concentric inner outline, in Capgemini blue.
  const half = size / 2;
  const outer = size * 0.46;
  const mid   = size * 0.30;
  const inner = size * 0.14;

  function diamond(r) {
    return `M ${half},${half - r} L ${half + r},${half} L ${half},${half + r} L ${half - r},${half} Z`;
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} fill="none">
      <path d={diamond(outer)} fill="#0070AD" />
      <path d={diamond(mid)}   fill="white"   />
      <path d={diamond(inner)} fill="#0070AD" />
    </svg>
  );
}

export function CapgeminiWordmark({ markSize = 32, fontSize = 20, gap = 10 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap }}>
      <CapgeminiMark size={markSize} />
      <span style={{
        fontSize,
        fontWeight: 700,
        color: '#0070AD',
        letterSpacing: '-0.3px',
        lineHeight: 1,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        Capgemini
      </span>
    </div>
  );
}
