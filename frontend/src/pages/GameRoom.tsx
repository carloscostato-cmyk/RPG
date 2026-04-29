import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Dice5, LogOut, Menu, MessageSquare, Users, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { CharacterSheet } from '../components/CharacterSheet';
import { GameCanvas } from '../components/GameCanvas';
import { MusicPlayer } from '../components/MusicPlayer';
import { TurnTimer } from '../components/TurnTimer';
import { TurnNotification } from '../components/TurnNotification';
import { DiceOverlay } from '../components/DiceOverlay';
import { useGame } from '../GameContext';

export const GameRoom: React.FC = () => {
  const navigate = useNavigate();
  const { code } = useParams<{ code: string }>();
  const {
    room,
    currentPlayer,
    leaveRoom,
    rollDice,
    sendMessage,
    diceRolls,
    chatMessages,
    connectionError,
    isConnected,
    isDarkMode,
  } = useGame();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [message, setMessage] = useState('');

  const submitMessage = () => {
    if (!message.trim()) return;
    sendMessage(message);
    setMessage('');
  };

  const handleLeave = () => {
    leaveRoom();
    navigate('/');
  };

  return (
    <div
      className={`flex min-h-screen flex-col ${
        isDarkMode
          ? 'bg-[#080b14] text-white'
          : 'bg-[radial-gradient(circle_at_top_left,#fff7d6_0,#dbeafe_34%,#e0e7ff_100%)] text-slate-950'
      }`}
    >
      <TurnTimer />
      <TurnNotification />
      <DiceOverlay />

      {(connectionError || !isConnected) && (
        <div className="border-b border-amber-300 bg-amber-400 px-4 py-2 text-center text-sm font-semibold text-slate-950 shadow-[0_0_24px_rgba(251,191,36,0.45)]">
          {connectionError || 'Reconectando ao servidor...'}
        </div>
      )}

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <main className="relative min-w-0 flex-1 overflow-hidden">
          <GameCanvas />

          <div className="fixed bottom-24 left-4 z-40 flex flex-col gap-3 md:hidden">
            <button
              onClick={() => rollDice(20)}
              className="flex h-14 w-14 items-center justify-center rounded-full border border-rose-200/70 bg-gradient-to-br from-rose-500 via-red-600 to-amber-500 text-white shadow-[0_0_24px_rgba(244,63,94,0.55)] active:scale-95"
              title="Rolar d20"
            >
              <Dice5 size={24} />
            </button>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex h-14 w-14 items-center justify-center rounded-full border border-cyan-200/50 bg-slate-950/90 text-cyan-100 shadow-[0_0_22px_rgba(34,211,238,0.35)] backdrop-blur active:scale-95"
              title="Abrir painel"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </main>

        <AnimatePresence>
          {sidebarOpen && (
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-cyan-300/25 bg-slate-950/95 shadow-[0_0_45px_rgba(14,165,233,0.25)] backdrop-blur-xl md:relative md:z-20 md:w-96 md:max-w-none"
            >
              <div className="flex items-center justify-between border-b border-cyan-300/20 bg-cyan-950/20 p-3 md:hidden">
                <span className="font-semibold">Painel do jogador</span>
                <button onClick={() => setSidebarOpen(false)} className="rounded bg-slate-800 p-2 text-cyan-100">
                  <X size={18} />
                </button>
              </div>
              <div className="min-h-0 flex-1">
                <CharacterSheet />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      <section className="relative border-t border-cyan-300/20 bg-[linear-gradient(90deg,#0b1020_0%,#172554_38%,#4c1d95_72%,#111827_100%)] p-3 text-white shadow-[0_-18px_45px_rgba(30,64,175,0.35)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-200 to-transparent" />
        <div className="mx-auto grid max-w-7xl gap-3 lg:grid-cols-[1fr_1fr_1.2fr]">
          <div className="rounded-lg border border-cyan-200/20 bg-slate-950/55 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-cyan-100">
              <Users size={16} />
              Sala {room?.code || code || '--'}
            </div>
            <div className="space-y-1 text-sm text-slate-200">
              {(room?.players || []).map((player) => (
                <div key={player.id} className="flex items-center justify-between rounded border border-white/5 bg-white/[0.03] px-2 py-1">
                  <span>{player.name}{player.id === currentPlayer?.id ? ' (voce)' : ''}</span>
                  <span className={player.connected ? 'text-emerald-300' : 'text-slate-500'}>
                    {player.isMaster ? 'Mestre' : player.connected ? 'Online' : 'Offline'}
                  </span>
                </div>
              ))}
              {!room && <div className="text-slate-400">Nenhuma sala carregada.</div>}
            </div>
          </div>

          <div className="rounded-lg border border-amber-200/20 bg-slate-950/55 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-100">
              <Dice5 size={16} />
              Dados
            </div>
            <div className="max-h-28 space-y-1 overflow-y-auto text-sm text-slate-200">
              {diceRolls.slice(-6).reverse().map((roll) => (
                <div key={roll.id} className="flex items-center justify-between rounded border border-amber-200/10 bg-amber-300/[0.04] px-2 py-1">
                  <span>{roll.playerName} rolou d{roll.sides}{roll.modifier ? ` ${roll.modifier >= 0 ? '+' : ''}${roll.modifier}` : ''}</span>
                  <strong className="text-amber-200">{roll.total}</strong>
                </div>
              ))}
              {diceRolls.length === 0 && <div className="text-slate-400">Nenhuma rolagem ainda.</div>}
            </div>
          </div>

          <div className="rounded-lg border border-fuchsia-200/20 bg-slate-950/55 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-fuchsia-100">
              <MessageSquare size={16} />
              Chat
            </div>
            <div className="mb-2 max-h-24 space-y-1 overflow-y-auto text-sm text-slate-200">
              {chatMessages.slice(-5).map((chat) => (
                <div key={chat.id} className="rounded border border-fuchsia-200/10 bg-fuchsia-300/[0.04] px-2 py-1">
                  <strong className="text-cyan-200">{chat.playerName}:</strong> {chat.message}
                </div>
              ))}
              {chatMessages.length === 0 && <div className="text-slate-400">Sem mensagens.</div>}
            </div>
            <div className="flex gap-2">
              <input
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && submitMessage()}
                placeholder="Mensagem"
                className="min-w-0 flex-1 rounded border border-white/10 bg-slate-950/80 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/40"
              />
              <button onClick={submitMessage} className="rounded bg-gradient-to-r from-cyan-500 to-fuchsia-500 px-3 py-2 text-sm font-semibold text-white shadow-[0_0_16px_rgba(34,211,238,0.3)] hover:from-cyan-400 hover:to-fuchsia-400">
                Enviar
              </button>
            </div>
          </div>
        </div>
      </section>

      <MusicPlayer />

      <button
        onClick={handleLeave}
        className="fixed left-4 top-20 z-40 flex items-center gap-2 rounded-lg border border-rose-200/50 bg-rose-600/90 px-4 py-2 text-white shadow-[0_0_20px_rgba(225,29,72,0.35)] backdrop-blur hover:bg-rose-500"
      >
        <LogOut size={18} />
        <span className="hidden md:inline">Sair</span>
      </button>
    </div>
  );
};
