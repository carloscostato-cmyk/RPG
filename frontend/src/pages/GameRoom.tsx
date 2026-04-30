import React, { Suspense, lazy, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Dice5, LogOut, MessageSquare, Users } from 'lucide-react';
import type { PlayerRole } from '@shared/types';
import { CharacterSheet } from '../components/CharacterSheet';
import { GameCanvas } from '../components/GameCanvas';
import { TurnTimer } from '../components/TurnTimer';
import { TurnNotification } from '../components/TurnNotification';
import { DiceOverlay } from '../components/DiceOverlay';
import { useGame } from '../GameContext';

const MusicPlayer = lazy(async () => {
  const module = await import('../components/MusicPlayer');
  return { default: module.MusicPlayer };
});

export const GameRoom: React.FC = () => {
  const navigate = useNavigate();
  const { code: _unusedCode } = useParams<{ code: string }>();
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
    updateRoom,
    setPlayerRole,
  } = useGame();
  
  const [mobileTab, setMobileTab] = useState<'sheet' | 'chat' | 'dice'>('sheet');
  const [message, setMessage] = useState('');
  const [modifier, setModifier] = useState(0);
  const [showMasterSettings, setShowMasterSettings] = useState(false);
  const isSpectator = currentPlayer?.role === 'spectator';

  const submitMessage = () => {
    if (isSpectator) return;
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
      className={`flex h-screen flex-col overflow-hidden ${
        isDarkMode
          ? 'bg-[#080b14] text-white'
          : 'bg-[radial-gradient(circle_at_top_left,#fff7d6_0,#dbeafe_34%,#e0e7ff_100%)] text-slate-950'
      }`}
    >
      <TurnTimer />
      <TurnNotification />
      <DiceOverlay />

      {(connectionError || !isConnected) && (
        <div className="z-[100] border-b border-amber-300 bg-amber-400 px-4 py-2 text-center text-sm font-semibold text-slate-950 shadow-[0_0_24px_rgba(251,191,36,0.45)]">
          {connectionError || 'Reconectando ao servidor...'}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        {/* Map Area */}
        <main className="relative h-[50vh] min-w-0 flex-1 overflow-hidden md:h-auto">
          <GameCanvas />

          {room?.code && (
            <div className="pointer-events-none absolute left-1/2 top-4 z-30 -translate-x-1/2 rounded-xl border border-cyan-300/40 bg-slate-950/80 px-4 py-2 text-center shadow-[0_0_20px_rgba(34,211,238,0.25)] backdrop-blur">
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-200/80">Codigo da Sala</p>
              <p className="font-mono text-base font-black tracking-widest text-cyan-200">{room.code}</p>
            </div>
          )}
          
          <button
            onClick={handleLeave}
            className="fixed left-4 top-20 z-40 flex items-center gap-2 rounded-lg border border-rose-200/50 bg-rose-600/90 px-3 py-1.5 text-xs text-white shadow-[0_0_20px_rgba(225,29,72,0.35)] backdrop-blur md:px-4 md:py-2 md:text-sm"
          >
            <LogOut size={16} />
            <span className="hidden md:inline">Sair</span>
          </button>
        </main>

        {/* Info Area (Mobile Split / Desktop Sidebar) */}
        <aside className="flex h-[50vh] flex-col border-t border-cyan-300/20 bg-slate-950/95 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] md:h-full md:w-96 md:border-l md:border-t-0">
          {/* Mobile Tabs */}
          <div className="flex border-b border-white/10 md:hidden">
            <button
              onClick={() => setMobileTab('sheet')}
              className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider ${mobileTab === 'sheet' ? 'border-b-2 border-cyan-400 text-cyan-400 bg-cyan-400/5' : 'text-slate-400'}`}
            >
              Ficha
            </button>
            <button
              onClick={() => setMobileTab('chat')}
              className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider ${mobileTab === 'chat' ? 'border-b-2 border-fuchsia-400 text-fuchsia-400 bg-fuchsia-400/5' : 'text-slate-400'}`}
            >
              Chat
            </button>
            <button
              onClick={() => setMobileTab('dice')}
              className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider ${mobileTab === 'dice' ? 'border-b-2 border-amber-400 text-amber-400 bg-amber-400/5' : 'text-slate-400'}`}
            >
              Dados
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {/* Desktop: Always show sheet, Chat/Dice at bottom. Mobile: Tabbed */}
            <div className={`${mobileTab === 'sheet' ? 'block' : 'hidden'} h-full md:block`}>
              <CharacterSheet />
            </div>

            {/* Mobile Chat Tab */}
            <div className={`${mobileTab === 'chat' ? 'flex' : 'hidden'} h-full flex-col p-4 md:hidden`}>
               <div className="mb-4 flex-1 space-y-2 overflow-y-auto pr-2 text-white">
                {chatMessages.map((chat) => (
                  <div key={chat.id} className="rounded-lg border border-fuchsia-200/10 bg-fuchsia-400/5 p-2 text-sm">
                    <strong className="text-cyan-300">{chat.playerName}:</strong> <span className="text-slate-100">{chat.message}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submitMessage()}
                  placeholder={isSpectator ? 'Modo espectador: somente leitura' : 'Sua mensagem...'}
                  disabled={isSpectator}
                  className="flex-1 rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
                />
                <button onClick={submitMessage} disabled={isSpectator} className="rounded-lg bg-cyan-600 px-4 py-2 font-bold text-white disabled:opacity-50">Enviar</button>
              </div>
            </div>

            {/* Mobile Dice Tab */}
            <div className={`${mobileTab === 'dice' ? 'block' : 'hidden'} h-full p-4 md:hidden`}>
              <div className="mb-4 flex items-center gap-3 rounded-lg border border-white/10 bg-slate-900 p-3">
                <span className="text-xs font-bold text-slate-400">MODIFICADOR:</span>
                <input 
                  type="number" 
                  value={modifier} 
                  onChange={(e) => setModifier(parseInt(e.target.value) || 0)}
                  className="w-full bg-transparent text-center text-xl font-bold text-amber-400 outline-none"
                />
              </div>
              <div className="mb-4 grid grid-cols-4 gap-2">
                {[4, 6, 8, 10, 12, 20, 100].map(sides => (
                  <button 
                    key={sides}
                    onClick={() => rollDice(sides, modifier)}
                    disabled={isSpectator}
                    className="flex flex-col items-center justify-center rounded-lg border border-amber-200/20 bg-amber-500/10 py-3 text-amber-200 hover:bg-amber-500/20"
                  >
                    <Dice5 size={20} />
                    <span className="mt-1 text-xs font-bold">d{sides}</span>
                  </button>
                ))}
              </div>
              <div className="space-y-2 overflow-y-auto text-white">
                {diceRolls.slice(-10).reverse().map((roll) => (
                  <div key={roll.id} className="flex items-center justify-between rounded-lg border border-amber-200/10 bg-amber-400/5 px-3 py-2 text-sm">
                    <span className="text-slate-300">{roll.playerName}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">{roll.expression}</span>
                      <strong className="text-lg text-amber-300">{roll.total}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Desktop Footer (Chat & Dice) */}
      <section className="hidden border-t border-cyan-300/20 bg-slate-950 p-3 text-white md:block">
        <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-3">
          {/* Players List */}
          <div className="rounded-xl border border-white/5 bg-white/5 p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-cyan-300">
              <Users size={16} /> Jogadores Online
            </div>
            <div className="flex flex-wrap gap-2">
              {room?.players.map(p => (
                <div key={p.id} className={`rounded-full px-3 py-1 text-xs font-medium ${p.connected ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'}`}>
                  {p.name} {p.isMaster ? '👑' : ''}
                </div>
              ))}
              {currentPlayer?.isMaster && (
                <button 
                  onClick={() => setShowMasterSettings(true)}
                  className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-200 hover:bg-amber-500/20"
                >
                  ⚙️ Configurações
                </button>
              )}
            </div>
          </div>

          {/* Dice History */}
          <div className="rounded-xl border border-white/5 bg-white/5 p-3">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-amber-300">
                <Dice5 size={16} /> Dados
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500">BÔNUS:</span>
                <input 
                  type="number" 
                  value={modifier}
                  onChange={(e) => setModifier(parseInt(e.target.value) || 0)}
                  disabled={isSpectator}
                  className="w-10 rounded bg-slate-900 text-center text-xs font-bold text-amber-400"
                />
              </div>
            </div>
            <div className="mb-2 flex flex-wrap gap-1">
               {[4, 6, 8, 10, 12, 20, 100].map(sides => (
                  <button 
                    key={sides}
                    onClick={() => rollDice(sides, modifier)}
                    disabled={isSpectator}
                    className="flex h-7 w-9 items-center justify-center rounded border border-amber-500/30 bg-amber-500/10 text-[10px] font-bold text-amber-200 hover:bg-amber-500/30"
                  >
                    d{sides}
                  </button>
                ))}
            </div>
            <div className="max-h-20 space-y-1 overflow-y-auto text-xs">
              {diceRolls.slice(-5).reverse().map(r => (
                <div key={r.id} className="flex justify-between border-b border-white/5 pb-1 last:border-0">
                  <span>{r.playerName}</span>
                  <strong className="text-amber-300">
                    {r.expression} [{r.results.join(', ')}] {r.modifier !== 0 ? `(${r.modifier > 0 ? '+' : ''}${r.modifier})` : ''} = {r.total}
                  </strong>
                </div>
              ))}
            </div>
          </div>

          {/* Chat */}
          <div className="flex flex-col rounded-xl border border-white/5 bg-white/5 p-3">
            <div className="mb-2 flex items-center gap-2 text-sm font-bold text-fuchsia-300">
              <MessageSquare size={16} /> Chat da Mesa
            </div>
            <div className="mb-2 max-h-20 flex-1 space-y-1 overflow-y-auto text-xs">
              {chatMessages.slice(-5).map(m => (
                <div key={m.id}><strong className="text-cyan-400">{m.playerName}:</strong> {m.message}</div>
              ))}
            </div>
            <div className="flex gap-2">
              <input 
                value={message} 
                onChange={e => setMessage(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && submitMessage()}
                placeholder={isSpectator ? 'Modo espectador: somente leitura' : 'Enviar mensagem...'}
                disabled={isSpectator}
                className="flex-1 rounded bg-slate-900 px-3 py-1.5 text-xs outline-none"
              />
              <button onClick={submitMessage} disabled={isSpectator} className="rounded bg-cyan-600 px-3 py-1.5 text-xs font-bold disabled:opacity-50">OK</button>
            </div>
          </div>
        </div>
      </section>

      <Suspense fallback={<div className="h-24 border-t border-[#c9a45f]/25 bg-[linear-gradient(180deg,#0f172a_0%,#020617_100%)]" />}>
        <MusicPlayer />
      </Suspense>

      {/* Master Settings Modal */}
      {showMasterSettings && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-amber-200/20 bg-slate-900 p-6 shadow-[0_0_50px_rgba(0,0,0,0.8)]">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-amber-300">Configurações da Sessão</h2>
              <button onClick={() => setShowMasterSettings(false)} className="text-slate-400 hover:text-white">Fechar</button>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between rounded-xl bg-white/5 p-4">
                <div>
                  <h3 className="font-bold text-white">Cronômetro de Turno</h3>
                  <p className="text-xs text-slate-400">Exibir o tempo para os jogadores.</p>
                </div>
                <button 
                  onClick={() => updateRoom({ settings: { ...room?.settings, timerEnabled: !room?.settings?.timerEnabled } as any })}
                  className={`rounded-full px-4 py-2 text-xs font-bold text-white ${room?.settings?.timerEnabled ? 'bg-emerald-600' : 'bg-rose-600'}`}
                >
                  {room?.settings?.timerEnabled ? 'ATIVADO' : 'DESATIVADO'}
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-300">Imagem do Mapa</label>
                <div className="flex gap-2">
                  <input 
                    id="map-url-input"
                    defaultValue={room?.mapUrl || ''}
                    placeholder="https://exemplo.com/mapa.jpg"
                    className="flex-1 rounded-lg border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-amber-400"
                  />
                  <label className="flex cursor-pointer items-center justify-center rounded-lg bg-amber-600 px-4 py-3 font-bold text-white hover:bg-amber-500">
                    SUBIR
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            const input = document.getElementById('map-url-input') as HTMLInputElement;
                            if (input) input.value = reader.result as string;
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                  <button 
                    onClick={() => {
                      const input = document.getElementById('map-url-input') as HTMLInputElement;
                      if (input) updateRoom({ mapUrl: input.value });
                    }}
                    className="rounded-lg bg-amber-600 px-4 py-3 font-bold text-white"
                  >
                    Aplicar
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">O mapa mudará instantaneamente para todos os jogadores.</p>
              </div>

              <div className="pt-4">
                <h3 className="mb-2 text-sm font-bold text-cyan-200">Papeis da mesa</h3>
                <div className="mb-4 space-y-2 rounded-xl border border-white/10 bg-white/5 p-3">
                  {room?.players.map((player) => (
                    <div key={player.id} className="flex items-center justify-between gap-3">
                      <div className="text-xs">
                        <p className="font-bold text-white">{player.name} {player.id === currentPlayer?.id ? '(Voce)' : ''}</p>
                        <p className="text-slate-400">{player.connected ? 'Online' : 'Offline'}</p>
                      </div>
                      <select
                        value={player.role}
                        onChange={(e) => setPlayerRole(player.id, e.target.value as PlayerRole)}
                        className="rounded border border-white/10 bg-slate-900 px-2 py-1 text-xs text-white"
                      >
                        <option value="player">Player</option>
                        <option value="spectator">Spectator</option>
                        <option value="master">GM</option>
                      </select>
                    </div>
                  ))}
                </div>

                <button 
                   onClick={() => setShowMasterSettings(false)}
                   className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-700 py-4 font-bold text-white shadow-lg"
                >
                  Salvar e Voltar ao Jogo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
