import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../GameContext';
import { Bell } from 'lucide-react';

export const TurnNotification: React.FC = () => {
  const { timer, currentPlayer, room } = useGame();
  const [show, setShow] = useState(false);

  const currentTurnPlayerId = timer?.playerOrder[timer.currentPlayerIndex];
  const isMyTurn = currentTurnPlayerId === currentPlayer?.id;

  useEffect(() => {
    if (isMyTurn && timer?.isRunning) {
      setShow(true);
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {});
      
      const timeout = setTimeout(() => setShow(false), 5000);
      return () => clearTimeout(timeout);
    } else {
      setShow(false);
    }
  }, [isMyTurn, timer?.currentPlayerIndex, timer?.isRunning]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -100, scale: 0.5 }}
          animate={{ opacity: 1, y: 50, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
          className="fixed left-1/2 top-0 z-[100] -translate-x-1/2"
        >
          <div className="flex items-center gap-4 rounded-2xl border-2 border-amber-400 bg-slate-950/90 px-8 py-4 shadow-[0_0_50px_rgba(251,191,36,0.5)] backdrop-blur-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-400 text-slate-950 shadow-[0_0_20px_rgba(251,191,36,0.8)]">
              <Bell size={28} className="animate-bounce" />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold tracking-tight text-white">SEU TURNO!</h2>
              <p className="text-sm font-medium text-amber-200/80">É a sua vez de agir na mesa.</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
