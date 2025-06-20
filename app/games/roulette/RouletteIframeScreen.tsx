// app/games/RouletteIframeScreen.tsx
import React, { useCallback, useEffect, useState } from 'react';
import IframeWrapper from '../../../components/IframeWrapper';

const ROULETTE_HTML_PATH = '/iframe-template.html';

const RouletteIframeScreen: React.FC = () => {
  const [template, setTemplate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);

  // Fetch the iframe HTML template on mount
  useEffect(() => {
    fetch(ROULETTE_HTML_PATH)
      .then((res) => res.text())
      .then((html) => {
        setTemplate(html);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load iframe template', err);
      });
  }, []);

  // Handler for messages from iframe → parent
  const handleIframeMessage = useCallback((data: any) => {
    if (data.type === 'LOADED') {
      console.log('Iframe loaded and ready');
      return;
    }
    if (data.type === 'RESULT') {
      setResult(data.payload);
      // TODO: dispatch to store or update UI accordingly
      console.log('Bet result:', data.payload);
    }
  }, []);

  // Example bet parameters; replace with actual props or context
  const betSize = 100;
  const currency = 'USD';
  const initMessage = { type: 'INIT', payload: { betSize, currency } };

  if (loading) {
    return <LoadingView />;
  }

  return (
    <IframeWrapper
      srcDoc={template}
      postMessageData={initMessage}
      onMessage={handleIframeMessage}
      width="100%"
      height={600}
    />
  );
};

// Simple loading component
const LoadingView: React.FC = () => (
  <div style={{ padding: 20, textAlign: 'center' }}>Loading game...</div>
);

export default RouletteIframeScreen;
