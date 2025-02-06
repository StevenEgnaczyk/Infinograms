import { create } from 'zustand';
import { NonogramGame, Difficulty, GridSize } from '../types/gameTypes';
import seedrandom from 'seedrandom';
import { generateValidPuzzle, generateHints } from '../utils/puzzleGenerator';


interface GameState {
  game: NonogramGame | null;
  difficulty: Difficulty;
  gridSize: GridSize;
  showSolution: boolean;
  isVictory: boolean;
  startTime: number | null;
  endTime: number | null;
  currentSeed: string;
  generateNewGame: (size: GridSize, difficulty: Difficulty, seed?: string) => void;
  toggleCell: (row: number, col: number, nextState?: boolean | 'x') => void;
  toggleShowSolution: () => void;
  checkSolution: () => void;
}

const validatePuzzle = (solution: boolean[][]): boolean => {
  const rows = solution.length;
  const cols = solution[0].length;
  
  // Check each row and column has at least one filled cell
  const hasEmptyLine = solution.some(row => row.every(cell => !cell)) ||
    Array(cols).fill(0).some((_, col) => solution.every(row => !row[col]));
  
  if (hasEmptyLine) return false;
  
  // Check for isolated cells (cells with no adjacent filled cells)
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (solution[i][j]) {
        const hasAdjacent = (
          (i > 0 && solution[i-1][j]) ||
          (i < rows-1 && solution[i+1][j]) ||
          (j > 0 && solution[i][j-1]) ||
          (j < cols-1 && solution[i][j+1])
        );
        if (!hasAdjacent) return false;
      }
    }
  }
  
  return true;
};

export const useGameStore = create<GameState>((set, get) => ({
  game: null,
  difficulty: 'medium',
  gridSize: { rows: 5, columns: 5 },
  showSolution: false,
  isVictory: false,
  startTime: null,
  endTime: null,
  currentSeed: '',
  
  generateNewGame: (size: GridSize, difficulty: Difficulty, seed?: string) => {
    const newSeed = seed || Math.random().toString(36).substring(7);
    const rng = seedrandom(newSeed);
    const fillProbability = difficulty === 'easy' ? 0.7 : difficulty === 'medium' ? 0.5 : 0.3;
    
    const solution = generateValidPuzzle(size, fillProbability, rng);
    const { rowHints, columnHints } = generateHints(solution);
    
    const game: NonogramGame = {
      solution,
      userGrid: Array(size.rows).fill(0).map(() => Array(size.columns).fill(false)),
      rowHints,
      columnHints
    };
    
    set({ 
      game, 
      gridSize: size, 
      difficulty,
      isVictory: false, 
      showSolution: false,
      startTime: null,
      endTime: null,
      currentSeed: newSeed
    });
  },

  toggleCell: (row: number, col: number, nextState?: boolean | 'x') => {
    set(state => {
      if (!state.game) return state;
      
      const startTime = state.startTime || Date.now();
      const newUserGrid = state.game.userGrid.map((r, rowIndex) =>
        rowIndex === row
          ? r.map((cell, colIndex) => {
              if (colIndex !== col) return cell;
              if (nextState !== undefined) return nextState;
              return cell === false ? true : cell === true ? 'x' : false;
            })
          : r
      );

      return {
        ...state,
        startTime,
        game: { ...state.game, userGrid: newUserGrid }
      };
    });
    get().checkSolution();
  },

  toggleShowSolution: () => {
    set(state => {
      const newShowSolution = !state.showSolution;
      return {
        ...state,
        showSolution: newShowSolution,
        isVictory: newShowSolution ? true : state.isVictory,
        endTime: newShowSolution && !state.endTime ? Date.now() : state.endTime,
        game: state.game ? {
          ...state.game,
          userGrid: newShowSolution 
            ? state.game.solution.map(row => row.map(cell => cell ? true : false))
            : state.game.userGrid
        } : null
      };
    });
  },

  checkSolution: () => {
    set(state => {
      if (!state.game) return state;

      const isCorrect = state.game.solution.every((row, i) =>
        row.every((cell, j) => 
          (cell && state.game!.userGrid[i][j] === true) ||
          (!cell && state.game!.userGrid[i][j] !== true)
        )
      );

      if (isCorrect && !state.isVictory) {
        return {
          ...state,
          isVictory: true,
          endTime: Date.now()
        };
      }

      return state;
    });
  }
})); 