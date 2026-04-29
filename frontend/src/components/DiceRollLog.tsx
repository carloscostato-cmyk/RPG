import React from 'react';
import { useGame } from '../GameContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Dice5, User } from 'lucide-react';

export const DiceRollLog: React.FC = () => {
  const { diceRolls, room } = useGame();

  const getPlayerName = (id: string) => {
    return room?.players.find(p => p.id === id)?.name || 'Desconhecido';
  };

  return (
    <div className="flex flex-col gap-2 max-h-48 overflow-y-auto p-2 bg-black/40 rounded-lg backdrop-blur-sm border border-white/10">
      <AnimatePresence initial={false}>
        {diceRolls.map((roll) => (
          <motion.div
            key={roll.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col gap-1 bg-gray-800/80 p-2 rounded border-l-4 border-purple-500 shadow-sm"
          >
            <div className="flex items-center justify-between text-[10px] text-gray-400">
              <span className="flex items-center gap-1 font-medium text-blue-400">
                <User size={10} /> {getPlayerName(roll.playerId)}
              </span>
              <span>{new Date(roll.timestamp).toLocaleTimeString()}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-xs font-bold text-white flex items-center gap-1">
                  <Dice5 size={12} className="text-purple-400" /> {roll.notation}
                </span>
                <div className="flex gap-1 flex-wrap mt-1">
                  {roll.results.map((res, i) => (
                    <span key={i} className="bg-gray-700 text-white px-1.5 py-0.5 rounded text-[10px] min-w-[20px] text-center border border-white/5">
                      {res}
                    </span>
                  ))}
                  {roll.bonus !== 0 && (
                    <span className={`text-[10px] flex items-center ${roll.bonus > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {roll.bonus > 0 ? '+' : ''}{roll.bonus}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col items-end">
                <span className="text-sm font-black text-white bg-purple-600 px-2 py-0.5 rounded shadow-lg">
                  {roll.total}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      {diceRolls.length === 0 && (
        <div className="text-center text-gray-500 text-[10px] py-4">
          Nenhuma rolagem ainda
        </div>
      )}
    </div>
  );
};
