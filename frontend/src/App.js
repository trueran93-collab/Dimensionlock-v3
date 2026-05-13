import React, { useState, useCallback, useEffect } from 'react';
import MainMenu from './components/MainMenu.jsx';
import GameCanvas from './components/GameCanvas.jsx';
import GameOver from './components/GameOver.jsx';
import { soundEngine } from './game/sound.js';
import './App.css';

// Screens: 'menu' | 'playing' | 'game_over'

function App() {
  const [screen, setScreen] = useState('menu');
  const [gameResult, setGameResult] = useState(null);
  const [gameKey, setGameKey] = useState(0);

  // Init audio on first user interaction
  const initAudio = useCallback(() => {
    soundEngine.init();
  }, []);

  useEffect(() => {
    window.addEventListener('click', initAudio, { once: true });
    window.addEventListener('keydown', initAudio, { once: true });
    return () => {
      window.removeEventListener('click', initAudio);
      window.removeEventListener('keydown', initAudio);
    };
  }, [initAudio]);

  const handlePlay = useCallback(() => {
    soundEngine.init();
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
    <div style={{ margin: 0, padding: 0, background: '#04020e', minHeight: '100vh', overflow: 'hidden' }}>
      {screen === 'menu' && (
        <MainMenu onPlay={handlePlay} />
      )}

      {screen === 'playing' && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: '100vh', background: '#04020e',
          position: 'relative'
        }}>
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
