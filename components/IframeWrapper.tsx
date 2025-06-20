// components/IframeWrapper.tsx

import React, { useEffect, useRef } from 'react';

type ParentMessageHandler = (data: any) => void;

interface IframeWrapperProps {
  /** HTML string bootstrapping the Phaser game */
  srcDoc: string;
  /** Data to post to the iframe once it loads */
  postMessageData?: any;
  /** Handler for messages coming from the iframe */
  onMessage: ParentMessageHandler;
  /** Optional sizing */
  width?: string | number;
  height?: string | number;
}

const IframeWrapper: React.FC<IframeWrapperProps> = ({
  srcDoc,
  postMessageData,
  onMessage,
  width = '100%',
  height = '100%',
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Listen for messages from iframe → parent
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // TODO: validate event.origin if needed
      onMessage(event.data);
    };
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [onMessage]);

  // Once iframe loads, send initial data parent → iframe
  useEffect(() => {
    const iframeEl = iframeRef.current;
    if (!iframeEl) return;
    const handleLoad = () => {
      if (postMessageData && iframeEl.contentWindow) {
        iframeEl.contentWindow.postMessage(postMessageData, '*');
      }
    };
    iframeEl.addEventListener('load', handleLoad);
    return () => {
      iframeEl.removeEventListener('load', handleLoad);
    };
  }, [postMessageData]);

  return (
    <iframe
      ref={iframeRef}
      srcDoc={srcDoc}
      width={width}
      height={height}
      sandbox="allow-scripts allow-same-origin"
      style={{ border: 'none' }}
    />
  );
};

export default IframeWrapper;
