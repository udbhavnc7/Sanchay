import { useCallback, useEffect, useRef, useState } from 'react';
import creatorStudioHtml from '../splash/creator-studio-intro';
import { MetalAction } from './MetalAction';

const SANCHAY_MARK = `<svg viewBox="0 0 24 24" aria-hidden="true">
  <circle cx="12" cy="12" r="10.4" fill="none" stroke="currentColor" stroke-width="1.3" opacity=".55"/>
  <path d="M16.55 8.35c-.78-1.08-2.1-1.7-3.82-1.7-2.55 0-4.18 1.28-4.18 3.16 0 4.18 8.38 1.88 8.38 5.77 0 1.98-1.9 3.36-4.7 3.36-2.15 0-3.9-.82-4.82-2.26" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>
</svg>`;

const SANCHAY_SPLASH_HTML = (() => {
  let html = creatorStudioHtml.replaceAll('Creator Studio', 'Sanchay');
  const markStart = html.indexOf("var APPLE='");
  const wordmarkStart = html.indexOf('function makeWordmark', markStart);

  if (markStart !== -1 && wordmarkStart !== -1) {
    html = `${html.slice(0, markStart)}var APPLE=${JSON.stringify(SANCHAY_MARK)};\n\n  ${html.slice(
      wordmarkStart
    )}`;
  }

  const holdScript = `<script>
(function () {
  var held = false;
  var attempts = 0;
  function hold() {
    if (held) return;
    if (typeof window.__seek !== 'function') {
      if (attempts++ < 24) setTimeout(hold, 100);
      return;
    }
    held = true;
    window.__seek(1.68);
  }
  setTimeout(hold, 1950);
})();
</script>`;

  return html.replace('</body>', `${holdScript}</body>`);
})();

interface SanchaySplashProps {
  onEnter: () => void;
}

export function SanchaySplash({ onEnter }: SanchaySplashProps) {
  const [exiting, setExiting] = useState(false);
  const exitingRef = useRef(false);

  const finish = useCallback(() => {
    if (exitingRef.current) return;
    exitingRef.current = true;
    setExiting(true);
    window.setTimeout(onEnter, 520);
  }, [onEnter]);

  useEffect(() => {
    const timer = window.setTimeout(finish, 7000);
    return () => window.clearTimeout(timer);
  }, [finish]);

  return (
    <div
      className={`sanchay-splash${exiting ? ' is-exiting' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Sanchay intro"
    >
      <iframe
        className="sanchay-splash__frame"
        title="Sanchay wordmark intro"
        srcDoc={SANCHAY_SPLASH_HTML}
        loading="eager"
        style={{ width: '100%', height: '100%' }}
      />

      <div className="sanchay-splash__top">
        <span className="sanchay-splash__kicker">Sanchay / Private finance</span>
        <button type="button" className="sanchay-splash__skip" onClick={finish}>
          Skip intro
        </button>
      </div>

      <p className="sanchay-splash__tagline">Personal finance, privately.</p>

      <div className="sanchay-splash__action">
        <MetalAction
          className="metal-action--splash"
          text="Enter Sanchay"
          onClick={finish}
        />
        <span className="sanchay-splash__hint">Private by design · Local by default</span>
      </div>
    </div>
  );
}
