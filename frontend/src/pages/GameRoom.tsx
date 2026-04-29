import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Menu, X, Dice5, MessageSquare, LogOut, Settings, Users, Music, Map as MapIcon, Plus, Eye, EyeOff, UserCheck, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameCanvas } from '../components/GameCanvas';
import { CharacterSheet } from '../components/CharacterSheet';
import { TurnTimer } from '../components/TurnTimer';
import { MusicPlayer } from '../components/MusicPlayer';
import { DiceRollLog } from '../components/DiceRollLog';
import { useGame } from '../GameContext';
import { Token } from '../../../shared/types';

export const GameRoom: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const { room, currentPlayer, leaveRoom, rollDice, isDarkMode, setMapUrl, updatePlayerRole, socket } = useGame();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [masterPanelOpen, setMasterPanelOpen] = useState(false);
  const [mapInput, setMapInput] = useState('');

  const isMaster = currentPlayer?.isMaster;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'map' | 'token') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      if (type === 'map') {
        setMapUrl(base64);
      } else {
        addToken(true, base64);
      }
    };
    reader.readAsDataURL(file);
  };

  const addToken = (isVisible: boolean = true, imageUrl?: string) => {
    if (!socket || !isMaster) return;
    const newToken: Token = {
      id: Date.now().toString(),
      name: 'Novo Token',
      x: 100,
      y: 100,
      width: 50,
      height: 50,
      isVisible: isVisible,
      imageUrl: imageUrl,
      layer: 'tokens',
      rotation: 0,
      color: isVisible ? '#3b82f6' : '#fbbf24'
    };
    socket.emit('token:add', newToken);
  };

  return (
    <div className={`h-screen flex flex-col overflow-hidden ${isDarkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <TurnTimer />

      <div className="flex flex-1 overflow-hidden relative">
        <div className="flex-1 relative bg-black">
          <GameCanvas />

          {/* Room Code & Info (Point 6) */}
          <div className="absolute top-4 left-4 z-40 flex flex-col gap-2">
            <div className="bg-gray-900/80 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Shield size={18} className="text-white" />
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Código da Sala</div>
                  <div className="text-xl font-black text-white font-mono tracking-tighter">{code}</div>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                <div className="flex -space-x-2">
                  {room?.players.slice(0, 3).map(p => (
                    <div key={p.id} className="w-5 h-5 rounded-full bg-gray-700 border border-gray-900 flex items-center justify-center text-[8px] font-bold">
                      {p.name[0].toUpperCase()}
                    </div>
                  ))}
                </div>
                <span>{room?.players.filter(p => p.connected).length} online</span>
              </div>
            </div>
            
            {/* Dice Log (Points 3, 5) */}
            <div className="w-64">
              <DiceRollLog />
            </div>
          </div>

          {/* Master Tools Button (Point 7) */}
          {isMaster && (
            <div className="absolute top-4 right-4 z-40">
              <button
                onClick={() => setMasterPanelOpen(!masterPanelOpen)}
                className={`p-3 rounded-xl transition-all shadow-xl flex items-center gap-2 ${
                  masterPanelOpen ? 'bg-purple-600 text-white' : 'bg-gray-900/80 text-purple-400 backdrop-blur-md border border-purple-500/30'
                }`}
              >
                <Settings size={20} />
                <span className="text-sm font-bold">PAINEL MESTRE</span>
              </button>
            </div>
          )}

          {/* Master Panel (Point 7, 8, 9, 10) */}
          <AnimatePresence>
            {isMaster && masterPanelOpen && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="absolute top-20 right-4 z-40 w-72 bg-gray-900/95 backdrop-blur-xl border border-purple-500/20 rounded-2xl shadow-2xl p-4 overflow-y-auto max-h-[80vh]"
              >
                <div className="space-y-6">
                  {/* Map Management */}
                  <div>
                    <h3 className="text-xs font-black uppercase text-purple-400 mb-3 flex items-center gap-2">
                      <MapIcon size={14} /> Trocar Mapa
                    </h3>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={mapInput}
                          onChange={(e) => setMapInput(e.target.value)}
                          placeholder="URL da Imagem..."
                          className="flex-1 bg-gray-800 rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-purple-500"
                        />
                        <button
                          onClick={() => { setMapUrl(mapInput); setMapInput(''); }}
                          className="bg-purple-600 p-2 rounded-lg hover:bg-purple-500 transition"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <label className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 py-2 rounded-lg text-[10px] font-bold border border-dashed border-white/20 cursor-pointer transition">
                        <MapIcon size={14} /> SUBIR DO COMPUTADOR
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'map')} />
                      </label>
                    </div>
                  </div>

                  {/* Token Management */}
                  <div>
                    <h3 className="text-xs font-black uppercase text-purple-400 mb-3 flex items-center gap-2">
                      <Users size={14} /> Inserção de Tokens
                    </h3>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => addToken(true)}
                          className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 py-2 rounded-lg text-[10px] font-bold border border-white/5"
                        >
                          <Plus size={14} className="text-blue-400" /> VISÍVEL
                        </button>
                        <button
                          onClick={() => addToken(false)}
                          className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 py-2 rounded-lg text-[10px] font-bold border border-white/5"
                        >
                          <EyeOff size={14} className="text-yellow-400" /> SECRETO
                        </button>
                      </div>
                      <label className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 py-2 rounded-lg text-[10px] font-bold border border-dashed border-white/20 cursor-pointer transition">
                        <Users size={14} /> SUBIR TOKEN DO PC
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'token')} />
                      </label>
                    </div>
                  </div>

                  {/* Player Management (Point 8) */}
                  <div>
                    <h3 className="text-xs font-black uppercase text-purple-400 mb-3 flex items-center gap-2">
                      <UserCheck size={14} /> Gerenciar Jogadores
                    </h3>
                    <div className="space-y-2">
                      {room?.players.map(p => (
                        <div key={p.id} className="flex items-center justify-between bg-gray-800/50 p-2 rounded-lg border border-white/5">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold truncate max-w-[100px]">{p.name}</span>
                            <span className={`text-[8px] uppercase ${p.role === 'player' ? 'text-blue-400' : 'text-purple-400'}`}>
                              {p.role === 'player' ? 'Jogador' : 'Telespectador'}
                            </span>
                          </div>
                          <button
                            onClick={() => updatePlayerRole(p.id, p.role === 'player' ? 'spectator' : 'player')}
                            className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded-md transition text-[8px] font-bold"
                          >
                            MUDAR
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Dice Roll FAB (Point 4) */}
          <div className="fixed bottom-24 left-4 flex flex-col gap-3 z-40">
             <div className="group relative">
                <button
                  onClick={() => rollDice('1d20')}
                  className="bg-red-600 w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center active:scale-90 transition-all hover:rotate-12 border-2 border-white/10"
                >
                  <Dice5 size={28} />
                </button>
                <div className="absolute left-16 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 px-3 py-1 rounded text-xs font-bold pointer-events-none whitespace-nowrap">
                  Rolar d20
                </div>
             </div>

             <div className="group relative">
                <button
                  onClick={() => {
                    const notation = prompt('Digite a rolagem (ex: 3d20+5, 1d1000):', '2d20+5');
                    if (notation) rollDice(notation);
                  }}
                  className="bg-purple-600 w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center active:scale-90 transition-all hover:-rotate-12 border-2 border-white/10"
                >
                  <Plus size={28} />
                </button>
                <div className="absolute left-16 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 px-3 py-1 rounded text-xs font-bold pointer-events-none whitespace-nowrap">
                  Rolagem Customizada
                </div>
             </div>
          </div>
        </div>

        {/* Character Sheet Sidebar */}
        <AnimatePresence>
          {(sidebarOpen || window.innerWidth >= 768) && (
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 150 }}
              className="w-full md:w-80 lg:w-96 flex-shrink-0 overflow-hidden md:relative fixed right-0 top-0 h-full z-[60] shadow-2xl border-l border-white/5"
            >
              <div className="flex justify-between items-center p-4 bg-gray-800/50 backdrop-blur md:hidden">
                <h2 className="font-bold flex items-center gap-2">FICHA <Shield size={16} className="text-blue-400" /></h2>
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

      {/* Footer Navigation */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-gray-900/90 backdrop-blur-xl border-t border-white/5 flex items-center justify-between px-6 z-[70] md:z-auto">
        <button
          onClick={leaveRoom}
          className="bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white px-4 py-2 rounded-xl flex items-center gap-2 transition font-bold text-xs"
        >
          <LogOut size={16} />
          <span>SAIR DA MESA</span>
        </button>

        <div className="flex gap-4">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-3 rounded-xl transition-all ${sidebarOpen ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400'}`}
          >
            <Users size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};