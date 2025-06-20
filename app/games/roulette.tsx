// app/games/roulette/Roulette.tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import IframeWrapper from '../../components/IframeWrapper';

export default function Roulette() {
  const [html, setHtml] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Handle messages from the iframe
  const handleMessage = useCallback((data: any) => {
    if (data.type === 'LOADED') {
      // Send INIT once iframe signals readiness
      iframeRef.current?.contentWindow?.postMessage(
        { type: 'INIT', payload: { betSize: 100, currency: 'USD' } },
        '*'
      );
    } else if (data.type === 'RESULT') {
      console.log('Bet result:', data.payload);
      // TODO: dispatch to store or update UI with result
    }
  }, []);

  // Fetch iframe template on mount
  useEffect(() => {
    fetch('/iframe-template.html')
      .then((res) => res.text())
      .then((text) => {
        setHtml(text);
        setLoading(false);
      })
      .catch((err) => console.error('Error loading iframe template:', err));
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>Loading game...</div>
    );
  }

  return (
    <IframeWrapper
      ref={iframeRef}
      srcDoc={html}
      onMessage={handleMessage}
      width="100%"
      height={600}
    />
  );
}
