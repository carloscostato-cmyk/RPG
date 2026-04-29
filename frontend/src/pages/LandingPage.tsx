import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Dice2, Globe, LogIn, Moon, Play, Sun, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../GameContext';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    createRoom,
    joinRoom,
    isDarkMode,
    toggleDarkMode,
    language,
    setLanguage,
    connectionError,
    isConnected,
  } = useGame();

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
    if (room) navigate(`/sala/${room.code}`);
    else setError('Erro ao criar sala.');

    setLoading(false);
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim() || !roomCode.trim()) return;
    setLoading(true);
    setError('');

    const room = await joinRoom(roomCode, playerName);
    if (room) navigate(`/sala/${room.code}`);
    else setError('Sala nao encontrada. Verifique o codigo.');

    setLoading(false);
  };

  return (
    <div className={`relative flex min-h-screen items-center justify-center overflow-hidden p-4 ${isDarkMode ? 'landing-arcane-bg text-white' : 'landing-arcane-bg-light text-slate-950'}`}>
      <div className="arcane-sigil pointer-events-none absolute inset-0 opacity-60" />
      <div className="pointer-events-none absolute -left-28 top-20 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-16 h-80 w-80 rounded-full bg-fuchsia-400/20 blur-3xl" />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <motion.div
            className="mb-5 inline-flex items-center justify-center rounded-full border border-amber-200/50 bg-white/10 p-4 shadow-[0_0_38px_rgba(251,191,36,0.38)] backdrop-blur"
            animate={{ rotate: [0, 5, -5, 0], y: [0, -6, 6, 0] }}
            transition={{ repeat: Infinity, duration: 4, repeatDelay: 2, ease: 'easeInOut' }}
          >
            <Dice2 size={62} className="text-amber-200 drop-shadow-[0_0_18px_rgba(250,204,21,0.8)]" />
          </motion.div>

          <p className="mb-2 text-xs font-bold uppercase tracking-[0.42em] text-cyan-200">
            Themps NICE GAMES
          </p>
          <h1 className="font-display gold-text mb-3 text-5xl font-extrabold leading-tight drop-shadow-[0_3px_18px_rgba(15,23,42,0.35)]">
            MESA VIRTUAL RPG
          </h1>
          <p className={`text-base font-medium ${isDarkMode ? 'text-cyan-50/80' : 'text-slate-700'}`}>
            Mesa online para RPG de mesa
          </p>
        </div>

        <div className={`rounded-2xl border p-6 shadow-2xl backdrop-blur-xl ${
          isDarkMode
            ? 'border-amber-200/25 bg-slate-950/70 shadow-fuchsia-950/40'
            : 'border-white/70 bg-white/72 shadow-sky-200/60'
        }`}>
          <div className="mb-6 flex gap-2 rounded-xl border border-white/15 bg-slate-950/20 p-1">
            <button
              onClick={() => setMode('create')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-sm font-extrabold uppercase tracking-wide transition ${
                mode === 'create'
                  ? 'bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500 text-white shadow-lg shadow-cyan-500/25'
                  : isDarkMode ? 'text-cyan-50/70 hover:bg-white/10 hover:text-white' : 'text-slate-600 hover:bg-white/70 hover:text-slate-950'
              }`}
            >
              <Play size={18} />
              Criar Sala
            </button>

            <button
              onClick={() => setMode('join')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-sm font-extrabold uppercase tracking-wide transition ${
                mode === 'join'
                  ? 'bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-400 text-white shadow-lg shadow-fuchsia-500/25'
                  : isDarkMode ? 'text-cyan-50/70 hover:bg-white/10 hover:text-white' : 'text-slate-600 hover:bg-white/70 hover:text-slate-950'
              }`}
            >
              <LogIn size={18} />
              Entrar Sala
            </button>
          </div>

          <div className="space-y-4">
            <label className="block">
              <span className={`mb-2 block text-sm font-bold uppercase tracking-wide ${isDarkMode ? 'text-amber-100' : 'text-slate-700'}`}>Seu nome</span>
              <input
                type="text"
                value={playerName}
                onChange={(event) => setPlayerName(event.target.value)}
                placeholder="Como voce quer ser chamado?"
                className={`w-full rounded-lg border px-4 py-3 font-medium outline-none transition focus:ring-2 focus:ring-amber-300 ${
                  isDarkMode ? 'border-cyan-100/10 bg-slate-900/80 text-white placeholder-cyan-50/40' : 'border-white/80 bg-white/85 text-slate-950 placeholder-slate-500'
                }`}
              />
            </label>

            {mode === 'create' ? (
              <label className="block">
                <span className={`mb-2 block text-sm font-bold uppercase tracking-wide ${isDarkMode ? 'text-amber-100' : 'text-slate-700'}`}>Nome da sala</span>
                <input
                  type="text"
                  value={roomName}
                  onChange={(event) => setRoomName(event.target.value)}
                  placeholder="Aventura dos Herois"
                  className={`w-full rounded-lg border px-4 py-3 font-medium outline-none transition focus:ring-2 focus:ring-amber-300 ${
                    isDarkMode ? 'border-cyan-100/10 bg-slate-900/80 text-white placeholder-cyan-50/40' : 'border-white/80 bg-white/85 text-slate-950 placeholder-slate-500'
                  }`}
                />
              </label>
            ) : (
              <label className="block">
                <span className={`mb-2 block text-sm font-bold uppercase tracking-wide ${isDarkMode ? 'text-amber-100' : 'text-slate-700'}`}>Codigo da sala</span>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(event) => setRoomCode(event.target.value.toUpperCase())}
                  placeholder="RPG-ABCD"
                  maxLength={8}
                  className={`w-full rounded-lg border px-4 py-3 text-center font-mono text-xl uppercase tracking-widest outline-none transition focus:ring-2 focus:ring-amber-300 ${
                    isDarkMode ? 'border-cyan-100/10 bg-slate-900/80 text-white placeholder-cyan-50/40' : 'border-white/80 bg-white/85 text-slate-950 placeholder-slate-500'
                  }`}
                />
              </label>
            )}

            {(error || connectionError || !isConnected) && (
              <p className={`rounded-lg px-3 py-2 text-center text-sm ${
                error ? 'bg-red-500/15 text-red-300' : 'bg-yellow-500/15 text-yellow-300'
              }`}>
                {error || connectionError || 'Conectando ao servidor...'}
              </p>
            )}

            <button
              onClick={mode === 'create' ? handleCreateRoom : handleJoinRoom}
              disabled={loading || !isConnected || !playerName.trim() || (mode === 'create' ? !roomName.trim() : !roomCode.trim())}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-300 via-pink-500 to-cyan-400 py-4 font-extrabold uppercase tracking-wide text-slate-950 shadow-xl shadow-pink-500/25 transition hover:scale-[1.01] hover:shadow-cyan-400/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Users size={20} />}
              {mode === 'create' ? 'Criar e entrar' : 'Entrar na sala'}
            </button>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            onClick={toggleDarkMode}
            className={`rounded-full border p-3 shadow-lg backdrop-blur transition ${isDarkMode ? 'border-amber-200/20 bg-slate-950/70 hover:bg-white/10' : 'border-white/70 bg-white/70 hover:bg-white'}`}
            title="Alternar tema"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <button
            onClick={() => setLanguage(language === 'pt' ? 'en' : 'pt')}
            className={`rounded-full border p-3 shadow-lg backdrop-blur transition ${isDarkMode ? 'border-amber-200/20 bg-slate-950/70 hover:bg-white/10' : 'border-white/70 bg-white/70 hover:bg-white'}`}
            title="Idioma"
          >
            <Globe size={20} />
            <span className="ml-1 text-sm font-medium">{language.toUpperCase()}</span>
          </button>
        </div>

        <p className={`mt-8 text-center text-sm font-medium ${isDarkMode ? 'text-cyan-50/60' : 'text-slate-600'}`}>
          Feito para mesas de RPG em tempo real
        </p>
      </motion.div>
    </div>
  );
};
