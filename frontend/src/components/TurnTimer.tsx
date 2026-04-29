import React, { useCallback, useEffect } from 'react';
import { Clock, Pause, Play, Plus, RotateCcw, SkipForward } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGame } from '../GameContext';

export const TurnTimer: React.FC = () => {
  const { room, currentPlayer, timer, startTimer, pauseTimer, resetTimer, nextTurn, extendTimer } = useGame();
  const isMaster = Boolean(currentPlayer?.isMaster);
  const players = room?.players.filter((player) => player.connected) || [];
  const currentTurnPlayerId = timer?.playerOrder[timer.currentPlayerIndex];
  const currentTurnPlayer = players.find((player) => player.id === currentTurnPlayerId);
  const timeRemaining = timer?.timeRemaining || 60;

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

  return (
    <div className="sticky top-0 z-50 border-b border-[#c9a45f]/25 bg-[linear-gradient(180deg,#101827_0%,#182132_100%)] p-3 text-[#f6ead0] shadow-[0_12px_30px_rgba(0,0,0,0.28)]">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#d7b56d]/40 bg-[#0b101a] shadow-inner shadow-black/50">
            <Clock className="text-[#f0d18b]" size={20} />
          </div>
          <div className="min-w-0">
            <div className="truncate font-serif text-sm font-semibold tracking-wide text-[#fff3d8]">{currentTurnPlayer?.name || 'Aguardando jogador'}</div>
            <div className="text-xs text-[#aeb7c8]">
              Turno {(timer?.currentPlayerIndex || 0) + 1} de {Math.max(timer?.playerOrder.length || 0, 0)}
            </div>
          </div>
        </div>

        <motion.div
          key={timeRemaining}
          initial={{ scale: 0.96 }}
          animate={{ scale: 1 }}
          className={`rounded-lg border px-4 py-1 font-mono text-2xl font-bold shadow-lg shadow-black/30 ${getTimerColor(timeRemaining)} ${timeRemaining <= 10 ? 'animate-pulse' : ''}`}
        >
          {formatTime(timeRemaining)}
        </motion.div>

        {isMaster && (
          <div className="flex items-center gap-2">
            <button
              onClick={timer?.isRunning ? pauseTimer : startTimer}
              className="rounded-md border border-[#58647a]/55 bg-[#101827] p-2 text-[#dce6f6] transition hover:border-[#d7b56d] hover:bg-[#1d2b42] hover:text-white"
              title={timer?.isRunning ? 'Pausar' : 'Iniciar'}
            >
              {timer?.isRunning ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button
              onClick={nextTurn}
              className="rounded-md border border-[#58647a]/55 bg-[#101827] p-2 text-[#dce6f6] transition hover:border-[#d7b56d] hover:bg-[#1d2b42] hover:text-white"
              title="Proximo turno"
            >
              <SkipForward size={18} />
            </button>
            <button
              onClick={resetTimer}
              className="rounded-md border border-[#58647a]/55 bg-[#101827] p-2 text-[#dce6f6] transition hover:border-[#d7b56d] hover:bg-[#1d2b42] hover:text-white"
              title="Resetar"
            >
              <RotateCcw size={18} />
            </button>
            <button
              onClick={() => extendTimer(30)}
              className="flex items-center gap-1 rounded-md border border-[#f0d18b]/50 bg-[#b8843f] px-3 py-2 text-sm font-semibold text-white shadow-md shadow-black/20 transition hover:bg-[#c9934a]"
            >
              <Plus size={16} />
              30s
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

function getTimerColor(timeRemaining: number) {
  if (timeRemaining <= 10) return 'border-[#ff9b8e]/70 bg-[#7f2530] text-white shadow-[0_0_18px_rgba(239,127,111,0.35)]';
  if (timeRemaining <= 30) return 'border-[#f0d18b]/70 bg-[#d7b56d] text-[#111827] shadow-[0_0_18px_rgba(240,209,139,0.3)]';
  return 'border-[#8ee7a8]/60 bg-[#1f7a4a] text-white shadow-[0_0_18px_rgba(45,211,111,0.28)]';
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
