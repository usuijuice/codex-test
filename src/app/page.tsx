"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  advance,
  createInitialState,
  queueDirection,
  togglePause,
  type Direction,
  type GameState
} from "../lib/snake";

const TICK_MS = 140;
const GRID_SIZES = [12, 16, 20, 24] as const;
type GridSize = (typeof GRID_SIZES)[number];

const KEY_TO_DIR: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  s: "down",
  a: "left",
  d: "right",
  W: "up",
  S: "down",
  A: "left",
  D: "right"
};

export default function Home() {
  const [gridSize, setGridSize] = useState<GridSize>(16);
  const [state, setState] = useState<GameState>(() =>
    createInitialState(gridSize)
  );
  const intervalRef = useRef<number | null>(null);

  const startLoop = useCallback(() => {
    if (intervalRef.current !== null) return;
    intervalRef.current = window.setInterval(() => {
      setState((prev) => advance(prev));
    }, TICK_MS);
  }, []);

  const stopLoop = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    startLoop();
    return () => stopLoop();
  }, [startLoop, stopLoop]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === " ") {
        event.preventDefault();
        setState((prev) => togglePause(prev));
        return;
      }

      const dir = KEY_TO_DIR[event.key];
      if (!dir) return;
      event.preventDefault();
      setState((prev) => queueDirection(prev, dir));
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const snakeSet = useMemo(() => {
    return new Set(state.snake.map((seg) => `${seg.x},${seg.y}`));
  }, [state.snake]);

  const headKey = `${state.snake[0].x},${state.snake[0].y}`;

  const cells = useMemo(() => {
    const result: { key: string; className: string }[] = [];
    for (let y = 0; y < state.gridSize; y += 1) {
      for (let x = 0; x < state.gridSize; x += 1) {
        const key = `${x},${y}`;
        let className = "cell";
        if (key === headKey) className = "cell snake-head";
        else if (snakeSet.has(key)) className = "cell snake";
        else if (x === state.food.x && y === state.food.y)
          className = "cell food";
        result.push({ key, className });
      }
    }
    return result;
  }, [state.gridSize, state.food.x, state.food.y, snakeSet, headKey]);

  const reset = useCallback(() => {
    setState(createInitialState(gridSize));
  }, [gridSize]);

  const handleGridChange = (value: GridSize) => {
    setGridSize(value);
    setState(createInitialState(value));
  };

  const handleControl = (dir: Direction) => {
    setState((prev) => queueDirection(prev, dir));
  };

  return (
    <main>
      <div className="game">
        <div className="header">
          <div className="title">Snake</div>
          <div className="score">Score: {state.score}</div>
          <label className="size-select">
            <span>Grid</span>
            <select
              value={gridSize}
              onChange={(event) =>
                handleGridChange(Number(event.target.value) as GridSize)
              }
            >
              {GRID_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size} x {size}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div
          className="board"
          style={{
            gridTemplateColumns: `repeat(${state.gridSize}, 1fr)`,
            gridTemplateRows: `repeat(${state.gridSize}, 1fr)`
          }}
          aria-label="Snake board"
          role="grid"
        >
          {cells.map((cell) => (
            <div key={cell.key} className={cell.className} />
          ))}
        </div>

        <div className="status">
          <div>
            {state.isGameOver
              ? "Game over"
              : state.isPaused
              ? "Paused"
              : "Running"}
          </div>
          <div>
            <button onClick={() => setState((prev) => togglePause(prev))}>
              {state.isPaused ? "Resume" : "Pause"}
            </button>
            <button onClick={reset} style={{ marginLeft: 8 }}>
              Restart
            </button>
          </div>
        </div>

        <div className="controls" aria-label="On-screen controls">
          <div className="control-spacer" />
          <button onClick={() => handleControl("up")}>Up</button>
          <div className="control-spacer" />
          <button onClick={() => handleControl("left")}>Left</button>
          <button onClick={() => handleControl("down")}>Down</button>
          <button onClick={() => handleControl("right")}>Right</button>
        </div>
      </div>
    </main>
  );
}
