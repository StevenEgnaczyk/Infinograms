import React, { useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { SizeSelector } from './SizeSelector';
import { DifficultySelector } from './DifficultySelector';
import { PhotoUploader } from './PhotoUploader';

export const GameSetup: React.FC = () => {
  const { gridSize, difficulty, generateNewGame } = useGameStore();
  const [seed, setSeed] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'random' | 'photo'>('random');

  const isSeedEntered = seed.length > 0;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      generateNewGame(gridSize, difficulty, seed);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <h1 className="text-2xl font-bold text-game-primary mb-6">
          Nonogram Puzzle
        </h1>

        <div className="mb-6">
          <div className="flex gap-2 border-b">
            <button
              className={`px-4 py-2 ${
                activeTab === 'random' ? 'border-b-2 border-game-secondary' : ''
              }`}
              onClick={() => setActiveTab('random')}
            >
              Random Puzzle
            </button>
            <button
              className={`px-4 py-2 ${
                activeTab === 'photo' ? 'border-b-2 border-game-secondary' : ''
              }`}
              onClick={() => setActiveTab('photo')}
            >
              From Photo
            </button>
          </div>
        </div>

        {activeTab === 'random' ? (
          <div className="space-y-4">
            <section className={`space-y-2 ${isSeedEntered ? 'opacity-50 pointer-events-none' : ''}`}>
              <h2 className="text-lg font-semibold text-game-primary">Grid Size</h2>
              <SizeSelector
                currentSize={gridSize}
                onSizeChange={(size) => useGameStore.setState({ gridSize: size })}
              />
            </section>

            <section className={`space-y-2 ${isSeedEntered ? 'opacity-50 pointer-events-none' : ''}`}>
              <h2 className="text-lg font-semibold text-game-primary">Difficulty</h2>
              <DifficultySelector
                currentDifficulty={difficulty}
                onDifficultyChange={(diff) => useGameStore.setState({ difficulty: diff })}
              />
            </section>

            <input
              type="text"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              placeholder="Enter seed (optional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-3 bg-game-secondary text-white rounded-lg
                       hover:bg-game-secondary/90 transition-colors disabled:opacity-50"
            >
              {isGenerating ? 'Generating...' : 'Generate Puzzle'}
            </button>
          </div>
        ) : (
          <PhotoUploader />
        )}
      </div>
    </div>
  );
}; 