import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Globe, Play, LogIn, Users, Dice2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGame } from '../GameContext';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { createRoom, joinRoom, isDarkMode, toggleDarkMode, language, setLanguage } = useGame();
  
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [playerName, setPlayerName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [role, setRole] = useState<'player' | 'spectator'>('player');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const codeParam = searchParams.get('code');
    const roleParam = searchParams.get('role') as 'player' | 'spectator' | null;
    
    if (codeParam) {
      setRoomCode(codeParam.toUpperCase());
      setMode('join');
    }
    if (roleParam && (roleParam === 'player' || roleParam === 'spectator')) {
      setRole(roleParam);
    }
  }, [searchParams]);

  const handleCreateRoom = async () => {
    if (!playerName.trim() || !roomName.trim()) return;
    setLoading(true);
    setError('');
    // Master role is forced on backend, so we don't pass 'role' choice here
    const room = await createRoom(roomName, playerName, 'player'); 
    if (room) {
      navigate(`/sala/${room.code}`);
    } else {
      setError('Erro ao criar sala');
    }
    setLoading(false);
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim() || !roomCode.trim()) {
      setError('Preencha seu nome e o código da sala');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const room = await joinRoom(roomCode, playerName, role);
      if (room) {
        navigate(`/sala/${room.code}`);
      } else {
        setError('Sala não encontrada ou código inválido');
      }
    } catch (err) {
      setError('Erro de conexão');
    }
    setLoading(false);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${isDarkMode ? 'bg-[#0f172a]' : 'bg-gray-100'}`}>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-blue-500 mb-1">IMAGINARY TABLES</h1>
          <p className="text-gray-500 text-sm">Sua mesa de RPG virtual</p>
        </div>

        <div className={`rounded-xl p-6 shadow-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex border-b border-gray-700 mb-6">
            <button
              onClick={() => setMode('create')}
              className={`flex-1 pb-3 font-bold transition-colors ${mode === 'create' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'}`}
            >
              CRIAR SALA
            </button>
            <button
              onClick={() => setMode('join')}
              className={`flex-1 pb-3 font-bold transition-colors ${mode === 'join' ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-500'}`}
            >
              ENTRAR NA SALA
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Seu Nome</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className={`w-full rounded-lg px-4 py-2 outline-none border ${isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              />
            </div>

            {mode === 'join' && (
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Entrar como</label>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setRole('player')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${role === 'player' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-transparent border-gray-600 text-gray-400'}`}
                  >
                    JOGADOR
                  </button>
                  <button 
                    onClick={() => setRole('spectator')}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${role === 'spectator' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-transparent border-gray-600 text-gray-400'}`}
                  >
                    ESPECTADOR
                  </button>
                </div>
              </div>
            )}

            {mode === 'create' ? (
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Nome da Sala</label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className={`w-full rounded-lg px-4 py-2 outline-none border ${isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Código da Sala</label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className={`w-full rounded-lg px-4 py-2 outline-none border text-center font-mono text-xl ${isDarkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                />
              </div>
            )}

            {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}

            <button
              onClick={mode === 'create' ? handleCreateRoom : handleJoinRoom}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-all"
            >
              {loading ? 'CARREGANDO...' : (mode === 'create' ? 'CRIAR COMO MESTRE' : 'ENTRAR NA SALA')}
            </button>
          </div>
        </div>

        <div className="mt-4 flex justify-center gap-4">
          <button onClick={toggleDarkMode} className="text-gray-500 hover:text-white transition">
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button onClick={() => setLanguage(language === 'pt' ? 'en' : 'pt')} className="text-gray-500 hover:text-white transition text-xs font-bold">
            {language.toUpperCase()}
          </button>
        </div>
      </motion.div>
    </div>
  );
};