import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, Plus, Volume2, Music, Repeat, Trash2 } from 'lucide-react';
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
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const youtubeRef = useRef<HTMLIFrameElement>(null);

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

  useEffect(() => {
    if (!audioRef.current) return;
    
    if (isPlaying && currentTrack && !isYouTube(currentTrack.url)) {
      audioRef.current.play().catch(e => console.error("Audio play error:", e));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentTrack]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
      audioRef.current.loop = isLooping;
    }
  }, [volume, isLooping]);

  const isYouTube = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

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
  };

  const togglePlay = () => {
    if (!socket || !isMaster) return;
    
    if (isPlaying) {
      socket.emit('music:pause');
    } else if (currentTrack) {
      socket.emit('music:play', currentTrack);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (socket && isMaster) {
      socket.emit('music:volume', newVolume);
    }
  };

  if (!isMaster && !currentTrack) return null;

  return (
    <div className={`bg-gray-800 border-t border-gray-700 p-3 transition-all ${!isMaster ? 'h-14 overflow-hidden' : ''}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Music size={20} className="text-purple-400" />
            
            <div className="flex flex-col">
              {currentTrack ? (
                <>
                  <span className="text-white font-medium text-sm flex items-center gap-2">
                    🎵 {isPlaying ? 'Tocando' : 'Pausado'}: {currentTrack.name}
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
                  title="Adicionar à Playlist"
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

                <div className="flex items-center gap-1 ml-2">
                  <Volume2 size={16} className="text-gray-400" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                    className="w-20 accent-purple-600"
                  />
                </div>
              </>
            )}
            {!isMaster && currentTrack && (
               <div className="flex items-center gap-1 ml-2">
                  <Volume2 size={16} className="text-gray-400" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => setVolume(parseInt(e.target.value))}
                    className="w-20 accent-purple-600"
                  />
                </div>
            )}
          </div>
        </div>

        {isMaster && playlist.length > 0 && (
          <div className="mt-3 flex gap-2 flex-wrap max-h-24 overflow-y-auto">
            {playlist.map((track) => (
              <div key={track.id} className="flex items-center bg-gray-700 rounded group">
                <button
                  onClick={() => playTrack(track)}
                  className={`px-3 py-1 rounded-l text-sm transition ${
                    currentTrack?.id === track.id 
                      ? 'bg-purple-600' 
                      : 'hover:bg-gray-600'
                  }`}
                >
                  {track.name}
                </button>
                <button 
                  onClick={() => setPlaylist(prev => prev.filter(t => t.id !== track.id))}
                  className="px-2 py-1 text-gray-400 hover:text-red-400 transition"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Audio Engines */}
      <audio 
        ref={audioRef} 
        src={currentTrack && !isYouTube(currentTrack.url) ? currentTrack.url : undefined} 
        onEnded={() => !isLooping && setIsPlaying(false)}
      />
      
      {currentTrack && isYouTube(currentTrack.url) && isPlaying && (
        <div className="hidden">
          <iframe
            ref={youtubeRef}
            width="1"
            height="1"
            src={`https://www.youtube.com/embed/${getYouTubeId(currentTrack.url)}?autoplay=1&loop=${isLooping ? 1 : 0}&playlist=${getYouTubeId(currentTrack.url)}`}
            allow="autoplay"
          ></iframe>
        </div>
      )}
    </div>
  );
};