import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { X, Dice5, LogOut, Users, Plus } from 'lucide-react';
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
      if (type === 'map') setMapUrl(base64);
      else addToken(true, base64);
    };
    reader.readAsDataURL(file);
  };

  const addToken = (isVisible: boolean = true, imageUrl?: string) => {
    if (!socket || !isMaster) return;
    const newToken: Token = {
      id: Date.now().toString(),
      name: 'Novo Token',
      x: 100, y: 100, width: 50, height: 50,
      isVisible: isVisible,
      imageUrl: imageUrl,
      layer: 'tokens',
      rotation: 0,
      color: isVisible ? '#3b82f6' : '#fbbf24'
    };
    socket.emit('token:add', newToken);
  };

  const copyInviteLink = (role: 'player' | 'spectator') => {
    const url = `${window.location.origin}/?code=${code}&role=${role}`;
    navigator.clipboard.writeText(url);
    alert(`Link de ${role === 'player' ? 'Jogador' : 'Telespectador'} copiado!`);
  };

  return (
    <div className={`h-screen flex flex-col overflow-hidden ${isDarkMode ? 'bg-[#0f172a] text-white' : 'bg-gray-100 text-gray-900'}`}>
      {/* HEADER ORIGINAL */}
      <header className={`h-14 flex items-center justify-between px-4 border-b ${isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center gap-4">
          <h2 className="font-bold text-blue-500 uppercase tracking-wider">IMAGINARY TABLES</h2>
          <div className="h-6 w-px bg-gray-700" />
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 font-bold uppercase">Código da Sala</span>
            <span className="text-sm font-mono font-bold text-white">{code}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isMaster && (
            <button
              onClick={() => setMasterPanelOpen(!masterPanelOpen)}
              className={`px-3 py-1.5 rounded text-xs font-bold transition ${masterPanelOpen ? 'bg-purple-600 text-white' : 'bg-gray-800 text-purple-400 border border-purple-500/30'}`}
            >
              PAINEL MESTRE
            </button>
          )}
          <button onClick={leaveRoom} className="p-2 text-red-500 hover:bg-red-500/10 rounded transition">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <TurnTimer />

      <div className="flex-1 flex overflow-hidden relative">
        <main className="flex-1 relative bg-black overflow-hidden">
          <GameCanvas />

          {/* DICE LOG & FABs */}
          <div className="absolute top-4 left-4 z-40 w-64 pointer-events-none">
            <DiceRollLog />
          </div>

          <div className="absolute bottom-6 left-6 flex flex-col gap-3 z-40">
            <button onClick={() => rollDice('1d20')} className="w-12 h-12 bg-red-600 rounded-lg shadow-lg flex items-center justify-center hover:bg-red-500 transition-all active:scale-90">
              <Dice5 size={24} color="white" />
            </button>
            <button onClick={() => {
              const n = prompt('Rolagem (ex: 2d20+5):', '1d20');
              if(n) rollDice(n);
            }} className="w-12 h-12 bg-gray-800 rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-700 border border-white/10 transition-all active:scale-90">
              <Plus size={24} color="white" />
            </button>
          </div>

          {/* PAINEL MESTRE OVERLAY */}
          <AnimatePresence>
            {isMaster && masterPanelOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute top-4 right-4 z-50 w-72 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl p-4 overflow-y-auto max-h-[80vh]"
              >
                <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-2">
                  <h3 className="font-bold text-purple-400 text-xs uppercase">Controles de Mestre</h3>
                  <button onClick={() => setMasterPanelOpen(false)}><X size={16} /></button>
                </div>

                <div className="space-y-4">
                  {/* CONVITES */}
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase block mb-2">Convidar</span>
                    <div className="flex gap-2">
                      <button onClick={() => copyInviteLink('player')} className="flex-1 bg-blue-600/20 text-blue-400 text-[10px] font-bold py-2 rounded border border-blue-500/30">JOGADOR</button>
                      <button onClick={() => copyInviteLink('spectator')} className="flex-1 bg-purple-600/20 text-purple-400 text-[10px] font-bold py-2 rounded border border-purple-500/30">TELE</button>
                    </div>
                  </div>

                  {/* MAPA */}
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase block mb-2">Mapa</span>
                    <label className="block w-full bg-gray-800 py-2 text-center rounded text-[10px] font-bold cursor-pointer border border-dashed border-gray-600 mb-2">
                      SUBIR IMAGEM <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'map')} />
                    </label>
                    <div className="flex gap-1">
                      <input value={mapInput} onChange={e => setMapInput(e.target.value)} placeholder="URL..." className="flex-1 bg-gray-800 text-[10px] px-2 py-1.5 rounded outline-none" />
                      <button onClick={() => {setMapUrl(mapInput); setMapInput('');}} className="bg-blue-600 px-2 rounded"><Plus size={14}/></button>
                    </div>
                  </div>

                  {/* TOKENS */}
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase block mb-2">Inserir Token</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => addToken(true)} className="bg-gray-800 py-2 rounded text-[10px] font-bold">VISÍVEL</button>
                      <button onClick={() => addToken(false)} className="bg-gray-800 py-2 rounded text-[10px] font-bold text-yellow-500">SECRETO</button>
                    </div>
                  </div>

                  {/* JOGADORES */}
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase block mb-2">Cargos</span>
                    <div className="space-y-1">
                      {room?.players.map(p => (
                        <div key={p.id} className="flex items-center justify-between bg-black/30 p-1.5 rounded">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold">{p.name}</span>
                            <span className="text-[8px] text-gray-500 uppercase">{p.role}</span>
                          </div>
                          {p.id !== currentPlayer?.id && (
                            <button onClick={() => updatePlayerRole(p.id, p.role === 'player' ? 'spectator' : 'player')} className="text-[8px] font-bold bg-gray-800 px-2 py-1 rounded">ALTERAR</button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <aside className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 relative border-l border-gray-800 flex flex-col bg-gray-900`}>
           <button onClick={() => setSidebarOpen(!sidebarOpen)} className="absolute -left-8 top-1/2 bg-gray-800 p-1 rounded-l-lg border border-r-0 border-gray-700">
             {sidebarOpen ? <X size={20}/> : <Users size={20}/>}
           </button>
           <div className="flex-1 overflow-hidden">
             <CharacterSheet />
           </div>
        </aside>
      </div>

      <MusicPlayer />
    </div>
  );
};