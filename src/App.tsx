import { type ReactElement } from 'react';
import { useGameStore } from './stores/gameStore';
import { GameSetup } from './components/GameSetup';
import { GameBoard } from './components/GameBoard';
import { formatTime } from './utils/timeUtils';
import React from 'react';

function App(): ReactElement {
  const { 
    game,
    isVictory,
    showSolution,
    startTime,
    endTime,
    toggleCell,
    toggleShowSolution
  } = useGameStore();

  return (
    <div className="min-h-screen bg-game-background">
      {!game ? (
        <GameSetup />
      ) : (
        <div className="h-screen flex flex-col">
          <header className="flex items-center justify-between px-4 py-2 bg-white shadow-md">
            <button 
              onClick={() => useGameStore.setState({ game: null })}
              className="px-4 py-2 text-game-primary hover:bg-gray-100 rounded-lg transition-colors"
            >
              ← Back
            </button>
            <div className="text-xl font-mono text-game-primary">
              {startTime ? formatTime(endTime ? endTime - startTime : Date.now() - startTime) : '00:00'}
            </div>
            <button
              onClick={toggleShowSolution}
              className="px-4 py-2 text-game-accent hover:bg-gray-100 rounded-lg transition-colors"
            >
              {showSolution ? 'Hide Solution' : 'Reveal Solution'}
            </button>
          </header>
          
          <main className="flex-1 relative overflow-hidden pt-8">
            <GameBoard 
              game={game}
              onCellClick={toggleCell}
              isVictory={isVictory}
              showSolution={showSolution}
              startTime={startTime}
              endTime={endTime}
            />
          </main>
        </div>
      )}
    </div>
  );
}

export default App; 