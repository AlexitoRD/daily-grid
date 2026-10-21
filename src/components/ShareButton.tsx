import { useState } from 'react';
import { shareMessage, shareText } from '../lib/share';
import styles from './ShareButton.module.css';

interface Props {
  // The full text to share, usually from buildShareText
  text: string;
}

export default function ShareButton({ text }: Props) {
  const [message, setMessage] = useState('');

  async function onClick() {
    setMessage('');
    setMessage(shareMessage(await shareText(text)));
  }

  return (
    <div className={styles.share}>
      <button type="button" className={styles.button} onClick={onClick}>
        Share
      </button>
      {/* Always rendered so screen readers announce changes to it */}
      <p className={styles.message} role="status" data-testid="share-message">
        {message}
      </p>
    </div>
  );
}
