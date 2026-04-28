import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Image, Transformer, Group } from 'react-konva';
import Konva from 'konva';
import useImage from 'use-image';
import { Token } from '../../../shared/types';
import { useGame } from '../GameContext';

interface GridCellProps {
  x: number;
  y: number;
  size: number;
}

const GridCell: React.FC<GridCellProps> = ({ x, y, size }) => (
  <Rect
    x={x * size}
    y={y * size}
    width={size}
    height={size}
    stroke="#374151"
    strokeWidth={0.5}
    fill="transparent"
  />
);

interface TokenComponentProps {
  token: Token;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (token: Token) => void;
}

const TokenComponent: React.FC<TokenComponentProps> = ({ token, isSelected, onSelect, onChange }) => {
  const shapeRef = useRef<Konva.Rect>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const [image] = useImage(token.imageUrl || '');

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  return (
    <Group>
      <Rect
        ref={shapeRef}
        x={token.x}
        y={token.y}
        width={token.width}
        height={token.height}
        fill={token.color || '#ef4444'}
        stroke="#ffffff"
        strokeWidth={2}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={(e) => {
          const newToken = {
            ...token,
            x: Math.round(e.target.x() / 50) * 50,
            y: Math.round(e.target.y() / 50) * 50
          };
          onChange(newToken);
        }}
        cornerRadius={8}
      />
      
      {token.imageUrl && (
        <Image
          image={image}
          x={token.x}
          y={token.y}
          width={token.width}
          height={token.height}
          listening={false}
        />
      )}

      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            newBox.width = Math.round(newBox.width / 50) * 50 || 50;
            newBox.height = Math.round(newBox.height / 50) * 50 || 50;
            return newBox;
          }}
          rotateEnabled={false}
          keepRatio={false}
        />
      )}
    </Group>
  );
};

export const GameCanvas: React.FC = () => {
  const { tokens, room, socket, currentPlayer } = useGame();
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  
  const stageRef = useRef<Konva.Stage>(null);

  const handleWheel = (e: Konva.KonvaEvent<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = scale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - position.x) / oldScale,
      y: (pointer.y - position.y) / oldScale,
    };

    const newScale = e.evt.deltaY > 0 ? oldScale * 0.9 : oldScale * 1.1;
    const clampedScale = Math.max(0.25, Math.min(4, newScale));

    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    };

    setScale(clampedScale);
    setPosition(newPos);
  };

  const handleDragMove = (e: Konva.KonvaEvent<DragEvent>) => {
    setPosition({
      x: e.target.x(),
      y: e.target.y()
    });
  };

  const handleTokenChange = (token: Token) => {
    if (socket) {
      socket.emit('token:move', token);
    }
  };

  const gridCells = [];
  for (let x = 0; x < 40; x++) {
    for (let y = 0; y < 30; y++) {
      gridCells.push(<GridCell key={`${x}-${y}`} x={x} y={y} size={50} />);
    }
  }

  return (
    <div className="w-full h-full bg-gray-900 overflow-hidden">
      <Stage
        ref={stageRef}
        width={window.innerWidth * 0.7}
        height={window.innerHeight}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        onWheel={handleWheel}
        draggable
        onDragMove={handleDragMove}
        onMouseDown={() => setSelectedTokenId(null)}
      >
        <Layer>
          {gridCells}
        </Layer>
        
        <Layer>
          {Array.from(tokens.values()).map((token) => (
            <TokenComponent
              key={token.id}
              token={token}
              isSelected={selectedTokenId === token.id}
              onSelect={() => setSelectedTokenId(token.id)}
              onChange={handleTokenChange}
            />
          ))}
        </Layer>
      </Stage>

      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button 
          onClick={() => setScale(s => Math.min(s + 0.25, 4))}
          className="bg-gray-800 text-white p-2 rounded-lg shadow-lg hover:bg-gray-700"
        >
          +
        </button>
        <button 
          onClick={() => setScale(s => Math.max(s - 0.25, 0.25))}
          className="bg-gray-800 text-white p-2 rounded-lg shadow-lg hover:bg-gray-700"
        >
          -
        </button>
        <button 
          onClick={() => { setScale(1); setPosition({ x: 0, y: 0 }); }}
          className="bg-gray-800 text-white p-2 rounded-lg shadow-lg hover:bg-gray-700 text-xs"
        >
          ⟲
        </button>
      </div>
    </div>
  );
};