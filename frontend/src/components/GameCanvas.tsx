import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Image, Transformer, Group, Text } from 'react-konva';
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
    listening={false}
  />
);

interface TokenComponentProps {
  token: Token;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (token: Token) => void;
  isMaster: boolean;
}

const TokenComponent: React.FC<TokenComponentProps> = ({ token, isSelected, onSelect, onChange, isMaster }) => {
  const shapeRef = useRef<Konva.Rect>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const [image] = useImage(token.imageUrl || '');

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  // If token is not visible and current user is not master, don't render
  if (!token.isVisible && !isMaster) return null;

  return (
    <Group>
      <Rect
        ref={shapeRef}
        x={token.x}
        y={token.y}
        width={token.width}
        height={token.height}
        fill={token.color || '#ef4444'}
        stroke={token.isVisible ? "#ffffff" : "#fbbf24"}
        strokeWidth={isSelected ? 3 : 2}
        dash={token.isVisible ? [] : [10, 5]}
        draggable={isMaster} // Point 10: Only master can move
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
        opacity={token.isVisible ? 1 : 0.6}
      />
      
      {token.imageUrl && (
        <Image
          image={image}
          x={token.x}
          y={token.y}
          width={token.width}
          height={token.height}
          listening={false}
          cornerRadius={8}
          opacity={token.isVisible ? 1 : 0.6}
        />
      )}

      {!token.isVisible && isMaster && (
        <Text
          x={token.x}
          y={token.y - 15}
          text="SECRET"
          fontSize={10}
          fill="#fbbf24"
          fontStyle="bold"
        />
      )}

      {isSelected && isMaster && ( // Point 10: Only master can edit/transform
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
  const [mapImage] = useImage(room?.mapUrl || '');

  const isMaster = currentPlayer?.isMaster || false;

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
    const clampedScale = Math.max(0.1, Math.min(10, newScale));

    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    };

    setScale(clampedScale);
    setPosition(newPos);
  };

  const handleDragMove = (e: Konva.KonvaEvent<DragEvent>) => {
    // Only update position if we're dragging the stage (not a token)
    if (e.target instanceof Konva.Stage) {
      setPosition({
        x: e.target.x(),
        y: e.target.y()
      });
    }
  };

  const handleTokenChange = (token: Token) => {
    if (socket && isMaster) { // Point 10
      socket.emit('token:update', token);
    }
  };

  const gridCells = [];
  const gridSize = 50;
  const gridCountX = 100;
  const gridCountY = 100;

  for (let x = 0; x < gridCountX; x++) {
    for (let y = 0; y < gridCountY; y++) {
      gridCells.push(<GridCell key={`${x}-${y}`} x={x} y={y} size={gridSize} />);
    }
  }

  return (
    <div className="w-full h-full bg-black overflow-hidden cursor-grab active:cursor-grabbing">
      <Stage
        ref={stageRef}
        width={window.innerWidth}
        height={window.innerHeight}
        scaleX={scale}
        scaleY={scale}
        x={position.x}
        y={position.y}
        onWheel={handleWheel}
        draggable
        onDragMove={handleDragMove}
        onMouseDown={(e) => {
          if (e.target === e.target.getStage()) {
            setSelectedTokenId(null);
          }
        }}
      >
        {/* Map Layer */}
        <Layer>
           {room?.mapUrl && mapImage && (
             <Image 
               image={mapImage}
               x={0}
               y={0}
               width={mapImage.width}
               height={mapImage.height}
               listening={false}
             />
           )}
        </Layer>

        {/* Grid Layer */}
        <Layer opacity={0.3}>
          {gridCells}
        </Layer>
        
        {/* Tokens Layer */}
        <Layer>
          {Array.from(tokens.values()).map((token) => (
            <TokenComponent
              key={token.id}
              token={token}
              isSelected={selectedTokenId === token.id}
              onSelect={() => setSelectedTokenId(token.id)}
              onChange={handleTokenChange}
              isMaster={isMaster}
            />
          ))}
        </Layer>
      </Stage>

      {/* Controls */}
      <div className="absolute bottom-24 right-4 flex flex-col gap-2 z-50">
        <button 
          onClick={() => setScale(s => Math.min(s + 0.5, 10))}
          className="bg-gray-800/80 backdrop-blur text-white w-10 h-10 rounded-full shadow-xl hover:bg-gray-700 flex items-center justify-center font-bold"
        >
          +
        </button>
        <button 
          onClick={() => setScale(s => Math.max(s - 0.5, 0.1))}
          className="bg-gray-800/80 backdrop-blur text-white w-10 h-10 rounded-full shadow-xl hover:bg-gray-700 flex items-center justify-center font-bold"
        >
          -
        </button>
        <button 
          onClick={() => { setScale(1); setPosition({ x: 0, y: 0 }); }}
          className="bg-gray-800/80 backdrop-blur text-white w-10 h-10 rounded-full shadow-xl hover:bg-gray-700 flex items-center justify-center text-lg"
        >
          ⟲
        </button>
      </div>
      
      {isMaster && (
        <div className="absolute top-24 left-4 bg-gray-800/80 backdrop-blur p-2 rounded-lg text-xs text-yellow-400 border border-yellow-400/30">
          MODO MESTRE ATIVO
        </div>
      )}
    </div>
  );
};