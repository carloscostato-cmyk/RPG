import React, { useState } from 'react';
import { User, Backpack, FileText, Sparkles, Dice1, Dice5, Dice6, Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import { Character } from '../../../shared/types';
import { useGame } from '../GameContext';

type Tab = 'attributes' | 'inventory' | 'notes' | 'spells';

export const CharacterSheet: React.FC = () => {
  const { currentPlayer, rollDice, room, socket } = useGame();
  const [activeTab, setActiveTab] = useState<Tab>('attributes');

  const [character, setCharacter] = useState<Character>({
    id: '',
    roomId: '',
    ownerId: currentPlayer?.id || '',
    name: '',
    class: '',
    level: 1,
    currentHp: 10,
    maxHp: 10,
    attributes: {
      str: 10,
      dex: 10,
      con: 10,
      int: 10,
      wis: 10,
      cha: 10
    },
    inventory: [],
    spells: [],
    notes: ''
  });

  const tabs = [
    { id: 'attributes' as Tab, icon: <User size={18} />, label: 'ATRS' },
    { id: 'inventory' as Tab, icon: <Backpack size={18} />, label: 'INV' },
    { id: 'spells' as Tab, icon: <Sparkles size={18} />, label: 'MAGIAS' },
    { id: 'notes' as Tab, icon: <FileText size={18} />, label: 'NOTAS' },
  ];

  const attributeNames = [
    { key: 'str', label: 'FOR', full: 'Força' },
    { key: 'dex', label: 'DES', full: 'Destreza' },
    { key: 'con', label: 'CON', full: 'Constituição' },
    { key: 'int', label: 'INT', full: 'Inteligência' },
    { key: 'wis', label: 'SAB', full: 'Sabedoria' },
    { key: 'cha', label: 'CAR', full: 'Carisma' },
  ];

  const updateCharacter = (updates: Partial<Character>) => {
    const updated = { ...character, ...updates };
    setCharacter(updated);
    if (socket) {
      socket.emit('character:update', updated);
    }
  };

  const getModifier = (value: number) => Math.floor((value - 10) / 2);

  return (
    <div className="h-full w-full bg-gray-800 text-white p-4 flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <div className="flex gap-2 items-center">
          <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-600 transition">
            <Upload size={20} className="text-gray-400" />
          </div>
          
          <div className="flex-1">
            <input
              type="text"
              placeholder="Nome do Personagem"
              value={character.name}
              onChange={(e) => updateCharacter({ name: e.target.value })}
              className="w-full bg-gray-700 rounded px-3 py-2 text-white placeholder-gray-400 outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                placeholder="Classe"
                value={character.class}
                onChange={(e) => updateCharacter({ class: e.target.value })}
                className="flex-1 bg-gray-700 rounded px-2 py-1 text-sm outline-none"
              />
              <input
                type="number"
                placeholder="Nível"
                value={character.level}
                onChange={(e) => updateCharacter({ level: parseInt(e.target.value) || 1 })}
                className="w-16 bg-gray-700 rounded px-2 py-1 text-sm outline-none text-center"
              />
            </div>
          </div>
        </div>

        <div className="bg-gray-700 rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">HP</span>
            <span className="text-sm">{character.currentHp} / {character.maxHp}</span>
          </div>
          <div className="h-3 bg-gray-600 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-green-500 rounded-full"
              initial={false}
              animate={{ width: `${(character.currentHp / character.maxHp) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="flex gap-2 mt-2">
            <input
              type="number"
              value={character.currentHp}
              onChange={(e) => updateCharacter({ currentHp: parseInt(e.target.value) || 0 })}
              className="flex-1 bg-gray-600 rounded px-2 py-1 text-sm outline-none text-center"
            />
            <span className="text-gray-400">/</span>
            <input
              type="number"
              value={character.maxHp}
              onChange={(e) => updateCharacter({ maxHp: parseInt(e.target.value) || 1 })}
              className="flex-1 bg-gray-600 rounded px-2 py-1 text-sm outline-none text-center"
            />
          </div>
        </div>

        <div className="flex gap-2 justify-center">
          <button onClick={() => rollDice(20)} className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded font-bold transition text-sm">
            d20
          </button>
          <button onClick={() => rollDice(6)} className="bg-gray-600 hover:bg-gray-700 px-3 py-2 rounded font-bold transition text-sm">
            d6
          </button>
          <button onClick={() => rollDice(8)} className="bg-gray-600 hover:bg-gray-700 px-3 py-2 rounded font-bold transition text-sm">
            d8
          </button>
          <button onClick={() => rollDice(12)} className="bg-gray-600 hover:bg-gray-700 px-3 py-2 rounded font-bold transition text-sm">
            d12
          </button>
        </div>
      </div>

      <div className="flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 rounded text-xs flex items-center justify-center gap-1 transition ${
              activeTab === tab.id 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'attributes' && (
          <div className="grid grid-cols-2 gap-2">
            {attributeNames.map((attr) => (
              <div key={attr.key} className="bg-gray-700 rounded-lg p-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium">{attr.label}</span>
                  <span className="text-blue-400">
                    {getModifier(character.attributes[attr.key as keyof typeof character.attributes]) >= 0 ? '+' : ''}
                    {getModifier(character.attributes[attr.key as keyof typeof character.attributes])}
                  </span>
                </div>
                <input
                  type="number"
                  value={character.attributes[attr.key as keyof typeof character.attributes]}
                  onChange={(e) => updateCharacter({
                    attributes: {
                      ...character.attributes,
                      [attr.key]: parseInt(e.target.value) || 10
                    }
                  })}
                  className="w-full bg-gray-600 rounded px-2 py-1 text-center outline-none"
                />
              </div>
            ))}
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-2">
            {character.inventory.length === 0 ? (
              <p className="text-gray-400 text-center py-8 text-sm">Inventário vazio</p>
            ) : (
              character.inventory.map((item) => (
                <div key={item.id} className="bg-gray-700 rounded p-2 flex justify-between">
                  <span>{item.name}</span>
                  <span className="text-gray-400">x{item.quantity}</span>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'spells' && (
          <div className="space-y-2">
            <p className="text-gray-400 text-center py-8 text-sm">Nenhuma magia cadastrada</p>
          </div>
        )}

        {activeTab === 'notes' && (
          <textarea
            value={character.notes}
            onChange={(e) => updateCharacter({ notes: e.target.value })}
            placeholder="Anotações do personagem..."
            className="w-full h-full min-h-[200px] bg-gray-700 rounded p-3 outline-none resize-none text-sm"
          />
        )}
      </div>
    </div>
  );
};