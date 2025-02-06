import { type ReactElement, useState, useEffect, useRef } from 'react';
import React from 'react';
import { NonogramGame } from '../types/gameTypes';
import { useGameStore } from '../stores/gameStore';
import { formatTime } from '../utils/timeUtils';

interface GameBoardProps {
  game: NonogramGame;
  onCellClick: (row: number, col: number, nextState?: boolean | 'x') => void;
  isVictory: boolean;
  showSolution?: boolean;
  startTime: number | null;
  endTime: number | null;
}

interface WaveCell {
  row: number;
  col: number;
  intensity: number;
}

export const GameBoard = ({ 
  game, 
  onCellClick, 
  isVictory,
  showSolution,
  startTime,
  endTime
}: GameBoardProps): ReactElement => {
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [dragState, setDragState] = useState<boolean | 'x' | null>(null);
  const [activeWave, setActiveWave] = useState<Array<WaveCell>>([]);
  const [scale, setScale] = useState(1);
  const boardRef = useRef<HTMLDivElement>(null);
  
  const maxRowHintLength = Math.max(...game.rowHints.map(hints => hints.length));
  const maxColHintLength = Math.max(...game.columnHints.map(hints => hints.length));

  const calculateWaveCells = (currentDiagonal: number, size: number): WaveCell[] => {
    const cells: WaveCell[] = [];
    const maxIntensity = 0.8;
    
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const distanceFromDiagonal = Math.abs(i + j - currentDiagonal);
        if (distanceFromDiagonal <= 2) {
          const intensity = maxIntensity * (1 - distanceFromDiagonal / 3);
          cells.push({ row: i, col: j, intensity });
        }
      }
    }
    
    return cells;
  };

  // Victory animation effect
  useEffect(() => {
    if (!isVictory && !showSolution) return;
    
    const size = game.solution.length;
    let currentDiagonal = 0;
    const totalDiagonals = 2 * size - 1;
    
    const waveInterval = setInterval(() => {
      const newActiveCells = calculateWaveCells(currentDiagonal, size);
      setActiveWave(newActiveCells);
      currentDiagonal = (currentDiagonal + 1) % (totalDiagonals + 5);
    }, 100);

    return () => clearInterval(waveInterval);
  }, [isVictory, showSolution, game.solution]);

  // Scale calculation effect
  useEffect(() => {
    const calculateScale = () => {
      if (!boardRef.current) return;
      
      const container = boardRef.current.parentElement;
      if (!container) return;

      const cellSize = 20;
      const totalGridWidth = (game.userGrid[0].length + maxRowHintLength) * cellSize;
      const totalGridHeight = (game.userGrid.length + maxColHintLength) * cellSize;
      
      const availableWidth = container.clientWidth * 0.98;
      const availableHeight = container.clientHeight * 0.98;
      
      const widthScale = availableWidth / totalGridWidth;
      const heightScale = availableHeight / totalGridHeight;
      
      const baseScale = Math.min(widthScale, heightScale);
      
      const gridSize = Math.max(game.userGrid.length, game.userGrid[0].length);
      const targetScale = 1.8 - (gridSize - 5) * (1 / 15);
      
      setScale(Math.min(targetScale, baseScale));
    };

    calculateScale();
    window.addEventListener('resize', calculateScale);
    return () => window.removeEventListener('resize', calculateScale);
  }, [game.userGrid.length, game.userGrid[0].length, maxRowHintLength, maxColHintLength]);

  const handleCellInteraction = (rowIndex: number, colIndex: number, initialCell: boolean | 'x') => {
    // If starting a drag, set the drag state
    if (!dragState) {
      if (initialCell === false) setDragState(true);
      else if (initialCell === true) setDragState('x');
      else setDragState(false);
    }

    // Use drag state if it exists, otherwise cycle the cell
    const nextState = dragState ?? (
      initialCell === false ? true :
      initialCell === true ? 'x' :
      false
    );

    onCellClick(rowIndex, colIndex, nextState);
  };

  const getCellClassName = (cell: boolean | 'x', rowIndex: number, colIndex: number) => {
    const isCorrectCell = game.solution[rowIndex][colIndex];
    const activeCell = activeWave.find(cell => cell.row === rowIndex && cell.col === colIndex);
    
    if ((isVictory || showSolution) && isCorrectCell) {
      const intensity = activeCell?.intensity ?? 0;
      const scale = 1 + intensity * 0.6;
      return `w-8 h-8 ${activeCell ? 'bg-yellow-300' : 'bg-yellow-600'} wave-cell
              [--wave-scale:${scale}] [--wave-opacity:${intensity}]`;
    }
    
    if (cell === 'x') {
      return `w-8 h-8 bg-white relative before:absolute before:inset-0 
              before:bg-[linear-gradient(45deg,transparent_45%,#666_45%,#666_55%,transparent_55%)]
              after:absolute after:inset-0
              after:bg-[linear-gradient(-45deg,transparent_45%,#666_45%,#666_55%,transparent_55%)]`;
    }
    
    return `w-8 h-8 ${cell ? 'bg-black' : 'bg-white'}`;
  };

  const getBorderStyle = (index: number, isRow: boolean) => {
    const isFifth = (index + 1) % 5 === 0;
    const isLast = index === (isRow ? game.userGrid.length : game.userGrid[0].length) - 1;
    return isFifth && !isLast ? 'border-b-2 border-gray-400' : 'border-b border-gray-300';
  };

  return (
    <div 
      className="w-full h-full"
      onMouseUp={() => {
        setIsMouseDown(false);
        setDragState(null);
      }}
      onMouseLeave={() => {
        setIsMouseDown(false);
        setDragState(null);
      }}
    >
      <div className="flex justify-center">
        <div 
          ref={boardRef}
          className="grid gap-0 origin-top transition-transform duration-200 border-4 border-black"
          style={{ 
            gridTemplateColumns: `minmax(${maxRowHintLength * 2}rem, auto) repeat(${game.userGrid[0].length}, 2rem)`,
            gridTemplateRows: `minmax(${maxColHintLength * 2}rem, auto) repeat(${game.userGrid.length}, 2rem)`,
            transform: `scale(${scale})`,
            transformOrigin: 'top center'
          }}
        >
          {/* Top-left empty corner */}
          <div className="bg-gray-200 border-r-4 border-b-4 border-black" />

          {/* Column hints */}
          {game.columnHints.map((hints, colIndex) => (
            <div 
              key={colIndex} 
              className={`bg-gray-200 flex flex-col items-center justify-end pb-1 border-b-4 border-black
                         ${(colIndex + 1) % 5 === 0 ? 'border-r-4' : 'border-r'}`}
            >
              {hints.map((hint, hintIndex) => (
                <span key={hintIndex} className="text-sm font-bold">{hint}</span>
              ))}
            </div>
          ))}

          {/* Row hints and game grid */}
          {game.userGrid.map((row, rowIndex) => (
            <React.Fragment key={rowIndex}>
              {/* Row hints */}
              <div 
                className={`bg-gray-200 flex items-center justify-end gap-1 pr-2 border-r-4 border-black
                           ${(rowIndex + 1) % 5 === 0 ? 'border-b-4' : 'border-b'}`}
              >
                {game.rowHints[rowIndex].map((hint, hintIndex) => (
                  <span key={hintIndex} className="text-sm font-bold">{hint}</span>
                ))}
              </div>

              {/* Grid cells */}
              {row.map((cell, colIndex) => (
                <button
                  key={colIndex}
                  className={`${getCellClassName(cell, rowIndex, colIndex)}
                            ${(colIndex + 1) % 5 === 0 ? 'border-r-4' : 'border-r'}
                            ${(rowIndex + 1) % 5 === 0 ? 'border-b-4' : 'border-b'}
                            border-black`}
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevent text selection
                    if (!isVictory && !showSolution) {
                      setIsMouseDown(true);
                      handleCellInteraction(rowIndex, colIndex, cell);
                    }
                  }}
                  onMouseEnter={() => {
                    if (isMouseDown && !isVictory && !showSolution) {
                      handleCellInteraction(rowIndex, colIndex, cell);
                    }
                  }}
                  disabled={isVictory || showSolution}
                />
              ))}
            </React.Fragment>
          ))}
        </div>
      </div>

      {isVictory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-lg text-center">
            <h2 className="text-2xl font-bold text-game-primary mb-4">
              Congratulations!
            </h2>
            <p className="text-lg text-gray-700 mb-6">
              You solved the puzzle in {formatTime(endTime! - startTime!)}
            </p>
            <button
              onClick={() => useGameStore.setState({ game: null })}
              className="px-6 py-3 bg-game-secondary text-white rounded-lg hover:bg-game-secondary/90 transition-colors"
            >
              New Game
            </button>
          </div>
        </div>
      )}
    </div>
  );
}; 