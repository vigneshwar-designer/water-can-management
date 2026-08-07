import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

const QRCodeImage = ({ value, size = 100, className = '' }) => {
  const [src, setSrc] = useState('');

  useEffect(() => {
    if (!value) return;
    
    QRCode.toDataURL(value, { 
      width: size, 
      margin: 1,
      color: {
        dark: '#1e293b',  // Slate 800 for high contract print
        light: '#ffffff'
      }
    })
      .then(url => setSrc(url))
      .catch(err => console.error('Error generating QR code:', err));
  }, [value, size]);

  return src ? (
    <img 
      src={src} 
      alt={`QR Code for ${value}`} 
      className={`object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  ) : (
    <div 
      className={`animate-pulse bg-slate-100 rounded-lg ${className}`} 
      style={{ width: size, height: size }}
    />
  );
};

export default QRCodeImage;
