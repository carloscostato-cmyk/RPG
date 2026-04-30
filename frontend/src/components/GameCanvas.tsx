import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Circle, Group, Image, Layer, Line, Rect, Stage, Text, Transformer } from 'react-konva';
import Konva from 'konva';
import useImage from 'use-image';
import { Lock, Plus, Trash2, Unlock, ZoomIn, ZoomOut } from 'lucide-react';
import type { Token } from '../../../shared/types';
import { useGame } from '../GameContext';

interface TokenComponentProps {
  token: Token;
  canMove: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onMove: (token: Token) => void;
  onDragStateChange: (dragging: boolean) => void;
}

const TokenComponentBase: React.FC<TokenComponentProps> = ({ token, canMove, isSelected, onSelect, onMove, onDragStateChange }) => {
  const shapeRef = useRef<Konva.Rect>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [image] = useImage(token.imageUrl || '', 'anonymous');

  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  return (
    <Group>
      <Rect
        x={token.x - 3}
        y={token.y - 3}
        width={token.width + 6}
        height={token.height + 6}
        fill="rgba(34,211,238,0.1)"
        stroke={isSelected ? '#fde68a' : 'rgba(103,232,249,0.35)'}
        strokeWidth={isSelected ? 3 : 1}
        shadowColor={isSelected ? '#fbbf24' : '#06b6d4'}
        shadowBlur={isSelected ? 20 : 10}
        opacity={token.isVisible ? 1 : 0.28}
        cornerRadius={10}
        listening={false}
      />
      <Rect
        ref={shapeRef}
        x={token.x}
        y={token.y}
        width={token.width}
        height={token.height}
        fill={token.color || '#ef4444'}
        stroke={isSelected ? '#facc15' : '#e0f2fe'}
        strokeWidth={isSelected ? 4 : 2}
        shadowColor={isSelected ? '#fde047' : '#38bdf8'}
        shadowBlur={isSelected ? 18 : 8}
        draggable={canMove}
        opacity={token.isVisible ? 1 : 0.35}
        cornerRadius={8}
        onClick={(event) => {
          event.cancelBubble = true;
          onSelect();
        }}
        onTap={(event) => {
          event.cancelBubble = true;
          onSelect();
        }}
        onDragEnd={(event) => {
          onDragStateChange(false);
          onMove({ ...token, x: event.target.x(), y: event.target.y() });
        }}
        onDragStart={(event) => {
          event.cancelBubble = true;
          onDragStateChange(true);
        }}
      />

      {token.imageUrl && (
        <Image
          image={image}
          x={token.x}
          y={token.y}
          width={token.width}
          height={token.height}
          opacity={token.isVisible ? 1 : 0.35}
          listening={false}
        />
      )}

      <Text
        x={token.x}
        y={token.y + token.height + 4}
        width={token.width}
        text={token.name}
        align="center"
        fill="#f8fafc"
        fontSize={14}
        fontStyle="bold"
        shadowColor="#020617"
        shadowBlur={6}
        listening={false}
      />

      {isSelected && canMove && <Transformer ref={transformerRef} rotateEnabled={false} keepRatio={false} />}
    </Group>
  );
};

const TokenComponent = memo(TokenComponentBase, (prev, next) => {
  return (
    prev.canMove === next.canMove
    && prev.isSelected === next.isSelected
    && prev.token.id === next.token.id
    && prev.token.x === next.token.x
    && prev.token.y === next.token.y
    && prev.token.width === next.token.width
    && prev.token.height === next.token.height
    && prev.token.imageUrl === next.token.imageUrl
    && prev.token.name === next.token.name
    && prev.token.color === next.token.color
    && prev.token.isVisible === next.token.isVisible
    && prev.token.locked === next.token.locked
    && prev.token.layer === next.token.layer
  );
});

export const GameCanvas: React.FC = () => {
  const { tokens, room, currentPlayer, addToken, moveToken, updateToken, removeToken, isDarkMode } = useGame();
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const [size, setSize] = useState({ width: 900, height: 640 });
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [isDraggingToken, setIsDraggingToken] = useState(false);
  const [mapImage] = useImage(room?.mapUrl || '', 'anonymous');

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new ResizeObserver(([entry]) => {
      setSize({
        width: Math.max(320, entry.contentRect.width),
        height: Math.max(320, entry.contentRect.height),
      });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const selectedToken = selectedTokenId ? tokens.get(selectedTokenId) || null : null;
  const gridSize = room?.gridSize || 50;
  const isMaster = Boolean(currentPlayer?.isMaster);
  const mapWidth = gridSize * 40;
  const mapHeight = gridSize * 30;

  useEffect(() => {
    const centeredX = Math.round((size.width - mapWidth) / 2);
    const centeredY = Math.round((size.height - mapHeight) / 2);
    setPosition({ x: centeredX, y: centeredY });
  }, [mapHeight, mapWidth, size.height, size.width, room?.id]);

  const gridCells = useMemo(() => {
    const cells = [];
    for (let x = 0; x < 40; x += 1) {
      for (let y = 0; y < 30; y += 1) {
        cells.push(
          <Rect
            key={`${x}-${y}`}
            x={x * gridSize}
            y={y * gridSize}
            width={gridSize}
            height={gridSize}
            stroke={isDarkMode ? 'rgba(125,211,252,0.18)' : 'rgba(37,99,235,0.22)'}
            strokeWidth={0.65}
          />,
        );
      }
    }
    return cells;
  }, [gridSize, isDarkMode]);

  const magicMarks = useMemo(() => {
    return (
      <>
        <Rect
          x={0}
          y={0}
          width={mapWidth}
          height={mapHeight}
          fill={isDarkMode ? '#0b1020' : '#dbeafe'}
          stroke={isDarkMode ? '#67e8f9' : '#2563eb'}
          strokeWidth={2}
          shadowColor={isDarkMode ? '#22d3ee' : '#60a5fa'}
          shadowBlur={24}
        />
        <Rect
          x={gridSize}
          y={gridSize}
          width={mapWidth - gridSize * 2}
          height={mapHeight - gridSize * 2}
          stroke={isDarkMode ? 'rgba(253,224,71,0.32)' : 'rgba(147,51,234,0.28)'}
          strokeWidth={1.5}
          dash={[10, 12]}
        />
        <Circle
          x={gridSize * 20}
          y={gridSize * 15}
          radius={gridSize * 4.2}
          stroke={isDarkMode ? 'rgba(192,132,252,0.34)' : 'rgba(124,58,237,0.26)'}
          strokeWidth={2}
          dash={[18, 10]}
        />
        <Circle
          x={gridSize * 20}
          y={gridSize * 15}
          radius={gridSize * 2.1}
          stroke={isDarkMode ? 'rgba(45,212,191,0.28)' : 'rgba(14,165,233,0.22)'}
          strokeWidth={1.5}
        />
        <Line
          points={[gridSize * 12, gridSize * 15, gridSize * 28, gridSize * 15]}
          stroke={isDarkMode ? 'rgba(251,191,36,0.24)' : 'rgba(217,119,6,0.22)'}
          strokeWidth={2}
          dash={[8, 14]}
        />
        <Line
          points={[gridSize * 20, gridSize * 7, gridSize * 20, gridSize * 23]}
          stroke={isDarkMode ? 'rgba(251,191,36,0.24)' : 'rgba(217,119,6,0.22)'}
          strokeWidth={2}
          dash={[8, 14]}
        />
        {isMaster && (
          <Rect
            x={mapWidth - gridSize * 8}
            y={gridSize}
            width={gridSize * 7}
            height={gridSize * 6}
            fill="rgba(251,113,133,0.08)"
            stroke="rgba(251,113,133,0.5)"
            strokeWidth={2}
            dash={[7, 7]}
            cornerRadius={8}
          />
        )}
        {isMaster && (
          <Text
            x={mapWidth - gridSize * 8}
            y={gridSize * 0.4}
            width={gridSize * 7}
            text="AREA OCULTA GM"
            align="center"
            fill="#fb7185"
            fontStyle="bold"
            fontSize={12}
          />
        )}
      </>
    );
  }, [gridSize, isDarkMode, isMaster, mapHeight, mapWidth]);

  const [lastCenter, setLastCenter] = useState<{ x: number; y: number } | null>(null);
  const [lastDist, setLastDist] = useState<number>(0);

  const getDistance = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  };

  const getCenter = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    return {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
    };
  };

  const handleTouchMove = (e: Konva.KonvaEventObject<TouchEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const touch1 = e.evt.touches[0];
    const touch2 = e.evt.touches[1];

    if (touch1 && touch2) {
      // Pinch zoom
      const p1 = { x: touch1.clientX, y: touch1.clientY };
      const p2 = { x: touch2.clientX, y: touch2.clientY };

      if (!lastCenter) {
        setLastCenter(getCenter(p1, p2));
        setLastDist(getDistance(p1, p2));
        return;
      }

      const newDist = getDistance(p1, p2);
      const newCenter = getCenter(p1, p2);

      const oldScale = scale;
      const pointer = stage.getPointerPosition() || newCenter;
      
      const mousePointTo = {
        x: (pointer.x - position.x) / oldScale,
        y: (pointer.y - position.y) / oldScale,
      };

      const newScale = Math.max(0.25, Math.min(4, oldScale * (newDist / lastDist)));
      
      setScale(newScale);
      setPosition({
        x: pointer.x - mousePointTo.x * newScale,
        y: pointer.y - mousePointTo.y * newScale,
      });

      setLastDist(newDist);
      setLastCenter(newCenter);
    }
  };

  const handleTouchEnd = () => {
    setLastCenter(null);
    setLastDist(0);
  };

  const handleWheel = (event: Konva.KonvaEventObject<WheelEvent>) => {
    event.evt.preventDefault();
    const stage = stageRef.current;
    const pointer = stage?.getPointerPosition();
    if (!stage || !pointer) return;

    const oldScale = scale;
    const mousePointTo = {
      x: (pointer.x - position.x) / oldScale,
      y: (pointer.y - position.y) / oldScale,
    };
    const nextScale = Math.max(0.25, Math.min(4, event.evt.deltaY > 0 ? oldScale * 0.9 : oldScale * 1.1));

    setScale(nextScale);
    setPosition({
      x: pointer.x - mousePointTo.x * nextScale,
      y: pointer.y - mousePointTo.y * nextScale,
    });
  };

  const canMoveToken = (token: Token) => {
    if (isMaster) return true;
    if (currentPlayer?.role !== 'player') return false;
    if (token.layer === 'gm-hidden') return false;
    return Boolean(room?.settings.allowPlayersMoveOwnTokens && token.ownerId === currentPlayer?.id && !token.locked);
  };

  const visibleTokens = useMemo(() => {
    return Array.from(tokens.values()).filter((token) => {
      if (isMaster) return true;
      return token.layer !== 'gm-hidden';
    });
  }, [tokens, isMaster]);

  const updateSelectedToken = (updates: Partial<Token>) => {
    if (!selectedToken) return;
    updateToken({ ...selectedToken, ...updates });
  };

  return (
    <div
      ref={containerRef}
      className={`relative h-full w-full overflow-hidden ${
        isDarkMode
          ? 'bg-[radial-gradient(circle_at_50%_28%,#1e1b4b_0,#0f172a_45%,#030712_100%)]'
          : 'bg-[radial-gradient(circle_at_50%_24%,#fef3c7_0,#dbeafe_42%,#c7d2fe_100%)]'
      }`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(34,211,238,0.22),transparent_24%),radial-gradient(circle_at_82%_22%,rgba(217,70,239,0.18),transparent_26%),radial-gradient(circle_at_50%_84%,rgba(251,191,36,0.16),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-4 rounded-2xl border border-cyan-200/15 shadow-[inset_0_0_55px_rgba(34,211,238,0.16)]" />
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        draggable={!isDraggingToken}
        onDragMove={(event) => {
          if (event.target === stageRef.current) {
            setPosition({ x: event.target.x(), y: event.target.y() });
          }
        }}
        onWheel={handleWheel}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={(e) => {
          if (e.target === stageRef.current) {
            setSelectedTokenId(null);
          }
        }}
        onTap={(e) => {
          if (e.target === stageRef.current) {
            setSelectedTokenId(null);
          }
        }}
      >
        <Layer>
          {magicMarks}
          {mapImage && (
            <Image
              image={mapImage}
              x={0}
              y={0}
              width={mapWidth}
              height={mapHeight}
              opacity={0.85}
            />
          )}
        </Layer>
        <Layer>{gridCells}</Layer>
        <Layer>
          {visibleTokens.map((token) => (
            <TokenComponent
              key={token.id}
              token={token}
              canMove={canMoveToken(token)}
              isSelected={selectedTokenId === token.id}
              onSelect={() => setSelectedTokenId(token.id)}
              onMove={moveToken}
              onDragStateChange={setIsDraggingToken}
            />
          ))}
        </Layer>
      </Stage>

      <div className="absolute left-4 top-4 flex flex-wrap gap-2 rounded-xl border border-cyan-200/20 bg-slate-950/70 p-2 text-white shadow-[0_0_28px_rgba(8,47,73,0.38)] backdrop-blur">
        {isMaster && (
          <button
            onClick={() => addToken({ x: 100, y: 100, ownerId: currentPlayer?.id })}
            className="flex items-center gap-2 rounded-lg border border-cyan-200/30 bg-gradient-to-r from-cyan-500 to-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-[0_0_16px_rgba(14,165,233,0.35)] hover:from-cyan-400 hover:to-blue-500"
          >
            <Plus size={16} />
            Token
          </button>
        )}
        <button
          onClick={() => setScale((value) => Math.min(value + 0.25, 4))}
          className="rounded-lg border border-white/10 bg-slate-800/90 p-2 text-cyan-100 shadow hover:bg-slate-700"
          title="Aproximar"
        >
          <ZoomIn size={18} />
        </button>
        <button
          onClick={() => setScale((value) => Math.max(value - 0.25, 0.25))}
          className="rounded-lg border border-white/10 bg-slate-800/90 p-2 text-cyan-100 shadow hover:bg-slate-700"
          title="Afastar"
        >
          <ZoomOut size={18} />
        </button>
      </div>

      {!room && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/75 text-center text-slate-200 backdrop-blur-sm">
          <div className="rounded-xl border border-cyan-200/20 bg-slate-950/70 px-6 py-5 shadow-[0_0_34px_rgba(34,211,238,0.22)]">
            <p className="text-lg font-semibold text-cyan-100">Entre em uma sala para carregar a mesa.</p>
            <p className="text-sm text-slate-400">O mapa, tokens e jogadores aparecem aqui em tempo real.</p>
          </div>
        </div>
      )}

      {room && tokens.size === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-center text-slate-300">
          <div className="rounded-xl border border-amber-200/20 bg-slate-950/55 px-6 py-5 shadow-[0_0_34px_rgba(251,191,36,0.16)] backdrop-blur">
            <p className="text-lg font-semibold text-amber-100">Nenhum token no mapa</p>
            <p className="text-sm text-slate-400">O mestre pode criar tokens pelo botao no canto superior.</p>
          </div>
        </div>
      )}

      {selectedToken && (
        <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-fuchsia-200/25 bg-slate-950/90 p-3 text-white shadow-[0_0_34px_rgba(217,70,239,0.22)] backdrop-blur-xl md:left-auto md:w-96">
          <div className="mb-3 flex items-center justify-between gap-2">
            <input
              value={selectedToken.name}
              onChange={(event) => updateSelectedToken({ name: event.target.value })}
              disabled={!isMaster}
              className="min-w-0 flex-1 rounded border border-white/10 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/40 disabled:cursor-not-allowed disabled:opacity-60"
            />
            {isMaster && (
              <button
                onClick={() => updateSelectedToken({ locked: !selectedToken.locked })}
                className="rounded border border-white/10 bg-slate-800 p-2 text-cyan-100 hover:bg-slate-700"
                title={selectedToken.locked ? 'Desbloquear' : 'Bloquear'}
              >
                {selectedToken.locked ? <Lock size={16} /> : <Unlock size={16} />}
              </button>
            )}
            {isMaster && (
              <button
                onClick={() => {
                  removeToken(selectedToken.id);
                  setSelectedTokenId(null);
                }}
                className="rounded border border-rose-200/30 bg-rose-600 p-2 hover:bg-rose-500"
                title="Remover"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
          {isMaster ? (
            <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2 flex gap-2">
              <input
                value={selectedToken.imageUrl || ''}
                onChange={(event) => updateSelectedToken({ imageUrl: event.target.value })}
                placeholder="URL da imagem"
                className="min-w-0 flex-1 rounded border border-white/10 bg-slate-900 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/40"
              />
              <label className="flex cursor-pointer items-center justify-center rounded border border-cyan-500/30 bg-cyan-500/10 px-3 text-xs font-bold text-cyan-300 hover:bg-cyan-500/20">
                SUBIR
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => updateSelectedToken({ imageUrl: reader.result as string });
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>
            {isMaster && (
              <select
                value={selectedToken.ownerId || ''}
                onChange={(event) => updateSelectedToken({ ownerId: event.target.value || undefined })}
                className="col-span-2 h-10 rounded border border-white/10 bg-slate-900 px-2 text-sm text-slate-100"
              >
                <option value="">Sem dono (GM)</option>
                {room?.players.map((player) => (
                  <option key={player.id} value={player.id}>
                    {player.name}
                  </option>
                ))}
              </select>
            )}
            {isMaster && (
              <select
                value={selectedToken.layer}
                onChange={(event) => updateSelectedToken({ layer: event.target.value as Token['layer'] })}
                className="col-span-2 h-10 rounded border border-white/10 bg-slate-900 px-2 text-sm text-slate-100"
              >
                <option value="tokens">Camada: Tokens</option>
                <option value="gm-hidden">Camada: Oculto GM</option>
                <option value="effects">Camada: Efeitos</option>
              </select>
            )}
            <input
              type="color"
              value={selectedToken.color || '#ef4444'}
              onChange={(event) => updateSelectedToken({ color: event.target.value })}
              className="h-10 w-full rounded border border-white/10 bg-slate-900"
            />
            <label className="flex items-center justify-center gap-2 rounded border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={selectedToken.isVisible}
                onChange={(event) => updateSelectedToken({ isVisible: event.target.checked })}
              />
              Visivel
            </label>
            </div>
          ) : (
            <p className="text-xs text-slate-300">Voce pode mover apenas seus tokens atribuidos.</p>
          )}
        </div>
      )}
    </div>
  );
};
