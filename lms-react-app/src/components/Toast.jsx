import { useEffect } from 'react';

export default function Toast({ message, onHide }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onHide, 2800);
    return () => clearTimeout(t);
  }, [message, onHide]);

  if (!message) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
      background: '#21262d', border: '1px solid var(--border)', color: 'var(--text)',
      padding: '8px 18px', borderRadius: 20, fontSize: 12, zIndex: 9998,
      pointerEvents: 'none', animation: 'fadeIn .3s',
    }}>
      {message}
    </div>
  );
}
