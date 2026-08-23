import React from 'react';
import { EvaluatedLetter } from '../../types';

interface GridProps {
  guesses: string[];
  evaluations: EvaluatedLetter[][];
  currentGuess: string;
  isShaking: boolean;
  shakingRowIndex?: number;
  isWon: boolean;
  wonRowIndex: number;
  revealingRowIndex: number;
  revealingGuess?: string;
  revealingEvaluation?: EvaluatedLetter[];
  revealedTileCount?: number;
}

export const Grid: React.FC<GridProps> = ({
  guesses,
  evaluations,
  currentGuess,
  isShaking,
  shakingRowIndex = -1,
  isWon,
  wonRowIndex,
  revealingRowIndex,
  revealingGuess = '',
  revealingEvaluation = [],
  revealedTileCount = 0,
}) => {
  const rows = [];

  for (let r = 0; r < 6; r++) {
    const isEvaluatedRow = r < guesses.length;
    const isRevealingRow = r === revealingRowIndex;
    const isCurrentRow = !isRevealingRow && r === guesses.length;
    const isWinningRow = isWon && r === wonRowIndex;
    const isRowShaking = (isCurrentRow && isShaking) || r === shakingRowIndex;

    const rowLetters: { char: string; status: string; isFlipping: boolean }[] = [];

    if (isRevealingRow) {
      // Actively revealing tiles one by one
      for (let c = 0; c < 5; c++) {
        const char = revealingGuess[c] || '';
        const item = revealingEvaluation[c];
        
        if (c < revealedTileCount) {
          // Revealed tile: has its evaluation status (correct, present, absent)
          const status = item ? item.status : 'absent';
          rowLetters.push({ char, status, isFlipping: c === revealedTileCount - 1 });
        } else {
          // Not yet revealed: displays typed letter
          rowLetters.push({ char, status: 'has-letter', isFlipping: c === revealedTileCount });
        }
      }
    } else if (isEvaluatedRow) {
      // Previously completed row
      const evaluation = evaluations[r] || [];
      for (let c = 0; c < 5; c++) {
        const item = evaluation[c];
        const char = item ? item.letter : '';
        const status = item ? item.status : 'absent';
        rowLetters.push({ char, status, isFlipping: false });
      }
    } else if (isCurrentRow) {
      // Active typing row
      for (let c = 0; c < 5; c++) {
        const char = currentGuess[c] || '';
        rowLetters.push({
          char,
          status: char ? 'has-letter' : 'empty',
          isFlipping: false,
        });
      }
    } else {
      // Subsequent empty rows
      for (let c = 0; c < 5; c++) {
        rowLetters.push({ char: '', status: 'empty', isFlipping: false });
      }
    }

    const rowClassName = [
      'grid-row',
      isRowShaking ? 'shake' : '',
      isWinningRow ? 'bounce' : '',
    ]
      .filter(Boolean)
      .join(' ');

    rows.push(
      <div key={r} className={rowClassName}>
        {rowLetters.map((tile, c) => {
          const tileClass = [
            'tile',
            tile.status,
            tile.isFlipping ? 'flipping' : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <div key={c} className={tileClass} data-letter={tile.char}>
              {tile.char}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="board-container">
      <div className="wordle-grid">{rows}</div>
    </div>
  );
};
