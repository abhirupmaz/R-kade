import React, { useRef } from 'react';
import { Delete } from 'lucide-react';
import { LetterStatus } from '../../types';
import { sound } from '../../services/audio';
import { haptics } from '../../services/haptics';

interface KeyboardProps {
  keyStatuses: { [key: string]: LetterStatus };
  onChar: (char: string) => void;
  onDelete: () => void;
  onEnter: () => void;
  disabled?: boolean;
}

const KEYBOARD_ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE'],
];

export const Keyboard: React.FC<KeyboardProps> = ({
  keyStatuses,
  onChar,
  onDelete,
  onEnter,
  disabled = false,
}) => {
  const lastActionTimeRef = useRef<number>(0);

  const handleAction = (key: string) => {
    const now = Date.now();
    // Guard against rapid duplicate synthetic touch+click events (<150ms)
    if (now - lastActionTimeRef.current < 150) {
      return;
    }
    lastActionTimeRef.current = now;

    if (disabled) return;

    if (key === 'ENTER') {
      onEnter();
    } else if (key === 'BACKSPACE') {
      sound.playKeyDelete();
      haptics.vibrateKey();
      onDelete();
    } else {
      sound.playKeyTap();
      haptics.vibrateKey();
      onChar(key);
    }
  };

  return (
    <div className="keyboard-container" aria-label="Wordle Virtual Keyboard">
      {KEYBOARD_ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className="keyboard-row">
          {row.map((key) => {
            const isActionKey = key === 'ENTER' || key === 'BACKSPACE';
            const status = keyStatuses[key] || '';

            return (
              <button
                key={key}
                type="button"
                className={`key-btn ${isActionKey ? 'action-key' : ''} ${status}`}
                onClick={() => handleAction(key)}
                disabled={disabled}
                aria-label={key === 'BACKSPACE' ? 'Backspace' : key}
              >
                {key === 'BACKSPACE' ? (
                  <Delete size={18} />
                ) : key === 'ENTER' ? (
                  'ENTER'
                ) : (
                  key
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
};
