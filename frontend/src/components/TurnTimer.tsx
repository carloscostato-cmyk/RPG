import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Plus, Play, Pause, SkipForward } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../GameContext';

export const TurnTimer: React.FC = () => {
  const { room, currentPlayer, socket } = useGame();
  const [timeRemaining, setTimeRemaining] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);

  const isMaster = currentPlayer?.isMaster;
  const players = room?.players.filter(p => p.connected) || [];
  const currentTurnPlayer = players[currentPlayerIndex];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            nextTurn();
            return 60;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeRemaining]);

  const playBeep = useCallback((frequency: number, duration: number) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      gainNode.gain.value = 0.3;
      
      oscillator.start();
      setTimeout(() => oscillator.stop(), duration);
    } catch (e) {
      console.log('Audio not supported');
    }
  }, []);

  useEffect(() => {
    if (timeRemaining === 30) playBeep(440, 200);
    if (timeRemaining === 10) playBeep(660, 300);
    if (timeRemaining <= 5 && timeRemaining > 0) playBeep(880, 150);
  }, [timeRemaining, playBeep]);

  const nextTurn = useCallback(() => {
    setCurrentPlayerIndex(prev => (prev + 1) % players.length);
    setTimeRemaining(60);
  }, [players.length]);

  const extendTime = useCallback((seconds: number) => {
    setTimeRemaining(prev => prev + seconds);
  }, []);

  const getTimerColor = () => {
    if (timeRemaining <= 10) return 'bg-red-600';
    if (timeRemaining <= 30) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="sticky top-0 z-50 bg-gray-900 border-b border-gray-700 p-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Clock className="text-gray-400" size={20} />
          
          <div className="flex flex-col">
            <span className="text-white font-medium">
              {currentTurnPlayer?.name || 'Aguardando jogador'}
            </span>
            <span className="text-xs text-gray-400">
              Turno {currentPlayerIndex + 1} de {players.length}
            </span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={timeRemaining}
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className={`font-mono text-2xl font-bold px-4 py-1 rounded-lg ${getTimerColor()} ${timeRemaining <= 10 ? 'animate-pulse' : ''}`}
          >
            {formatTime(timeRemaining)}
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center gap-2">
          {isMaster && (
            <>
              <button
                onClick={() => setIsRunning(!isRunning)}
                className="bg-gray-700 hover:bg-gray-600 p-2 rounded transition"
              >
                {isRunning ? <Pause size={18} /> : <Play size={18} />}
              </button>
              
              <button
                onClick={nextTurn}
                className="bg-gray-700 hover:bg-gray-600 p-2 rounded transition"
              >
                <SkipForward size={18} />
              </button>
              
              <button
                onClick={() => extendTime(30)}
                className="bg-blue-600 hover:bg-blue-700 p-2 rounded transition flex items-center gap-1 text-sm"
              >
                <Plus size={16} />
                30s
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};