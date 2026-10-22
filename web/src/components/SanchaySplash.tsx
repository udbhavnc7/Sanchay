import { useCallback, useEffect, useRef, useState } from 'react';
import creatorStudioHtml from '../splash/creator-studio-intro';
import { MetalAction } from './MetalAction';
import { SANCHAY_MARK } from './sanchayMarkSvg';

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img
            src="/sanchay-mark.png"
            alt="Sanchay Polestar"
            style={{ width: '20px', height: '25px', objectFit: 'contain' }}
          />
          <span className="sanchay-splash__kicker">Sanchay / Private finance</span>
        </div>
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
