import React, { useEffect, useMemo, useState } from 'react';
import { Backpack, Dice5, FileText, Plus, Sparkles, Trash2, Upload, User } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Attributes, Character, Item, Spell } from '../../../shared/types';
import { useGame } from '../GameContext';

type Tab = 'attributes' | 'inventory' | 'spells' | 'notes' | 'notion';
type AttributeKey = keyof Attributes;

const attributes: Array<{ key: AttributeKey; label: string; full: string }> = [
  { key: 'str', label: 'FOR', full: 'Forca' },
  { key: 'dex', label: 'DES', full: 'Destreza' },
  { key: 'con', label: 'CON', full: 'Constituicao' },
  { key: 'int', label: 'INT', full: 'Inteligencia' },
  { key: 'wis', label: 'SAB', full: 'Sabedoria' },
  { key: 'cha', label: 'CAR', full: 'Carisma' },
];

export const CharacterSheet: React.FC = () => {
  const { currentPlayer, characters, room, updateCharacter, rollDice, isDarkMode } = useGame();
  const [activeTab, setActiveTab] = useState<Tab>('attributes');

  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  const activeCharacterOwnerId = currentPlayer?.isMaster ? (selectedPlayerId || currentPlayer?.id) : currentPlayer?.id;

  const savedCharacter = useMemo(() => {
    return Array.from(characters.values()).find((character) => character.ownerId === activeCharacterOwnerId) || null;
  }, [characters, activeCharacterOwnerId]);

  const [draft, setDraft] = useState<Character>(() => createBlankCharacter(room?.id || '', currentPlayer?.id || ''));

  useEffect(() => {
    if (savedCharacter) setDraft(savedCharacter);
    else setDraft(createBlankCharacter(room?.id || '', currentPlayer?.id || ''));
  }, [currentPlayer?.id, room?.id, savedCharacter]);

  const save = (updates: Partial<Character>) => {
    const next = { ...draft, ...updates, roomId: room?.id || draft.roomId, ownerId: currentPlayer?.id || draft.ownerId };
    setDraft(next);
    if (currentPlayer && room) updateCharacter(next);
  };

  const getModifier = (value: number) => Math.floor((value - 10) / 2);
  const tabs = [
    { id: 'attributes' as Tab, icon: <User size={18} />, label: 'Atributos' },
    { id: 'inventory' as Tab, icon: <Backpack size={18} />, label: 'Itens' },
    { id: 'spells' as Tab, icon: <Sparkles size={18} />, label: 'Magias' },
    { id: 'notes' as Tab, icon: <FileText size={18} />, label: 'Notas' },
    { id: 'notion' as Tab, icon: <FileText size={18} />, label: 'Notion' },
  ];

  if (!currentPlayer || !room) {
    return (
      <div className="flex h-full items-center justify-center bg-[#111827] p-6 text-center text-[#e8dcc0]">
        <div className="rounded-lg border border-[#c9a45f]/25 bg-[#182132]/90 p-6 shadow-2xl shadow-black/40">
          <User className="mx-auto mb-3 text-[#c9a45f]" size={36} />
          <p className="font-serif text-lg font-semibold tracking-wide">Ficha indisponivel</p>
          <p className="text-sm text-[#aeb7c8]">Entre em uma sala para criar seu personagem.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex h-full w-full flex-col gap-4 overflow-hidden p-4 ${
        isDarkMode
          ? 'bg-[radial-gradient(circle_at_top_left,#27344d_0,#121826_38%,#0b101a_100%)] text-[#f6ead0]'
          : 'bg-[linear-gradient(145deg,#fff8e9_0%,#eef3fb_52%,#e8edf6_100%)] text-[#172033]'
      }`}
    >
      {currentPlayer.isMaster && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-2">
          <span className="text-[10px] font-bold text-amber-400">VER FICHA DE:</span>
          <select 
            value={selectedPlayerId || currentPlayer.id}
            onChange={(e) => setSelectedPlayerId(e.target.value)}
            className="flex-1 bg-transparent text-xs font-bold text-white outline-none"
          >
            {room.players.map(p => (
              <option key={p.id} value={p.id} className="bg-slate-900">{p.name} {p.id === currentPlayer.id ? '(Você)' : ''}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex gap-3 rounded-lg border border-[#c9a45f]/25 bg-[#182132]/90 p-3 shadow-xl shadow-black/30">
        <label className="flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-[#d7b56d]/40 bg-[#0f1724] shadow-inner shadow-black/50 transition hover:border-[#f0d18b] hover:bg-[#18243a]">
          {draft.avatarUrl ? (
            <img src={draft.avatarUrl} alt={draft.name || 'Avatar'} className="h-full w-full rounded-lg object-cover" />
          ) : (
            <Upload size={20} className="text-[#d7b56d]" />
          )}
          <input
            className="hidden"
            value={draft.avatarUrl || ''}
            onChange={(event) => save({ avatarUrl: event.target.value })}
            placeholder="URL do avatar"
          />
        </label>

        <div className="min-w-0 flex-1">
          <input
            type="text"
            placeholder="Nome do personagem"
            value={draft.name}
            onChange={(event) => save({ name: event.target.value })}
            className="w-full rounded-md border border-[#d7b56d]/25 bg-[#0f1724]/90 px-3 py-2 font-serif text-lg font-semibold text-[#fff3d8] outline-none placeholder:text-[#7f8796] focus:border-[#f0d18b] focus:ring-2 focus:ring-[#d7b56d]/35"
          />
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              placeholder="Classe"
              value={draft.class || ''}
              onChange={(event) => save({ class: event.target.value })}
              className="min-w-0 flex-1 rounded-md border border-[#58647a]/50 bg-[#101827] px-2 py-1 text-sm text-[#e8dcc0] outline-none placeholder:text-[#7f8796] focus:border-[#d7b56d]"
            />
            <input
              type="number"
              min={1}
              value={draft.level}
              onChange={(event) => save({ level: Number(event.target.value) || 1 })}
              className="w-16 rounded-md border border-[#58647a]/50 bg-[#101827] px-2 py-1 text-center text-sm font-bold text-[#f0d18b] outline-none focus:border-[#d7b56d]"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-[#c9a45f]/25 bg-[#182132]/90 p-3 text-[#f6ead0] shadow-lg shadow-black/25">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-serif font-semibold tracking-wide text-[#f0d18b]">HP</span>
          <span className="font-mono text-[#dce6f6]">{draft.currentHp} / {draft.maxHp}</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full border border-black/30 bg-[#0b101a] shadow-inner shadow-black/60">
          <motion.div
            className="h-full rounded-full bg-[linear-gradient(90deg,#2dd36f,#a7f36f,#f0d18b)] shadow-[0_0_14px_rgba(167,243,111,0.45)]"
            animate={{ width: `${Math.min(100, (draft.currentHp / Math.max(1, draft.maxHp)) * 100)}%` }}
          />
        </div>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="number"
            value={draft.currentHp}
            onChange={(event) => save({ currentHp: Number(event.target.value) || 0 })}
            className="min-w-0 flex-1 rounded-md border border-[#58647a]/50 bg-[#101827] px-2 py-1 text-center text-sm outline-none focus:border-[#d7b56d]"
          />
          <span className="text-[#d7b56d]">/</span>
          <input
            type="number"
            value={draft.maxHp}
            onChange={(event) => save({ maxHp: Number(event.target.value) || 1 })}
            className="min-w-0 flex-1 rounded-md border border-[#58647a]/50 bg-[#101827] px-2 py-1 text-center text-sm outline-none focus:border-[#d7b56d]"
          />
        </div>
      </div>

      <div className="flex gap-2">
        {[4, 6, 8, 10, 12, 20, 100].map((sides) => (
          <button
            key={sides}
            onClick={() => rollDice(sides)}
            className="flex-1 rounded-md border border-[#d7b56d]/30 bg-[#1a2639] px-2 py-2 text-xs font-bold text-[#f6ead0] shadow-md shadow-black/20 transition hover:border-[#f0d18b] hover:bg-[#24344f] hover:text-white"
          >
            d{sides}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center justify-center gap-1 rounded px-2 py-2 text-xs transition ${
              activeTab === tab.id
                ? 'border border-[#f0d18b] bg-[#b8843f] text-white shadow-[0_0_16px_rgba(216,181,109,0.35)]'
                : 'border border-[#58647a]/45 bg-[#182132] text-[#c9d3e5] hover:border-[#d7b56d] hover:bg-[#22304a]'
            }`}
          >
            {tab.icon}
            <span className="hidden lg:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {activeTab === 'attributes' && (
          <div className="grid grid-cols-2 gap-2">
            {attributes.map((attribute) => {
              const value = draft.attributes[attribute.key];
              const modifier = getModifier(value);
              return (
                <div key={attribute.key} className="rounded-lg border border-[#c9a45f]/25 bg-[#182132]/95 p-2 text-[#f6ead0] shadow-md shadow-black/20">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span title={attribute.full} className="font-serif font-semibold tracking-wide text-[#f0d18b]">{attribute.label}</span>
                    <button
                      onClick={() => rollDice(20, modifier)}
                      className="flex items-center gap-1 rounded-md border border-[#ef7f6f]/40 bg-[#7f2530] px-2 py-1 text-white transition hover:bg-[#a2323f]"
                    >
                      <Dice5 size={12} />
                      <span className="font-bold">{modifier >= 0 ? '+' : ''}{modifier}</span>
                    </button>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={value}
                    onChange={(event) => save({
                      attributes: { ...draft.attributes, [attribute.key]: Number(event.target.value) || 10 },
                    })}
                    className="w-full rounded-md border border-[#58647a]/50 bg-[#101827] px-2 py-1 text-center font-mono text-lg font-bold text-[#dce6f6] outline-none focus:border-[#d7b56d]"
                  />
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'inventory' && (
          <EditableList
            emptyText="Inventario vazio"
            buttonText="Adicionar item"
            items={draft.inventory}
            onAdd={() => save({ inventory: [...draft.inventory, { id: createId(), name: 'Novo item', quantity: 1 }] })}
            onRemove={(id) => save({ inventory: draft.inventory.filter((item) => item.id !== id) })}
            onChange={(item) => save({ inventory: draft.inventory.map((current) => current.id === item.id ? item : current) })}
          />
        )}

        {activeTab === 'spells' && (
          <SpellList
            spells={draft.spells}
            onAdd={() => save({ spells: [...draft.spells, { id: createId(), name: 'Nova magia', level: 0 }] })}
            onRemove={(id) => save({ spells: draft.spells.filter((spell) => spell.id !== id) })}
            onChange={(spell) => save({ spells: draft.spells.map((current) => current.id === spell.id ? spell : current) })}
          />
        )}

        {activeTab === 'notion' && (
          <div className="flex h-full flex-col gap-2">
            <input 
              placeholder="Cole o link público do Notion aqui..."
              value={draft.notionUrl || ''}
              onChange={(e) => save({ notionUrl: e.target.value })}
              className="w-full rounded border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none focus:border-cyan-400"
            />
            {draft.notionUrl ? (
              <iframe 
                src={draft.notionUrl.replace('notion.so', 'notion.site')} 
                className="flex-1 rounded-lg border border-white/5 bg-white"
                title="Notion Sheet"
              />
            ) : (
              <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-white/10 text-center text-xs text-slate-500">
                Aba Notion vazia.<br/>Cole um link para visualizar sua ficha externa.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface EditableListProps {
  emptyText: string;
  buttonText: string;
  items: Item[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onChange: (item: Item) => void;
}

const EditableList: React.FC<EditableListProps> = ({ emptyText, buttonText, items, onAdd, onRemove, onChange }) => (
  <div className="space-y-2">
    <button onClick={onAdd} className="flex w-full items-center justify-center gap-2 rounded-md border border-[#f0d18b]/50 bg-[#b8843f] px-3 py-2 text-sm font-semibold text-white shadow-md shadow-black/20 transition hover:bg-[#c9934a]">
      <Plus size={16} />
      {buttonText}
    </button>
    {items.length === 0 && <p className="py-8 text-center text-sm text-[#aeb7c8]">{emptyText}</p>}
    {items.map((item) => (
      <div key={item.id} className="rounded-lg border border-[#c9a45f]/20 bg-[#182132]/95 p-2 shadow-md shadow-black/20">
        <div className="flex gap-2">
          <input
            value={item.name}
            onChange={(event) => onChange({ ...item, name: event.target.value })}
            className="min-w-0 flex-1 rounded-md border border-[#58647a]/50 bg-[#101827] px-2 py-1 text-sm text-[#f6ead0] outline-none focus:border-[#d7b56d]"
          />
          <input
            type="number"
            min={1}
            value={item.quantity}
            onChange={(event) => onChange({ ...item, quantity: Number(event.target.value) || 1 })}
            className="w-16 rounded-md border border-[#58647a]/50 bg-[#101827] px-2 py-1 text-center text-sm font-semibold text-[#f0d18b] outline-none focus:border-[#d7b56d]"
          />
          <button onClick={() => onRemove(item.id)} className="rounded-md border border-[#ef7f6f]/40 bg-[#7f2530] p-2 text-white transition hover:bg-[#a2323f]">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    ))}
  </div>
);

interface SpellListProps {
  spells: Spell[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onChange: (spell: Spell) => void;
}

const SpellList: React.FC<SpellListProps> = ({ spells, onAdd, onRemove, onChange }) => (
  <div className="space-y-2">
    <button onClick={onAdd} className="flex w-full items-center justify-center gap-2 rounded-md border border-[#f0d18b]/50 bg-[#b8843f] px-3 py-2 text-sm font-semibold text-white shadow-md shadow-black/20 transition hover:bg-[#c9934a]">
      <Plus size={16} />
      Adicionar magia
    </button>
    {spells.length === 0 && <p className="py-8 text-center text-sm text-[#aeb7c8]">Nenhuma magia cadastrada</p>}
    {spells.map((spell) => (
      <div key={spell.id} className="rounded-lg border border-[#c9a45f]/20 bg-[#182132]/95 p-2 shadow-md shadow-black/20">
        <div className="flex gap-2">
          <input
            value={spell.name}
            onChange={(event) => onChange({ ...spell, name: event.target.value })}
            className="min-w-0 flex-1 rounded-md border border-[#58647a]/50 bg-[#101827] px-2 py-1 text-sm text-[#f6ead0] outline-none focus:border-[#d7b56d]"
          />
          <input
            type="number"
            min={0}
            max={9}
            value={spell.level}
            onChange={(event) => onChange({ ...spell, level: Number(event.target.value) || 0 })}
            className="w-16 rounded-md border border-[#58647a]/50 bg-[#101827] px-2 py-1 text-center text-sm font-semibold text-[#f0d18b] outline-none focus:border-[#d7b56d]"
          />
          <button onClick={() => onRemove(spell.id)} className="rounded-md border border-[#ef7f6f]/40 bg-[#7f2530] p-2 text-white transition hover:bg-[#a2323f]">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    ))}
  </div>
);

function createBlankCharacter(roomId: string, ownerId: string): Character {
  return {
    id: '',
    roomId,
    ownerId,
    name: '',
    class: '',
    level: 1,
    currentHp: 10,
    maxHp: 10,
    attributes: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    inventory: [],
    spells: [],
    notes: '',
    notionUrl: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function createId() {
  return `local_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
