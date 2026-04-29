import React, { useCallback, useEffect, useState } from 'react';
import { Clock, Pause, Play, Plus, RotateCcw, SkipForward, ListOrdered, ChevronUp, ChevronDown, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../GameContext';

export const TurnTimer: React.FC = () => {
  const { room, currentPlayer, timer, startTimer, pauseTimer, resetTimer, nextTurn, extendTimer, setTimerOrder } = useGame();
  const [isManagingOrder, setIsManagingOrder] = useState(false);
  const [tempOrder, setTempOrder] = useState<string[]>([]);

  const isMaster = Boolean(currentPlayer?.isMaster);
  const players = room?.players.filter((player) => player.connected) || [];
  const currentTurnPlayerId = timer?.playerOrder[timer.currentPlayerIndex];
  const currentTurnPlayer = players.find((player) => player.id === currentTurnPlayerId);
  const timeRemaining = timer?.timeRemaining || 60;

  useEffect(() => {
    if (timer?.playerOrder) setTempOrder(timer.playerOrder);
  }, [timer?.playerOrder]);

  const playBeep = useCallback((frequency: number, duration: number) => {
    try {
      const audioWindow = window as typeof window & { webkitAudioContext?: typeof AudioContext };
      const AudioContextClass = audioWindow.AudioContext || audioWindow.webkitAudioContext;
      if (!AudioContextClass) return;
      const audioContext = new AudioContextClass();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = frequency;
      gainNode.gain.value = 0.2;
      oscillator.start();
      setTimeout(() => oscillator.stop(), duration);
    } catch {
      // Audio feedback is optional.
    }
  }, []);

  useEffect(() => {
    if (!timer?.isRunning) return;
    if (timeRemaining === 30) playBeep(440, 150);
    if (timeRemaining === 10) playBeep(660, 200);
    if (timeRemaining <= 5 && timeRemaining > 0) playBeep(880, 120);
  }, [playBeep, timeRemaining, timer?.isRunning]);

  const moveOrder = (index: number, direction: 'up' | 'down') => {
    const next = [...tempOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= next.length) return;
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    setTempOrder(next);
  };

  const handleSaveOrder = () => {
    setTimerOrder(tempOrder);
    setIsManagingOrder(false);
  };

  return (
    <div className="sticky top-0 z-50 border-b border-[#c9a45f]/25 bg-[linear-gradient(180deg,#0f172a_0%,#020617_100%)] p-3 text-[#f6ead0] shadow-[0_15px_35px_rgba(0,0,0,0.4)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-amber-400/30 bg-slate-900 shadow-inner shadow-black/50 ${timer?.isRunning ? 'animate-pulse ring-2 ring-amber-400/20' : ''}`}>
            <Clock className="text-amber-400" size={24} />
          </div>
          <div className="min-w-0">
            <div className="truncate font-serif text-base font-bold tracking-tight text-white">
              {currentTurnPlayer?.name || 'Aguardando...'}
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <span className="rounded-full bg-slate-800 px-2 py-0.5">Turno {(timer?.currentPlayerIndex || 0) + 1}/{timer?.playerOrder.length || 0}</span>
              {timer?.isManualOrder && <span className="text-amber-400/80">Ordem Manual</span>}
            </div>
          </div>
        </div>

        <motion.div
          key={timeRemaining}
          initial={{ scale: 0.9, opacity: 0.8 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`rounded-xl border-2 px-6 py-2 font-mono text-3xl font-black shadow-2xl ${getTimerColor(timeRemaining)} ${timeRemaining <= 10 ? 'animate-pulse' : ''}`}
        >
          {formatTime(timeRemaining)}
        </motion.div>

        <div className="flex items-center gap-2">
          {isMaster && (
            <>
              <button
                onClick={() => setIsManagingOrder(!isManagingOrder)}
                className={`rounded-lg border p-2.5 transition ${isManagingOrder ? 'border-amber-400 bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(251,191,36,0.3)]' : 'border-slate-700 bg-slate-900 text-slate-400 hover:border-amber-400/50 hover:text-white'}`}
                title="Gerenciar Ordem"
              >
                <ListOrdered size={20} />
              </button>
              
              <div className="h-8 w-px bg-slate-700 mx-1" />
              
              <button
                onClick={timer?.isRunning ? pauseTimer : startTimer}
                className={`rounded-lg border p-2.5 transition ${timer?.isRunning ? 'border-amber-400/50 bg-slate-800 text-amber-400' : 'border-emerald-500 bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500'}`}
                title={timer?.isRunning ? 'Pausar' : 'Iniciar'}
              >
                {timer?.isRunning ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
              </button>
              <button
                onClick={nextTurn}
                className="rounded-lg border border-slate-700 bg-slate-900 p-2.5 text-slate-400 transition hover:border-amber-400/50 hover:text-white"
                title="Próximo"
              >
                <SkipForward size={20} />
              </button>
              <button
                onClick={resetTimer}
                className="rounded-lg border border-slate-700 bg-slate-900 p-2.5 text-slate-400 transition hover:border-red-400/50 hover:text-red-400"
                title="Resetar"
              >
                <RotateCcw size={20} />
              </button>
              <button
                onClick={() => extendTimer(30)}
                className="flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-black text-slate-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-400 active:scale-95"
              >
                <Plus size={18} strokeWidth={3} />
                30s
              </button>
            </>
          )}
        </div>
      </div>

      {/* Manual Order Modal Overlay */}
      <AnimatePresence>
        {isManagingOrder && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute left-1/2 top-20 z-50 w-72 -translate-x-1/2 rounded-2xl border border-amber-400/30 bg-slate-950 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl"
          >
            <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="font-serif text-lg font-bold text-white">Iniciativa</h3>
              <button onClick={() => setIsManagingOrder(false)} className="text-slate-500 hover:text-white"><X size={20} /></button>
            </div>
            
            <div className="space-y-2">
              {tempOrder.map((playerId, idx) => {
                const p = room?.players.find(item => item.id === playerId);
                return (
                  <div key={playerId} className={`flex items-center justify-between rounded-lg border p-2 ${idx === timer?.currentPlayerIndex ? 'border-amber-400/50 bg-amber-400/5' : 'border-white/5 bg-white/5'}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-black text-amber-500/50 w-4">{idx + 1}</span>
                      <span className="truncate text-sm font-bold text-white">{p?.name || 'Desconectado'}</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => moveOrder(idx, 'up')} className="p-1 text-slate-500 hover:text-white disabled:opacity-20" disabled={idx === 0}><ChevronUp size={16} /></button>
                      <button onClick={() => moveOrder(idx, 'down')} className="p-1 text-slate-500 hover:text-white disabled:opacity-20" disabled={idx === tempOrder.length - 1}><ChevronDown size={16} /></button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleSaveOrder}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-500"
            >
              <Save size={18} />
              Salvar Ordem
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function getTimerColor(timeRemaining: number) {
  if (timeRemaining <= 10) return 'border-red-500/50 bg-red-950/40 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]';
  if (timeRemaining <= 30) return 'border-amber-400/50 bg-amber-400/10 text-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.2)]';
  return 'border-emerald-500/40 bg-emerald-500/5 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]';
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
