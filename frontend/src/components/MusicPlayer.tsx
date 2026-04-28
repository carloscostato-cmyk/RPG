import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, Plus, Volume2, Music, Repeat } from 'lucide-react';
import { useGame } from '../GameContext';
import { MusicTrack } from '../../../shared/types';

export const MusicPlayer: React.FC = () => {
  const { room, currentPlayer, socket } = useGame();
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [volume, setVolume] = useState(50);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [playlist, setPlaylist] = useState<MusicTrack[]>([]);
  const [newTrackUrl, setNewTrackUrl] = useState('');

  const isMaster = currentPlayer?.isMaster;

  useEffect(() => {
    if (!socket) return;

    socket.on('music:play', (track) => {
      setCurrentTrack(track);
      setIsPlaying(true);
    });

    socket.on('music:pause', () => {
      setIsPlaying(false);
    });

    socket.on('music:volume', (newVolume) => {
      setVolume(newVolume);
    });

    return () => {
      socket.off('music:play');
      socket.off('music:pause');
      socket.off('music:volume');
    };
  }, [socket]);

  const addTrack = () => {
    if (!newTrackUrl || !socket) return;
    
    const track: MusicTrack = {
      id: Date.now().toString(),
      name: `Música ${playlist.length + 1}`,
      url: newTrackUrl,
      volume: volume,
      isPlaying: false
    };

    setPlaylist(prev => [...prev, track]);
    setNewTrackUrl('');
  };

  const playTrack = (track: MusicTrack) => {
    if (!socket || !isMaster) return;
    socket.emit('music:play', track);
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (!socket || !isMaster) return;
    
    if (isPlaying) {
      socket.emit('music:pause');
    } else if (currentTrack) {
      socket.emit('music:play', currentTrack);
    }
    setIsPlaying(!isPlaying);
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (socket && isMaster) {
      socket.emit('music:volume', newVolume);
    }
  };

  return (
    <div className="bg-gray-800 border-t border-gray-700 p-3">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Music size={20} className="text-purple-400" />
            
            <div className="flex flex-col">
              {currentTrack ? (
                <>
                  <span className="text-white font-medium text-sm flex items-center gap-2">
                    🎵 Tocando: {currentTrack.name}
                  </span>
                  <span className="text-xs text-gray-400 truncate max-w-xs">
                    {currentTrack.url}
                  </span>
                </>
              ) : (
                <span className="text-gray-400 text-sm">Nenhuma música tocando</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isMaster && (
              <>
                <input
                  type="text"
                  placeholder="URL YouTube / MP3"
                  value={newTrackUrl}
                  onChange={(e) => setNewTrackUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addTrack()}
                  className="bg-gray-700 rounded px-3 py-1 text-sm outline-none w-48"
                />
                
                <button 
                  onClick={addTrack}
                  className="bg-purple-600 hover:bg-purple-700 p-2 rounded transition"
                >
                  <Plus size={16} />
                </button>

                <button 
                  onClick={togglePlay}
                  className="bg-gray-700 hover:bg-gray-600 p-2 rounded transition"
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                </button>

                <button 
                  onClick={() => setIsLooping(!isLooping)}
                  className={`p-2 rounded transition ${isLooping ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                  <Repeat size={16} />
                </button>

                <div className="flex items-center gap-1">
                  <Volume2 size={16} className="text-gray-400" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                    className="w-20"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {isMaster && playlist.length > 0 && (
          <div className="mt-3 flex gap-2 flex-wrap">
            {playlist.map((track) => (
              <button
                key={track.id}
                onClick={() => playTrack(track)}
                className={`px-3 py-1 rounded text-sm transition ${
                  currentTrack?.id === track.id 
                    ? 'bg-purple-600' 
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {track.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};