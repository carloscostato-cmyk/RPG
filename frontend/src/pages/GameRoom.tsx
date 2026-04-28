import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Menu, X, Dice5, MessageSquare, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameCanvas } from '../components/GameCanvas';
import { CharacterSheet } from '../components/CharacterSheet';
import { TurnTimer } from '../components/TurnTimer';
import { MusicPlayer } from '../components/MusicPlayer';
import { useGame } from '../GameContext';

export const GameRoom: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const { room, currentPlayer, leaveRoom, rollDice, isDarkMode } = useGame();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className={`min-h-screen flex flex-col ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <TurnTimer />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative">
          <GameCanvas />

          {/* Mobile FAB Buttons */}
          <div className="fixed bottom-20 left-4 flex flex-col gap-3 md:hidden z-40">
            <button
              onClick={() => rollDice(20)}
              className="bg-red-600 w-14 h-14 rounded-full shadow-xl flex items-center justify-center active:scale-95 transition-transform"
            >
              <Dice5 size={24} />
            </button>
            
            <button className="bg-blue-600 w-14 h-14 rounded-full shadow-xl flex items-center justify-center active:scale-95 transition-transform">
              <MessageSquare size={24} />
            </button>

            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="bg-gray-700 w-14 h-14 rounded-full shadow-xl flex items-center justify-center active:scale-95 transition-transform"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Character Sheet Sidebar */}
        <AnimatePresence>
          {(sidebarOpen || window.innerWidth >= 768) && (
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="w-full md:w-80 lg:w-96 flex-shrink-0 overflow-hidden md:relative fixed right-0 top-0 h-full z-30 shadow-2xl md:shadow-none"
            >
              <div className="flex justify-end p-2 md:hidden">
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="bg-gray-700 p-2 rounded-lg"
                >
                  <X size={20} />
                </button>
              </div>
              
              <CharacterSheet />
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      <MusicPlayer />

      {/* Room Info Header */}
      <div className="fixed top-20 right-4 z-50">
        <div className="bg-gray-800 rounded-lg p-3 text-sm shadow-xl">
          <div className="text-gray-400">Código da Sala</div>
          <div className="font-mono text-xl font-bold text-blue-400">{code}</div>
          <div className="text-gray-400 mt-1">
            {room?.players.filter(p => p.connected).length || 0} jogadores conectados
          </div>
        </div>
      </div>

      {/* Leave Button */}
      <button
        onClick={leaveRoom}
        className="fixed top-20 left-4 z-50 bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg flex items-center gap-2 transition shadow-xl"
      >
        <LogOut size={18} />
        <span className="hidden md:inline">Sair</span>
      </button>
    </div>
  );
};