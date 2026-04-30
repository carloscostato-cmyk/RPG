import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../GameContext';
import { DiceRoll } from '@shared/types';

export const DiceOverlay: React.FC = () => {
  const { socket } = useGame();
  const [activeRoll, setActiveRoll] = useState<DiceRoll | null>(null);

  useEffect(() => {
    if (!socket) return;

    const handleRoll = (roll: DiceRoll) => {
      setActiveRoll(roll);
      setTimeout(() => setActiveRoll(null), 4000);
    };

    socket.on('dice:rolled', handleRoll);
    return () => {
      socket.off('dice:rolled', handleRoll);
    };
  }, [socket]);

  return (
    <AnimatePresence>
      {activeRoll && (
        <div className="pointer-events-none fixed inset-0 z-[110] flex items-center justify-center overflow-hidden bg-slate-950/40 backdrop-blur-[4px]">
          <motion.div
            initial={{ scale: 0, rotate: 0, x: -300, y: -300, opacity: 0 }}
            animate={{ 
              scale: [0, 1.3, 0.9, 1.1, 1],
              rotate: [0, 360, 720, 900, 1080],
              x: [-300, 150, -80, 40, 0],
              y: [-300, 100, -40, 20, 0],
              opacity: 1 
            }}
            exit={{ scale: 2, opacity: 0, filter: 'blur(15px)', transition: { duration: 0.3 } }}
            transition={{ 
              duration: 1.2, 
              times: [0, 0.4, 0.7, 0.9, 1],
              ease: "easeOut"
            }}
            className="relative"
          >
            {/* Sombras e Brilhos Dinâmicos */}
            <motion.div 
              animate={{ 
                scale: [1, 1.5, 1],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="absolute inset-0 -z-10 rounded-full bg-amber-500/40 blur-[80px]" 
            />
            
            {/* O Dado (Hexagono/D20 style) */}
            <div className="relative flex h-56 w-56 items-center justify-center">
              <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full drop-shadow-[0_0_40px_rgba(251,191,36,0.7)]">
                <defs>
                  <linearGradient id="diceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fef3c7" />
                    <stop offset="40%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#b45309" />
                  </linearGradient>
                </defs>
                <path
                  d="M50 5 L90 25 L90 75 L50 95 L10 75 L10 25 Z"
                  fill="url(#diceGradient)"
                  stroke="#451a03"
                  strokeWidth="2.5"
                />
                {/* Linhas de profundidade para parecer 3D */}
                <path d="M50 5 L50 35 L10 25" fill="none" stroke="#451a03" strokeWidth="1" opacity="0.4" />
                <path d="M50 35 L90 25" fill="none" stroke="#451a03" strokeWidth="1" opacity="0.4" />
                <path d="M50 35 L50 95" fill="none" stroke="#451a03" strokeWidth="1" opacity="0.4" />
              </svg>

              <div className="relative flex flex-col items-center justify-center text-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8, type: 'spring', damping: 10 }}
                  className="flex flex-col items-center"
                >
                  <span className="font-serif text-7xl font-black text-slate-950 drop-shadow-[0_2px_4px_rgba(255,255,255,0.4)]">
                    {activeRoll.total}
                  </span>
                  
                  <div className="mt-2 flex flex-col items-center">
                    <span className="rounded-full bg-slate-950/20 px-3 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-amber-950">
                      {activeRoll.notation}
                    </span>
                    <span className="mt-1 font-serif text-sm font-bold text-slate-900 border-b border-slate-950/10">
                      {activeRoll.playerName || 'Jogador'}
                    </span>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Ondas de choque no impacto */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [0.5, 2.5], 
                opacity: [0.8, 0],
                borderWidth: ["8px", "0px"]
              }}
              transition={{ delay: 0.6, duration: 0.6, ease: "easeOut" }}
              className="absolute inset-0 -z-10 rounded-full border-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.4)]"
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
