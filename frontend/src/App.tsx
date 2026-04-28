import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GameProvider } from './GameContext';
import { LandingPage } from './pages/LandingPage';
import { GameRoom } from './pages/GameRoom';

export const App: React.FC = () => {
  return (
    <GameProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/sala/:code" element={<GameRoom />} />
        </Routes>
      </Router>
    </GameProvider>
  );
};

export default App;