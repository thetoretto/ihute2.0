import { useState } from 'react';
import { APP_STORE_URL, PLAY_STORE_URL } from '../constants/contact';
import { IconPhone } from './Icons';

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isAndroid(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Android/i.test(navigator.userAgent);
}

export default function AppDownload() {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 9) {
      setMessage({ type: 'error', text: 'Please enter a valid phone number.' });
      return;
    }
    setMessage(null);

    const isIos = isIOS();
    const isAnd = isAndroid();
    const url = isIos ? APP_STORE_URL : isAnd ? PLAY_STORE_URL : PLAY_STORE_URL;
    window.open(url, '_blank', 'noopener,noreferrer');
    setMessage({
      type: 'success',
      text: isIos || isAnd
        ? 'Opening app store… If it didn\'t open, use the links in the footer.'
        : 'Opening app store… If it didn\'t open, use the links in the footer.',
    });
  }

  return (
    <section className="lp-section download-section-bbc">
      <div className="lp-container">
        <div className="download-strip download-strip-bbc">
          <div className="download-copy download-copy-bbc">
            <IconPhone className="download-strip-icon" aria-hidden />
            <h2>Let&apos;s go. Get a link to download the app</h2>
            <p className="download-strip-sub">Enter your number and we&apos;ll send you the store link.</p>
          </div>

          <form className="download-actions download-actions-bbc" onSubmit={handleSubmit}>
            <input
              type="tel"
              placeholder="Enter your phone number"
              value={phone}
              onChange={(event) => {
                setPhone(event.target.value);
                setMessage(null);
              }}
            />
            <button type="submit">GET THE LINK</button>
          </form>

          {message?.type === 'error' && <p className="download-error">{message.text}</p>}
          {message?.type === 'success' && <p className="download-success">{message.text}</p>}
        </div>
      </div>
    </section>
  );
}
