import React, { useState, useCallback, useEffect, useRef } from 'react';
import IntroCinematic from './components/IntroCinematic.jsx';
import MainMenu from './components/MainMenu.jsx';
import GameCanvas from './components/GameCanvas.jsx';
import GameOver from './components/GameOver.jsx';
import FloorComplete from './components/FloorComplete.jsx';
import { soundEngine } from './game/sound.js';
import './App.css';

// Screens: 'intro' | 'menu' | 'playing' | 'floor_complete' | 'game_over'

function App() {
  const [screen, setScreen] = useState('intro');
  const [gameResult, setGameResult] = useState(null);
  const [floorResult, setFloorResult] = useState(null);
  const [continueSignal, setContinueSignal] = useState(0);
  const [gameKey, setGameKey] = useState(0);
  const audioReadyRef = useRef(false);

  // Init audio on first user interaction
  const initAudio = useCallback(() => {
    if (audioReadyRef.current) return;
    audioReadyRef.current = true;
    soundEngine.init();
    // Start menu music after the audio context is unlocked
    if (screen === 'intro' || screen === 'menu') {
      soundEngine.playMenuMusic();
    }
  }, [screen]);

  useEffect(() => {
    const handler = () => initAudio();
    window.addEventListener('click', handler, { once: true });
    window.addEventListener('keydown', handler, { once: true });
    window.addEventListener('touchstart', handler, { once: true });
    return () => {
      window.removeEventListener('click', handler);
      window.removeEventListener('keydown', handler);
      window.removeEventListener('touchstart', handler);
    };
  }, [initAudio]);

  const handleIntroComplete = useCallback(() => {
    setScreen('menu');
    if (audioReadyRef.current) soundEngine.playMenuMusic();
  }, []);

  const handlePlay = useCallback(() => {
    soundEngine.init();
    soundEngine.stopMenuMusic();
    setScreen('playing');
  }, []);

  const handleGameOver = useCallback((result) => {
    setGameResult(result);
    setScreen('game_over');
  }, []);

  const handleFloorComplete = useCallback((info) => {
    setFloorResult(info);
    setScreen('floor_complete');
  }, []);

  const handleFloorContinue = useCallback(() => {
    // Continue to next floor (engine waits for upgrade selection)
    setContinueSignal(c => c + 1);
    setScreen('playing');
  }, []);

  const handleRestart = useCallback(() => {
    setGameKey(k => k + 1);
    setScreen('playing');
  }, []);

  const handleMenu = useCallback(() => {
    setScreen('menu');
    setGameResult(null);
    setFloorResult(null);
    soundEngine.playMenuMusic();
  }, []);

  return (
    <div style={{ margin: 0, padding: 0, background: '#04020e', minHeight: '100vh', overflow: 'hidden' }}>
      {screen === 'intro' && (
        <IntroCinematic onComplete={handleIntroComplete} />
      )}

      {screen === 'menu' && (
        <MainMenu onPlay={handlePlay} />
      )}

      {(screen === 'playing' || screen === 'floor_complete') && (
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'radial-gradient(ellipse at center top, #0a0418 0%, #04020e 50%, #02010a 100%)',
          position: 'relative',
          paddingTop: 0,
        }}>
          {/* Decorative bottom band visible on mobile when canvas doesn't fill viewport */}
          <div style={{
            position: 'fixed',
            left: 0, right: 0, bottom: 0,
            height: '50vh',
            background: 'linear-gradient(to top, rgba(20,8,40,0.6) 0%, transparent 100%)',
            pointerEvents: 'none',
            zIndex: 0,
          }} />
          <GameCanvas
            key={gameKey}
            onGameOver={handleGameOver}
            onFloorComplete={handleFloorComplete}
            onReturnToMenu={handleMenu}
            paused={screen === 'floor_complete'}
            continueSignal={continueSignal}
          />
          {screen === 'floor_complete' && floorResult && (
            <FloorComplete
              result={floorResult}
              onContinue={handleFloorContinue}
              onMenu={handleMenu}
            />
          )}
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
