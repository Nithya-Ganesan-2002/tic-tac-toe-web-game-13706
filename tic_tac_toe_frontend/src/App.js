import React, { useEffect, useMemo, useState } from 'react';
import './App.css';

/**
 * Utility constants for the game.
 */
const LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const MODES = {
  PVP: 'pvp',
  AI: 'ai',
};

/**
 * Calculates the winner for the given board state.
 * @param {Array<string|null>} squares board array
 * @returns {{winner: 'X'|'O'|null, line: number[]|null}}
 */
function calculateWinner(squares) {
  for (const line of LINES) {
    const [a, b, c] = line;
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return { winner: squares[a], line };
    }
  }
  return { winner: null, line: null };
}

/**
 * Finds a winning move index for the given player, or returns null.
 * @param {Array<string|null>} board
 * @param {'X'|'O'} player
 * @returns {number|null}
 */
function findWinningMove(board, player) {
  for (const [a, b, c] of LINES) {
    const lineVals = [board[a], board[b], board[c]];
    const countPlayer = lineVals.filter((v) => v === player).length;
    const countEmpty = lineVals.filter((v) => v === null).length;
    if (countPlayer === 2 && countEmpty === 1) {
      if (board[a] === null) return a;
      if (board[b] === null) return b;
      if (board[c] === null) return c;
    }
  }
  return null;
}

/**
 * Returns the best AI move using a strong heuristic:
 * 1) Win if possible
 * 2) Block opponent's win
 * 3) Take center
 * 4) Take a corner
 * 5) Take a side
 * @param {Array<string|null>} board
 * @param {'X'|'O'} ai 'O' by default in this app
 * @param {'X'|'O'} human 'X' by default in this app
 * @returns {number|null}
 */
function getBestAIMove(board, ai = 'O', human = 'X') {
  // 1) Win
  const winMove = findWinningMove(board, ai);
  if (winMove !== null) return winMove;

  // 2) Block
  const blockMove = findWinningMove(board, human);
  if (blockMove !== null) return blockMove;

  // 3) Center
  if (board[4] === null) return 4;

  // 4) Corner
  const corners = [0, 2, 6, 8].filter((i) => board[i] === null);
  if (corners.length) {
    return corners[Math.floor(Math.random() * corners.length)];
  }

  // 5) Side
  const sides = [1, 3, 5, 7].filter((i) => board[i] === null);
  if (sides.length) {
    return sides[Math.floor(Math.random() * sides.length)];
  }

  return null;
}

/**
 * Square component representing a single cell on the board.
 * @param {{value: 'X'|'O'|null, onClick: () => void, highlight: boolean, disabled: boolean, index: number}} props
 */
function Square({ value, onClick, highlight, disabled, index }) {
  const markClass = value === 'X' ? 'x' : value === 'O' ? 'o' : '';
  const classes = ['square', markClass, highlight ? 'win' : ''].filter(Boolean).join(' ');
  const aria = value ? `Cell ${index + 1}: ${value}` : `Cell ${index + 1}: empty`;
  return (
    <button
      className={classes}
      onClick={onClick}
      disabled={disabled}
      aria-label={aria}
      title={aria}
    >
      {value}
    </button>
  );
}

// PUBLIC_INTERFACE
function App() {
  /** This is the main public React component for the Tic Tac Toe game interface. */

  const [mode, setMode] = useState(MODES.AI); // default to AI mode
  const [squares, setSquares] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true); // X always starts
  const [gameOver, setGameOver] = useState(false);
  const [winningLine, setWinningLine] = useState(null);
  const [scores, setScores] = useState({ X: 0, O: 0, draws: 0 });

  const result = useMemo(() => calculateWinner(squares), [squares]);
  const winner = result.winner;

  useEffect(() => {
    if (winner && !gameOver) {
      // Game ended with a winner
      setGameOver(true);
      setWinningLine(result.line);
      setScores((prev) => ({ ...prev, [winner]: prev[winner] + 1 }));
    } else if (!winner && squares.every((v) => v !== null) && !gameOver) {
      // Draw
      setGameOver(true);
      setWinningLine(null);
      setScores((prev) => ({ ...prev, draws: prev.draws + 1 }));
    }
  }, [winner, gameOver, result.line, squares]);

  // AI move when it's O's turn in AI mode
  useEffect(() => {
    if (mode === MODES.AI && !gameOver && !isXNext) {
      const aiMove = getBestAIMove(squares, 'O', 'X');
      if (aiMove !== null) {
        const timer = setTimeout(() => {
          makeMove(aiMove); // O will play
        }, 320);
        return () => clearTimeout(timer);
      }
    }
    return undefined;
  }, [mode, squares, isXNext, gameOver]);

  /**
   * Makes a move for the current player at a given index.
   * Handles state transitions, winner detection, and next turn toggling.
   * @param {number} index
   */
  function makeMove(index) {
    if (gameOver || squares[index]) return;

    const next = isXNext ? 'X' : 'O';
    const nextSquares = squares.slice();
    nextSquares[index] = next;

    setSquares(nextSquares);
    // If no winner yet, toggle to next player
    if (!calculateWinner(nextSquares).winner && nextSquares.some((v) => v === null)) {
      setIsXNext(!isXNext);
    }
  }

  function onSquareClick(index) {
    if (mode === MODES.AI && !isXNext) return; // prevent clicks during AI's turn
    makeMove(index);
  }

  function resetBoard() {
    setSquares(Array(9).fill(null));
    setIsXNext(true);
    setGameOver(false);
    setWinningLine(null);
  }

  function onModeChange(e) {
    const newMode = e.target.value;
    setMode(newMode);
    // Reset round when switching modes for clarity
    resetBoard();
  }

  const statusText = gameOver
    ? (winner ? `Winner: ${winner}` : 'Draw')
    : `Turn: ${isXNext ? 'X' : 'O'}`;

  return (
    <div className="App">
      <main className="game-shell" role="main">
        <h1 className="title">Tic Tac Toe</h1>

        <section className="scoreboard" aria-label="Scoreboard">
          <div className="score score-x" title="X wins">
            <span className="label">X</span>
            <span className="value">{scores.X}</span>
          </div>
          <div className="score score-draw" title="Draws">
            <span className="label">Draws</span>
            <span className="value">{scores.draws}</span>
          </div>
          <div className="score score-o" title="O wins">
            <span className="label">O</span>
            <span className="value">{scores.O}</span>
          </div>
        </section>

        <section className="status" aria-live="polite">
          <span className={`badge ${winner ? 'badge-win' : gameOver ? 'badge-draw' : 'badge-turn'}`}>
            {statusText}
          </span>
        </section>

        <section className="board" aria-label="Tic Tac Toe Board">
          {squares.map((val, i) => {
            const highlight = winningLine ? winningLine.includes(i) : false;
            return (
              <Square
                key={i}
                index={i}
                value={val}
                onClick={() => onSquareClick(i)}
                highlight={highlight}
                disabled={!!val || gameOver || (mode === MODES.AI && !isXNext)}
              />
            );
          })}
        </section>

        <section className="controls" aria-label="Game Controls">
          <div className="control-group">
            <label htmlFor="mode-select" className="control-label">Mode</label>
            <select
              id="mode-select"
              className="select"
              value={mode}
              onChange={onModeChange}
              aria-label="Select play mode"
            >
              <option value={MODES.PVP}>Player vs Player</option>
              <option value={MODES.AI}>Play vs Computer</option>
            </select>
          </div>

          <button className="btn" onClick={resetBoard} aria-label="Reset the current round">
            Reset Round
          </button>
        </section>
      </main>
    </div>
  );
}

export default App;
