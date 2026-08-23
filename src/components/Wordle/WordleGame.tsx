import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { GameMode, LetterStatus, EvaluatedLetter, GameStatus, UserProfile } from '../../types';
import { getDailyWordInfo, getRandomTargetWord, isValidWord, evaluateGuess } from '../../services/dictionary';
import { getDailyRecord, saveDailyRecord, recordDailyGameResult, recordPracticeGameResult } from '../../services/storage';
import { sound } from '../../services/audio';
import { haptics } from '../../services/haptics';
import { Grid } from './Grid';
import { Keyboard } from './Keyboard';
import { GameOverModal } from './GameOverModal';
import { Flame, RefreshCw } from 'lucide-react';

interface WordleGameProps {
  profile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  onShowToast: (message: string, icon?: string) => void;
  onImpactShake?: () => void;
}

export const WordleGame: React.FC<WordleGameProps> = ({
  profile,
  onUpdateProfile,
  onShowToast,
  onImpactShake,
}) => {
  const [mode, setMode] = useState<GameMode>('DAILY');

  // Daily puzzle metadata
  const dailyInfo = getDailyWordInfo();

  // Active game state
  const [targetWord, setTargetWord] = useState<string>(dailyInfo.word);
  const [dayNumber, setDayNumber] = useState<number>(dailyInfo.dayNumber);
  const [guesses, setGuesses] = useState<string[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluatedLetter[][]>([]);
  const [currentGuess, setCurrentGuess] = useState<string>('');
  const [gameStatus, setGameStatus] = useState<GameStatus>('IN_PROGRESS');
  const [keyStatuses, setKeyStatuses] = useState<{ [key: string]: LetterStatus }>({});
  
  // Animation states
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [shakingRowIndex, setShakingRowIndex] = useState<number>(-1);
  const [revealingRowIndex, setRevealingRowIndex] = useState<number>(-1);
  const [revealingGuess, setRevealingGuess] = useState<string>('');
  const [revealingEvaluation, setRevealingEvaluation] = useState<EvaluatedLetter[]>([]);
  const [revealedTileCount, setRevealedTileCount] = useState<number>(0);
  const [wonRowIndex, setWonRowIndex] = useState<number>(-1);
  const [showGameOverModal, setShowGameOverModal] = useState<boolean>(false);

  const isProcessingRef = useRef(false);

  // Initialize or switch modes
  const initGame = useCallback((targetMode: GameMode) => {
    setMode(targetMode);
    setCurrentGuess('');
    setIsShaking(false);
    setShakingRowIndex(-1);
    setRevealingRowIndex(-1);
    setRevealingGuess('');
    setRevealingEvaluation([]);
    setRevealedTileCount(0);
    setWonRowIndex(-1);
    setShowGameOverModal(false);

    if (targetMode === 'DAILY') {
      const info = getDailyWordInfo();
      setTargetWord(info.word);
      setDayNumber(info.dayNumber);

      const existing = getDailyRecord(info.dateKey);
      if (existing) {
        setGuesses(existing.guesses);
        setEvaluations(existing.evaluations);
        setGameStatus(existing.status);

        // Recompute keyboard statuses
        const keys: { [key: string]: LetterStatus } = {};
        existing.evaluations.forEach(row => {
          row.forEach(item => {
            const current = keys[item.letter];
            if (current !== 'correct') {
              if (item.status === 'correct') {
                keys[item.letter] = 'correct';
              } else if (item.status === 'present' && current !== 'present') {
                keys[item.letter] = 'present';
              } else if (!current) {
                keys[item.letter] = 'absent';
              }
            }
          });
        });
        setKeyStatuses(keys);

        if (existing.status !== 'IN_PROGRESS') {
          if (existing.status === 'WON') {
            setWonRowIndex(existing.guesses.length - 1);
          }
          setShowGameOverModal(true);
        }
      } else {
        setGuesses([]);
        setEvaluations([]);
        setGameStatus('IN_PROGRESS');
        setKeyStatuses({});
      }
    } else {
      // Practice Mode: generate fresh random word
      const newWord = getRandomTargetWord();
      setTargetWord(newWord);
      setDayNumber(0);
      setGuesses([]);
      setEvaluations([]);
      setGameStatus('IN_PROGRESS');
      setKeyStatuses({});
    }
  }, []);

  useEffect(() => {
    initGame('DAILY');
  }, [initGame]);

  // Handle Letter Input
  const handleChar = useCallback((char: string) => {
    if (gameStatus !== 'IN_PROGRESS' || isProcessingRef.current) return;
    if (currentGuess.length < 5) {
      haptics.vibrateKey();
      setCurrentGuess((prev) => prev + char.toUpperCase());
    }
  }, [gameStatus, currentGuess]);

  // Handle Deletion
  const handleDelete = useCallback(() => {
    if (gameStatus !== 'IN_PROGRESS' || isProcessingRef.current) return;
    haptics.vibrateKey();
    setCurrentGuess((prev) => prev.slice(0, -1));
  }, [gameStatus]);

  // Handle Guess Submission with 1-by-1 tile color reveal
  const handleEnter = useCallback(() => {
    if (gameStatus !== 'IN_PROGRESS' || isProcessingRef.current) return;

    if (currentGuess.length < 5) {
      sound.playError();
      haptics.vibrateError();
      setIsShaking(true);
      onImpactShake?.();
      onShowToast('Not enough letters', '⚠️');
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    if (!isValidWord(currentGuess)) {
      sound.playError();
      haptics.vibrateError();
      setIsShaking(true);
      onImpactShake?.();
      onShowToast('Not in word list', '❌');
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    // Process evaluation
    isProcessingRef.current = true;
    const submittedGuess = currentGuess;
    const rowIndex = guesses.length;
    const evalResult = evaluateGuess(submittedGuess, targetWord);

    // Initialize reveal state
    setRevealingRowIndex(rowIndex);
    setRevealingGuess(submittedGuess);
    setRevealingEvaluation(evalResult.letters);
    setRevealedTileCount(0);
    setCurrentGuess('');

    // Stagger tile flip & color reveals ONE BY ONE (every 300ms)
    evalResult.letters.forEach((item, idx) => {
      setTimeout(() => {
        // Reveal color for this specific tile
        setRevealedTileCount(idx + 1);
        sound.playTileFlip(idx, item.status as 'correct' | 'present' | 'absent');
        haptics.vibrateTileReveal(item.status);

        // Update keyboard letter status in real-time as each tile turns color
        setKeyStatuses((prevKeys) => {
          const updated = { ...prevKeys };
          const current = updated[item.letter];
          if (current !== 'correct') {
            if (item.status === 'correct') {
              updated[item.letter] = 'correct';
            } else if (item.status === 'present' && current !== 'present') {
              updated[item.letter] = 'present';
            } else if (!current) {
              updated[item.letter] = 'absent';
            }
          }
          return updated;
        });
      }, idx * 300 + 160);
    });

    // After all 5 tiles have finished flipping and turning color (~1800ms)
    const totalRevealTime = 5 * 300 + 250;

    setTimeout(() => {
      setRevealingRowIndex(-1);
      setRevealingGuess('');
      setRevealingEvaluation([]);
      setRevealedTileCount(0);

      const newGuesses = [...guesses, submittedGuess];
      const newEvaluations = [...evaluations, evalResult.letters];
      const isWon = evalResult.isCorrect;
      const isLost = !isWon && newGuesses.length >= 6;

      setGuesses(newGuesses);
      setEvaluations(newEvaluations);

      if (isWon) {
        setGameStatus('WON');
        setWonRowIndex(rowIndex);
        sound.playWin();
        haptics.vibrateWin();

        // Confetti effect
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#00f0ff', '#d946ef', '#10b981', '#f59e0b'],
        });

        if (mode === 'DAILY') {
          saveDailyRecord({
            dateKey: dailyInfo.dateKey,
            dayNumber: dailyInfo.dayNumber,
            word: targetWord,
            guesses: newGuesses,
            evaluations: newEvaluations,
            status: 'WON',
            completedAt: new Date().toISOString(),
            attemptsUsed: newGuesses.length,
          });

          const updatedProfile = recordDailyGameResult(dailyInfo.dateKey, true, newGuesses.length);
          onUpdateProfile(updatedProfile);
        } else {
          const updatedProfile = recordPracticeGameResult(true);
          onUpdateProfile(updatedProfile);
        }

        setTimeout(() => setShowGameOverModal(true), 1200);
      } else {
        // Wrong guess feedback: shake on the newly submitted evaluated row + wrong guess vibration
        setShakingRowIndex(rowIndex);
        haptics.vibrateWrongGuess();
        onImpactShake?.();
        setTimeout(() => setShakingRowIndex(-1), 500);

        if (isLost) {
          setGameStatus('LOST');
          sound.playLoss();
          haptics.vibrateLoss();

          if (mode === 'DAILY') {
            saveDailyRecord({
              dateKey: dailyInfo.dateKey,
              dayNumber: dailyInfo.dayNumber,
              word: targetWord,
              guesses: newGuesses,
              evaluations: newEvaluations,
              status: 'LOST',
              completedAt: new Date().toISOString(),
              attemptsUsed: 6,
            });

            const updatedProfile = recordDailyGameResult(dailyInfo.dateKey, false, 6);
            onUpdateProfile(updatedProfile);
          } else {
            const updatedProfile = recordPracticeGameResult(false);
            onUpdateProfile(updatedProfile);
          }

          setTimeout(() => setShowGameOverModal(true), 1000);
        } else if (mode === 'DAILY') {
          // Save in-progress state
          saveDailyRecord({
            dateKey: dailyInfo.dateKey,
            dayNumber: dailyInfo.dayNumber,
            word: targetWord,
            guesses: newGuesses,
            evaluations: newEvaluations,
            status: 'IN_PROGRESS',
            attemptsUsed: newGuesses.length,
          });
        }
      }

      isProcessingRef.current = false;
    }, totalRevealTime);
  }, [
    gameStatus,
    currentGuess,
    guesses,
    evaluations,
    targetWord,
    mode,
    dailyInfo,
    onUpdateProfile,
    onShowToast,
  ]);

  // Physical Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showGameOverModal) return;
      if (e.key === 'Enter') {
        handleEnter();
      } else if (e.key === 'Backspace') {
        sound.playKeyDelete();
        handleDelete();
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        sound.playKeyTap();
        handleChar(e.key.toUpperCase());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleEnter, handleDelete, handleChar, showGameOverModal]);

  return (
    <div className="wordle-container">
      {/* Wordle Top Mode Selector */}
      <div className="wordle-top-bar">
        <div className="mode-pills">
          <button
            className={`mode-pill-btn ${mode === 'DAILY' ? 'active' : ''}`}
            onClick={() => {
              sound.playKeyTap();
              initGame('DAILY');
            }}
          >
            Daily #{dailyInfo.dayNumber}
          </button>
          <button
            className={`mode-pill-btn ${mode === 'PRACTICE' ? 'active' : ''}`}
            onClick={() => {
              sound.playKeyTap();
              initGame('PRACTICE');
            }}
          >
            Practice
          </button>
        </div>

        {mode === 'DAILY' ? (
          <div className="daily-timer-badge">
            <Flame size={14} color="#f59e0b" fill="#f59e0b" />
            <span>Streak: {profile.streak}</span>
          </div>
        ) : (
          <button
            className="header-btn"
            style={{ width: 'auto', padding: '0 10px', fontSize: 11, fontWeight: 700, gap: 4 }}
            onClick={() => {
              sound.playKeyTap();
              initGame('PRACTICE');
              onShowToast('New practice word loaded!', '🎲');
            }}
          >
            <RefreshCw size={12} />
            <span>New Word</span>
          </button>
        )}
      </div>

      {/* 6x5 Letter Grid */}
      <Grid
        guesses={guesses}
        evaluations={evaluations}
        currentGuess={currentGuess}
        isShaking={isShaking}
        shakingRowIndex={shakingRowIndex}
        isWon={gameStatus === 'WON'}
        wonRowIndex={wonRowIndex}
        revealingRowIndex={revealingRowIndex}
        revealingGuess={revealingGuess}
        revealingEvaluation={revealingEvaluation}
        revealedTileCount={revealedTileCount}
      />

      {/* On-Screen Virtual Keyboard */}
      <Keyboard
        keyStatuses={keyStatuses}
        onChar={handleChar}
        onDelete={handleDelete}
        onEnter={handleEnter}
        disabled={gameStatus !== 'IN_PROGRESS'}
      />

      {/* Game Over / Results Modal */}
      {showGameOverModal && (
        <GameOverModal
          status={gameStatus === 'WON' ? 'WON' : 'LOST'}
          targetWord={targetWord}
          dayNumber={dayNumber}
          mode={mode}
          evaluations={evaluations}
          profile={profile}
          onClose={() => setShowGameOverModal(false)}
          onPlayAgainPractice={() => initGame('PRACTICE')}
          onShowToast={onShowToast}
        />
      )}
    </div>
  );
};
