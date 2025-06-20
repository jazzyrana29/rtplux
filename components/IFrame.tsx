// components/IFrame.tsx

import React, { forwardRef, ReactNode } from 'react';
import { Platform, StyleProp, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';
import type { renderToStaticMarkup } from 'react-dom/server';

interface IFrameProps {
  /** React‐JSX children that will be serialized into the iframe’s HTML. */
  children: ReactNode;

  /** Optional style for the outer iframe/WebView container (e.g., width, height). */
  style?: StyleProp<ViewStyle>;

  /** Called when the iframe (web) or WebView (native) has finished loading its content. */
  onLoad?: () => void;

  /**
   * Only allow postMessage events coming from this exact origin.
   * (Defaults to the parent window’s origin.)
   */
  allowedOrigin?: string;
}

/**
 * Secure IFrame component:
 *  • On web: renders a real <iframe> with
 *      – a relaxed CSP meta tag (allowing inline-script/style),
 *      – sandbox="allow-scripts allow-same-origin",
 *      – an inline sanitizer for window.postMessage,
 *      – and a basic in-iframe debug console (hidden by default).
 *  • On iOS/Android: renders a <WebView> with the same HTML + CSP,
 *      and sanitizes messages in the onMessage callback.
 *
 * Wrapped in forwardRef so parents can do <IFrame ref={iframeRef} />
 * and get the underlying <iframe> (web) or <WebView> (native) handle.
 */
export const IFrame = forwardRef<HTMLIFrameElement, IFrameProps>(
  (
    { children, style, onLoad, allowedOrigin = window.location.origin },
    forwardedRef
  ) => {
    // Dynamically import ReactDOMServer so we can call renderToStaticMarkup
    const ReactDOMServer = require('react-dom/server') as {
      renderToStaticMarkup: typeof renderToStaticMarkup;
    };

    // 1) Serialize React children into a plain HTML string
    const innerHTML = ReactDOMServer.renderToStaticMarkup(<>{children}</>);

    // 2) Wrap that string in minimal HTML, injecting CSP, postMessage sanitizer,
    //    and a basic in-iframe debug console (hidden by default).
    const fullHtml = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <!--
            Relaxed Content Security Policy (via <meta>):
            • default-src 'none';                → block everything by default
            • script-src 'self' 'unsafe-inline'; → allow inline <script>
            • style-src 'self' 'unsafe-inline';  → allow inline <style>
            • img-src 'self' data:;              → allow same‐origin images or data URIs
            • connect-src 'self';                → block XHR/fetch to external
            (Note: frame-ancestors must be set via HTTP header if needed.)
          -->
          <meta http-equiv="Content-Security-Policy"
              content="
                default-src 'none';
                script-src 'self' 'unsafe-inline' https://unpkg.com;
                script-src-elem 'self' 'unsafe-inline' https://unpkg.com;
                style-src 'self' 'unsafe-inline';
                img-src 'self' data:;
                connect-src 'self' https://app.posthog.com;
              " />

          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Secure IFrame Content</title>

          <!-- Inline style for the debug console (hidden by default) -->
          <style>
            body { margin: 0; padding: 0; overflow: hidden; }
            /* Debug console styles */
            #debug-console {
              display: none;
              position: absolute;
              top: 10px;
              left: 10px;
              width: 320px;
              max-height: 480px;
              background: rgba(0, 0, 0, 0.85);
              color: #0f0;
              font-family: monospace;
              font-size: 14px;
              padding: 8px;
              overflow-y: auto;
              border: 2px solid #0f0;
              z-index: 9999;
            }
            #debug-console pre {
              white-space: pre-wrap;
              margin: 0;
            }
            #debug-console input {
              width: 100%;
              margin-top: 6px;
              background: #111;
              color: #0f0;
              border: 1px solid #0f0;
              padding: 4px;
            }
          </style>

          <!-- Inline script to sanitize postMessage and toggle the debug console -->
         <!-- PostHog analytics inside the iframe -->
        
        <script>
        
            (function() {
              const TRUSTED_ORIGIN = "${allowedOrigin}";
              // 1) Sanitize incoming postMessage from parent:
              window.addEventListener("message", function(event) {
                if (event.origin !== TRUSTED_ORIGIN) return;
                const data = event.data;
                if (
                  typeof data === "object" &&
                  data !== null &&
                  typeof data.type === "string" &&
                  /^[a-zA-Z0-9_]+$/.test(data.type)
                ) {
                  window.dispatchEvent(new CustomEvent("iframe:safeMessage", { detail: data }));
                }
              });

              // 2) Delay debug console creation until the <body> exists:
              window.addEventListener("DOMContentLoaded", function() {
                let debugVisible = false;
                const consoleDiv = document.createElement("div");
                consoleDiv.id = "debug-console";

                // Output area
                const outputPre = document.createElement("pre");
                outputPre.id = "console-output";
                consoleDiv.appendChild(outputPre);

                // Input box
                const inputBox = document.createElement("input");
                inputBox.id = "console-input";
                inputBox.placeholder = "Type command and press Enter…";
                consoleDiv.appendChild(inputBox);

                // Now that <body> is ready, append the consoleDiv:
                document.body.appendChild(consoleDiv);
                console.log("Debug console appended")

                // inside your DOMContentLoaded callback
                console.log("Adding keydown listener");
                window.addEventListener("keydown", function(e) {
                  console.log("keydown event:", e.key, "shift?", e.shiftKey);
                  if (e.ctrlKey && e.key.toLowerCase() === "\`") {
                    debugVisible = !debugVisible;
                    consoleDiv.style.display = debugVisible ? "block" : "none";
                    if (debugVisible) inputBox.focus();
                  }
                });

                
                console.log("Event lisnter for debus console is added")
                // Basic command parser on Enter
                inputBox.addEventListener("keydown", function(e) {
                    if (e.key === "Enter") {
                        const cmd = inputBox.value.trim();
                        inputBox.value = "";
        
                        let resultText = "";
                        if (cmd === "dumpState()") {
                            const state = window.gameState || { error: "No gameState found" };
                            resultText = JSON.stringify(state, null, 2);
                        } else if (cmd === "resetLevel()") {
                            if (window.gameInstance && window.gameInstance.scene) {
                                window.gameInstance.scene.restart();
                                resultText = "Scene restarted";
                            } else {
                                resultText = "No gameInstance available";
                            }
                        } else {
                            resultText = "Unknown command: " + cmd;
                        }
        
                        outputPre.innerText += resultText + "\\n\\n";
                        outputPre.scrollTop = outputPre.scrollHeight;
                    }
                });
    });
              
              
})();
</script>
</head>
<body>
${innerHTML}
</body>
</html>
`.trim();

    // 3) Render differently on web vs. native
    if (Platform.OS === 'web') {
      return (
        <iframe
          ref={forwardedRef as React.Ref<HTMLIFrameElement>}
          sandbox="allow-scripts allow-same-origin"
          srcDoc={fullHtml}
          className="w-full h-full border-0"
          style={style as any}
          onLoad={onLoad}
        />
      );
    }

    return (
      <WebView
        ref={forwardedRef as any}
        originWhitelist={['*']}
        source={{ html: fullHtml }}
        style={style}
        onLoadEnd={onLoad}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (
              data &&
              typeof data === 'object' &&
              typeof data.type === 'string' &&
              /^[a-zA-Z0-9_]+$/.test(data.type)
            ) {
              window.dispatchEvent(
                new CustomEvent('iframe:safeMessage', { detail: data })
              );
            }
          } catch {
            // ignore invalid messages
          }
        }}
      />
    );
  }
);

IFrame.displayName = 'IFrame';
