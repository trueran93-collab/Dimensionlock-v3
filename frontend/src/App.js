import React, { useState, useCallback } from 'react';
import MainMenu from './components/MainMenu.jsx';
import GameCanvas from './components/GameCanvas.jsx';
import GameOver from './components/GameOver.jsx';
import './App.css';

// App screen states: 'menu' | 'playing' | 'game_over'

function App() {
  const [screen, setScreen] = useState('menu');
  const [gameResult, setGameResult] = useState(null);
  const [gameKey, setGameKey] = useState(0);

  const handlePlay = useCallback(() => {
    setScreen('playing');
  }, []);

  const handleGameOver = useCallback((result) => {
    setGameResult(result);
    setScreen('game_over');
  }, []);

  const handleRestart = useCallback(() => {
    setGameKey(k => k + 1);
    setScreen('playing');
  }, []);

  const handleMenu = useCallback(() => {
    setScreen('menu');
    setGameResult(null);
  }, []);

  return (
    <div style={{ margin: 0, padding: 0, background: '#0a0a0f', minHeight: '100vh', overflow: 'hidden' }}>
      {screen === 'menu' && (
        <MainMenu onPlay={handlePlay} />
      )}

      {screen === 'playing' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0a0a0f' }}>
          <GameCanvas
            key={gameKey}
            onGameOver={handleGameOver}
            onReturnToMenu={handleMenu}
          />
        </div>
      )}

      {screen === 'game_over' && (
        <GameOver
          result={gameResult}
          onRestart={handleRestart}
          onMenu={handleMenu}
        />
      )}
    </div>
  );
}

export default App;
