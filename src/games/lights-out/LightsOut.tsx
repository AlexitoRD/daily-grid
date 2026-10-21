import { useMemo, useReducer, useState } from 'react';
import ShareButton from '../../components/ShareButton';
import { buildShareText } from '../../lib/share';
import { createHandlers } from './controls';
import {
  cellLabel,
  dailyPuzzle,
  gameReducer,
  initGame,
  isSolved,
  movesText,
  shareLines,
} from './logic';
import styles from './LightsOut.module.css';

interface Props {
  // Defaults to now. The page renders this only in the browser so it follows
  // the visitor's local day.
  date?: Date;
}

export default function LightsOut({ date }: Props) {
  // Fixed on first render so the puzzle and the shared date always match.
  const [today] = useState(() => date ?? new Date());
  const [state, dispatch] = useReducer(gameReducer, today, (d) =>
    initGame(dailyPuzzle(d)),
  );
  const handlers = useMemo(() => createHandlers(dispatch), []);
  const solved = isSolved(state.grid);

  return (
    <div className={styles.game}>
      <div
        className={styles.board}
        role="group"
        aria-label="Lights Out board"
        aria-describedby="lights-out-help"
        onClick={handlers.onClick}
        onKeyDown={handlers.onKeyDown}
      >
        {state.grid.map((on, i) => (
          <button
            key={i}
            type="button"
            className={`${styles.cell} ${on ? styles.on : styles.off}`}
            data-index={i}
            aria-label={cellLabel(i, on)}
            aria-pressed={on}
            tabIndex={i === state.focus ? 0 : -1}
          >
            <span className={styles.light} aria-hidden="true" />
          </button>
        ))}
      </div>

      <p id="lights-out-help" className={styles.help}>
        Use the arrow keys to move and Enter or Space to press.
      </p>

      <div className={styles.status}>
        <p data-testid="lights-out-moves">Moves: {state.moves}</p>
        <button
          type="button"
          className={styles.reset}
          onClick={handlers.onReset}
        >
          Reset
        </button>
      </div>

      <p
        className={styles.message}
        role="status"
        data-testid="lights-out-solved"
      >
        {solved ? `Solved in ${movesText(state.moves)}!` : ''}
      </p>

      {solved && (
        <ShareButton
          text={buildShareText({
            game: 'Lights Out',
            date: today,
            lines: shareLines(state.moves),
            // The page URL without any query or hash. Only rendered in the
            // browser, once solved.
            url: window.location.origin + window.location.pathname,
          })}
        />
      )}
    </div>
  );
}
