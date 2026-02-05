export type Vec = { x: number; y: number };

export type Direction = "up" | "down" | "left" | "right";

export type GameState = {
  gridSize: number;
  snake: Vec[];
  direction: Direction;
  queuedDirection: Direction | null;
  food: Vec;
  score: number;
  isGameOver: boolean;
  isPaused: boolean;
  tick: number;
};

const DIR_VECTORS: Record<Direction, Vec> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

const OPPOSITE: Record<Direction, Direction> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left"
};

export type Rng = () => number;

export function createInitialState(
  gridSize = 16,
  rng: Rng = Math.random
): GameState {
  const mid = Math.floor(gridSize / 2);
  const snake: Vec[] = [
    { x: mid, y: mid },
    { x: mid - 1, y: mid },
    { x: mid - 2, y: mid }
  ];

  return {
    gridSize,
    snake,
    direction: "right",
    queuedDirection: null,
    food: spawnFood(gridSize, snake, rng),
    score: 0,
    isGameOver: false,
    isPaused: false,
    tick: 0
  };
}

export function queueDirection(
  state: GameState,
  next: Direction
): GameState {
  if (state.isGameOver) return state;
  if (next === state.direction || next === state.queuedDirection) return state;
  if (OPPOSITE[next] === state.direction) return state;

  return { ...state, queuedDirection: next };
}

export function togglePause(state: GameState): GameState {
  if (state.isGameOver) return state;
  return { ...state, isPaused: !state.isPaused };
}

export function advance(
  state: GameState,
  rng: Rng = Math.random
): GameState {
  if (state.isGameOver || state.isPaused) return state;

  const direction = state.queuedDirection ?? state.direction;
  const vector = DIR_VECTORS[direction];
  const head = state.snake[0];
  const nextHead = { x: head.x + vector.x, y: head.y + vector.y };

  const outOfBounds =
    nextHead.x < 0 ||
    nextHead.y < 0 ||
    nextHead.x >= state.gridSize ||
    nextHead.y >= state.gridSize;

  const isEating = samePos(nextHead, state.food);
  const bodyToCheck = isEating
    ? state.snake
    : state.snake.slice(0, -1);
  const hitsSelf = bodyToCheck.some((seg) => samePos(seg, nextHead));

  if (outOfBounds || hitsSelf) {
    return {
      ...state,
      direction,
      queuedDirection: null,
      isGameOver: true,
      tick: state.tick + 1
    };
  }

  const nextSnake = [nextHead, ...state.snake];
  if (!isEating) nextSnake.pop();

  const nextFood = isEating
    ? spawnFood(state.gridSize, nextSnake, rng)
    : state.food;

  return {
    ...state,
    direction,
    queuedDirection: null,
    snake: nextSnake,
    food: nextFood,
    score: state.score + (isEating ? 1 : 0),
    tick: state.tick + 1
  };
}

export function spawnFood(gridSize: number, snake: Vec[], rng: Rng): Vec {
  const occupied = new Set(snake.map(toKey));
  const candidates: Vec[] = [];

  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      const key = `${x},${y}`;
      if (!occupied.has(key)) candidates.push({ x, y });
    }
  }

  if (candidates.length === 0) {
    return { x: 0, y: 0 };
  }

  const idx = Math.floor(rng() * candidates.length);
  return candidates[idx];
}

export function samePos(a: Vec, b: Vec): boolean {
  return a.x === b.x && a.y === b.y;
}

function toKey(pos: Vec): string {
  return `${pos.x},${pos.y}`;
}
