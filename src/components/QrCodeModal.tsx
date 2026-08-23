import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Smartphone, Copy, Check, Wifi } from 'lucide-react';

interface QrCodeModalProps {
  onClose: () => void;
  onShowToast: (message: string, icon?: string) => void;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({ onClose, onShowToast }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  // Network IP URL
  const mobileUrl = 'http://192.168.0.150:5173/';

  useEffect(() => {
    QRCode.toDataURL(mobileUrl, {
      width: 240,
      margin: 2,
      color: {
        dark: '#00f0ff',
        light: '#0b111e',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Error generating QR', err));
  }, [mobileUrl]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(mobileUrl);
      setCopied(true);
      onShowToast('Mobile URL copied!', '📋');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      onShowToast('Could not copy link', '⚠️');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(0, 240, 255, 0.15)',
          color: 'var(--accent-cyan)',
          border: '1px solid rgba(0, 240, 255, 0.4)',
          borderRadius: 999,
          padding: '4px 12px',
          fontSize: 12,
          fontWeight: 700,
          marginBottom: 12,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}>
          <Smartphone size={14} /> Play on Your Phone
        </div>

        <h2 className="modal-title" style={{ justifyContent: 'center', marginBottom: 8 }}>
          Scan to Play on Mobile
        </h2>

        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 18 }}>
          Open your phone camera or QR scanner while connected to your Wi-Fi to test the mobile experience with touch haptics.
        </p>

        {/* QR Code Frame */}
        <div style={{
          background: '#0b111e',
          padding: '16px',
          borderRadius: 'var(--radius-md)',
          border: '2px solid var(--accent-cyan)',
          display: 'inline-block',
          marginBottom: 16,
          boxShadow: '0 0 25px var(--accent-cyan-glow)',
        }}>
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="Mobile QR Code" style={{ display: 'block', width: 200, height: 200, borderRadius: 8 }} />
          ) : (
            <div style={{ width: 200, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
              Generating QR Code...
            </div>
          )}
        </div>

        {/* Wi-Fi & URL Info Box */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '12px',
          marginBottom: 16,
          textAlign: 'left',
          fontSize: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#34d399', fontWeight: 700, marginBottom: 6 }}>
            <Wifi size={14} /> Same Wi-Fi Network Required
          </div>
          <div style={{ color: 'var(--text-secondary)', marginBottom: 8 }}>
            Direct mobile address:
          </div>
          <div style={{
            background: 'var(--bg-elevated)',
            padding: '8px 10px',
            borderRadius: 6,
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--accent-cyan)',
            wordBreak: 'break-all',
          }}>
            {mobileUrl}
          </div>
        </div>

        {/* Copy Button */}
        <button
          className="hero-cta-btn"
          onClick={handleCopy}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          <span>{copied ? 'Link Copied!' : 'Copy Mobile Address'}</span>
        </button>
      </div>
    </div>
  );
};
