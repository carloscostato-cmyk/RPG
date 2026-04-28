import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Globe, Play, LogIn, Users, Dice2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../GameContext';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { createRoom, joinRoom, isDarkMode, toggleDarkMode, language, setLanguage } = useGame();
  
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [playerName, setPlayerName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateRoom = async () => {
    if (!playerName.trim() || !roomName.trim()) return;
    
    setLoading(true);
    setError('');
    
    const room = await createRoom(roomName, playerName);
    if (room) {
      navigate(`/sala/${room.code}`);
    } else {
      setError('Erro ao criar sala');
    }
    
    setLoading(false);
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim() || !roomCode.trim()) return;
    
    setLoading(true);
    setError('');
    
    const room = await joinRoom(roomCode, playerName);
    if (room) {
      navigate(`/sala/${room.code}`);
    } else {
      setError('Sala não encontrada. Verifique o código.');
    }
    
    setLoading(false);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div 
            className="inline-flex items-center justify-center mb-4"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 4, repeatDelay: 5 }}
          >
            <Dice2 size={64} className="text-blue-500" />
          </motion.div>
          
          <h1 className="text-4xl font-bold mb-2">MESA VIRTUAL RPG</h1>
          <p className={`text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Jogar nunca foi tão fácil
          </p>
        </div>

        <div className={`rounded-2xl p-6 shadow-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setMode('create')}
              className={`flex-1 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition ${
                mode === 'create'
                  ? 'bg-blue-600 text-white'
                  : isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Play size={18} />
              Criar Sala
            </button>
            
            <button
              onClick={() => setMode('join')}
              className={`flex-1 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition ${
                mode === 'join'
                  ? 'bg-blue-600 text-white'
                  : isDarkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <LogIn size={18} />
              Entrar Sala
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Seu Nome</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Como você quer ser chamado?"
                className={`w-full rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition ${
                  isDarkMode ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-gray-100 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>

            {mode === 'create' ? (
              <div>
                <label className="block text-sm font-medium mb-2">Nome da Sala</label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Aventura dos Heróis"
                  className={`w-full rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition ${
                    isDarkMode ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-gray-100 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-2">Código da Sala</label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="RPG123"
                  maxLength={6}
                  className={`w-full rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 text-center font-mono text-xl uppercase tracking-widest transition ${
                    isDarkMode ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-gray-100 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>
            )}

            {error && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-500 text-sm text-center"
              >
                {error}
              </motion.p>
            )}

            <button
              onClick={mode === 'create' ? handleCreateRoom : handleJoinRoom}
              disabled={loading || !playerName.trim() || (mode === 'create' ? !roomName.trim() : !roomCode.trim())}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Users size={20} />
              )}
              {mode === 'create' ? 'Criar e Entrar' : 'Entrar na Sala'}
            </button>
          </div>
        </div>

        <div className="mt-6 flex justify-center items-center gap-4">
          <button
            onClick={toggleDarkMode}
            className={`p-3 rounded-full transition ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100 shadow'}`}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          <button
            onClick={() => setLanguage(language === 'pt' ? 'en' : 'pt')}
            className={`p-3 rounded-full transition ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100 shadow'}`}
          >
            <Globe size={20} />
            <span className="ml-1 text-sm font-medium">{language.toUpperCase()}</span>
          </button>
        </div>

        <p className={`text-center mt-8 text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
          Feito com ❤️ para jogadores de RPG
        </p>
      </motion.div>
    </div>
  );
};