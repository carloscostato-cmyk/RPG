import React, { useEffect, useMemo, useRef, useState } from 'react';
import { 
  Music, Pause, Play, Plus, Repeat, Volume2, 
  Trash2, Edit3, FolderPlus, Folder, ChevronRight, X 
} from 'lucide-react';
import { useGame } from '../GameContext';

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export const MusicPlayer: React.FC = () => {
  const {
    currentPlayer,
    music,
    currentTrack,
    addMusicTrack,
    playMusic,
    pauseMusic,
    setMusicLoop,
    setMusicVolume,
    removeMusicTrack,
    renameMusicTrack,
    addMusicGroup,
    removeMusicGroup,
  } = useGame();

  const [newTrackName, setNewTrackName] = useState('');
  const [newTrackUrl, setNewTrackUrl] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | 'all'>('all');
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [audioError, setAudioError] = useState('');
  const [hasUserInteraction, setHasUserInteraction] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const youtubeHostRef = useRef<HTMLDivElement>(null);
  const youtubePlayerRef = useRef<any>(null);
  const isLoopingRef = useRef(false);

  const isMaster = Boolean(currentPlayer?.isMaster);
  const youtubeVideoId = useMemo(() => extractYouTubeVideoId(currentTrack?.url), [currentTrack?.url]);
  const isYouTubeTrack = Boolean(youtubeVideoId);

  useEffect(() => {
    isLoopingRef.current = Boolean(music?.isLooping);
  }, [music?.isLooping]);

  useEffect(() => {
    if (!music || !currentTrack?.url) {
      setAudioError('');
      return;
    }
    if (music.isPlaying && !hasUserInteraction) {
      setAudioError('Toque em Ativar audio para liberar reproducao no navegador.');
    }
  }, [currentTrack?.url, hasUserInteraction, music]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!music || !currentTrack?.url || isYouTubeTrack) {
      audio.pause();
      audio.removeAttribute('src');
      return;
    }

    audio.src = currentTrack.url;
    audio.volume = (music.volume || 50) / 100;
    audio.loop = Boolean(music.isLooping);

    if (music.isPlaying && hasUserInteraction) {
      audio.play().then(() => setAudioError('')).catch(() => {
        setAudioError('Falha ao reproduzir essa fonte de audio. Verifique a URL e permissao de reproducao.');
      });
      return;
    }

    audio.pause();
  }, [currentTrack?.url, hasUserInteraction, isYouTubeTrack, music]);

  useEffect(() => {
    if (!isYouTubeTrack || !youtubeVideoId) {
      if (youtubePlayerRef.current?.pauseVideo) youtubePlayerRef.current.pauseVideo();
      return;
    }

    let cancelled = false;

    ensureYouTubeApi()
      .then(() => {
        if (cancelled || !window.YT || !youtubeHostRef.current) return;

        if (!youtubePlayerRef.current) {
          youtubePlayerRef.current = new window.YT.Player(youtubeHostRef.current, {
            videoId: youtubeVideoId,
            playerVars: {
              autoplay: 0,
              controls: 0,
              rel: 0,
              modestbranding: 1,
            },
            events: {
              onStateChange: (event: any) => {
                if (event?.data === window.YT.PlayerState.ENDED && isLoopingRef.current) {
                  event.target?.seekTo?.(0);
                  event.target?.playVideo?.();
                }
              },
            },
          });
        } else if (youtubePlayerRef.current?.loadVideoById) {
          youtubePlayerRef.current.loadVideoById(youtubeVideoId);
        }

        if (youtubePlayerRef.current?.setVolume) {
          youtubePlayerRef.current.setVolume(music?.volume || 50);
        }

        if (music?.isPlaying && hasUserInteraction) {
          youtubePlayerRef.current?.playVideo?.();
        } else {
          youtubePlayerRef.current?.pauseVideo?.();
        }

        setAudioError('');
      })
      .catch(() => {
        setAudioError('Falha ao inicializar player do YouTube.');
      });

    return () => {
      cancelled = true;
    };
  }, [hasUserInteraction, isYouTubeTrack, music?.isPlaying, music?.volume, youtubeVideoId]);

  useEffect(() => {
    return () => {
      if (youtubePlayerRef.current?.destroy) youtubePlayerRef.current.destroy();
      youtubePlayerRef.current = null;
    };
  }, []);

  const handleAddTrack = () => {
    const candidateUrl = newTrackUrl.trim();
    if (!candidateUrl) return;
    if (!isValidAudioInputUrl(candidateUrl)) {
      setAudioError('URL invalida. Use YouTube, MP3 ou streaming HTTP(S).');
      return;
    }

    addMusicTrack({
      name: newTrackName.trim() || `Faixa ${(music?.playlist.length || 0) + 1}`,
      url: candidateUrl,
      groupId: selectedGroupId === 'all' ? undefined : selectedGroupId
    });
    setNewTrackName('');
    setNewTrackUrl('');
    setAudioError('');
  };

  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;
    addMusicGroup(newGroupName.trim());
    setNewGroupName('');
    setIsAddingGroup(false);
  };

  const filteredPlaylist = music?.playlist.filter(t => 
    selectedGroupId === 'all' || t.groupId === selectedGroupId
  ) || [];

  return (
    <div className="border-t border-[#c9a45f]/25 bg-[linear-gradient(180deg,#0f172a_0%,#020617_100%)] p-4 text-[#f6ead0] shadow-[0_-15px_40px_rgba(0,0,0,0.4)] transition-all">
      <audio ref={audioRef} onError={() => setAudioError('Falha ao reproduzir essa fonte de audio. Verifique a URL e permissao de reproducao.')} />
      <div className="h-0 w-0 overflow-hidden" ref={youtubeHostRef} />
      
      <div className="mx-auto max-w-7xl">
        {/* Top bar: Current Info & Global Controls */}
        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-amber-400/30 bg-slate-900 shadow-[0_0_20px_rgba(251,191,36,0.15)] ${music?.isPlaying ? 'animate-pulse' : ''}`}>
              <Music size={24} className={music?.isPlaying ? 'text-amber-400' : 'text-slate-500'} />
            </div>
            <div className="min-w-0">
              <div className="truncate font-serif text-base font-bold tracking-tight text-white">
                {currentTrack ? currentTrack.name : 'Silêncio na Mesa'}
              </div>
              <div className="truncate text-xs font-medium text-slate-400">
                {audioError || (currentTrack ? 'Tocando agora' : 'Selecione uma trilha para começar')}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isMaster && (
              <div className="flex items-center gap-2 rounded-lg bg-slate-950/50 p-1 border border-white/5">
                <button
                  onClick={() => {
                    if (!currentTrack) return;
                    if (music?.isPlaying) {
                      pauseMusic();
                      return;
                    }
                    setHasUserInteraction(true);
                    playMusic(currentTrack.id);
                  }}
                  className="rounded-md bg-amber-500 p-2 text-slate-950 transition hover:bg-amber-400 active:scale-95"
                >
                  {music?.isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                </button>
                <button
                  onClick={() => setMusicLoop(!music?.isLooping)}
                  className={`rounded-md p-2 transition ${music?.isLooping ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  <Repeat size={20} />
                </button>
              </div>
            )}

            {currentTrack && !hasUserInteraction && (
              <button
                onClick={() => setHasUserInteraction(true)}
                className="rounded-md border border-cyan-300/30 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-200"
              >
                Ativar audio
              </button>
            )}
            
            <div className="flex items-center gap-3 rounded-lg bg-slate-950/50 px-3 py-2 border border-white/5">
              <Volume2 size={18} className="text-slate-400" />
              <input
                type="range"
                min="0"
                max="100"
                value={music?.volume || 50}
                disabled={!isMaster}
                onChange={(e) => setMusicVolume(Number(e.target.value))}
                className="h-1.5 w-24 accent-amber-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Groups Tabs */}
        <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedGroupId('all')}
            className={`flex items-center gap-2 shrink-0 rounded-lg px-4 py-2 text-sm font-bold transition-all ${selectedGroupId === 'all' ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
          >
            <Folder size={16} />
            Todas
          </button>
          
          {music?.groups.map(group => (
            <div key={group.id} className="group relative shrink-0">
              <button
                onClick={() => setSelectedGroupId(group.id)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition-all ${selectedGroupId === group.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}`}
              >
                <ChevronRight size={16} className={selectedGroupId === group.id ? 'rotate-90 transition' : ''} />
                {group.name}
              </button>
              {isMaster && (
                <button 
                  onClick={(e) => { e.stopPropagation(); removeMusicGroup(group.id); }}
                  className="absolute -right-1 -top-1 hidden rounded-full bg-red-500 p-1 text-white shadow-md group-hover:block"
                >
                  <X size={10} />
                </button>
              )}
            </div>
          ))}

          {isMaster && (
            <div className="flex items-center gap-2">
              {isAddingGroup ? (
                <div className="flex items-center gap-2 rounded-lg bg-slate-900 p-1">
                  <input
                    autoFocus
                    value={newGroupName}
                    onChange={e => setNewGroupName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddGroup()}
                    placeholder="Nome do local..."
                    className="bg-transparent px-2 py-1 text-sm outline-none"
                  />
                  <button onClick={handleAddGroup} className="text-emerald-400 hover:text-emerald-300"><Plus size={18} /></button>
                  <button onClick={() => setIsAddingGroup(false)} className="text-red-400 hover:text-red-300"><X size={18} /></button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingGroup(true)}
                  className="flex items-center gap-2 rounded-lg border border-dashed border-slate-700 px-4 py-2 text-sm font-bold text-slate-500 hover:border-amber-500/50 hover:text-amber-500"
                >
                  <FolderPlus size={16} />
                  Novo Grupo
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tracks Grid */}
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredPlaylist.map((track) => (
            <div 
              key={track.id}
              className={`group flex items-center justify-between rounded-xl border p-3 transition-all ${
                currentTrack?.id === track.id 
                  ? 'border-amber-500/50 bg-amber-500/10 shadow-[0_0_15px_rgba(251,191,36,0.1)]' 
                  : 'border-white/5 bg-slate-950/30 hover:border-white/10 hover:bg-slate-900/50'
              }`}
            >
              <div
                className="flex min-w-0 flex-1 items-center gap-3 cursor-pointer"
                onClick={() => {
                  setHasUserInteraction(true);
                  playMusic(track.id);
                }}
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${currentTrack?.id === track.id ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                  {currentTrack?.id === track.id && music?.isPlaying ? <div className="flex gap-0.5"><div className="h-3 w-1 animate-bounce bg-current"></div><div className="h-3 w-1 animate-bounce bg-current [animation-delay:0.2s]"></div></div> : <Play size={14} fill="currentColor" />}
                </div>
                {editingTrackId === track.id ? (
                  <input
                    autoFocus
                    value={editingName}
                    onChange={e => setEditingName(e.target.value)}
                    onBlur={() => { renameMusicTrack(track.id, editingName); setEditingTrackId(null); }}
                    onKeyDown={e => e.key === 'Enter' && (renameMusicTrack(track.id, editingName), setEditingTrackId(null))}
                    className="w-full bg-transparent font-medium text-white outline-none"
                  />
                ) : (
                  <span className={`truncate text-sm font-bold ${currentTrack?.id === track.id ? 'text-white' : 'text-slate-300'}`}>
                    {track.name}
                  </span>
                )}
              </div>

              {isMaster && (
                <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button 
                    onClick={() => { setEditingTrackId(track.id); setEditingName(track.name); }}
                    className="p-1.5 text-slate-500 hover:text-white transition"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button 
                    onClick={() => removeMusicTrack(track.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 transition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
          ))}

          {isMaster && (
            <div className="flex items-center gap-2 rounded-xl border border-dashed border-slate-800 p-2">
              <input
                value={newTrackName}
                onChange={e => setNewTrackName(e.target.value)}
                placeholder="Nome da trilha..."
                className="w-24 bg-transparent px-2 text-xs outline-none"
              />
              <input
                value={newTrackUrl}
                onChange={e => setNewTrackUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddTrack()}
                placeholder="URL YouTube/MP3/Stream..."
                className="flex-1 bg-transparent px-2 text-xs outline-none"
              />
              <button onClick={handleAddTrack} className="rounded-lg bg-slate-800 p-2 text-amber-500 hover:bg-slate-700">
                <Plus size={16} />
              </button>
            </div>
          )}
        </div>
        <p className="mt-3 text-[11px] text-slate-500">Suporta YouTube, links diretos de audio e streams HTTP(S).</p>
      </div>
    </div>
  );
};

let youtubeApiPromise: Promise<void> | null = null;

function ensureYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve();
  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector('script[data-yt-iframe-api="1"]') as HTMLScriptElement | null;
    if (existing) {
      const checkReady = () => {
        if (window.YT?.Player) resolve();
        else setTimeout(checkReady, 100);
      };
      checkReady();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.dataset.ytIframeApi = '1';
    script.onerror = () => reject(new Error('yt-load-failed'));
    window.onYouTubeIframeAPIReady = () => resolve();
    document.body.appendChild(script);
  });

  return youtubeApiPromise;
}

function extractYouTubeVideoId(url?: string | null) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (host.includes('youtu.be')) {
      return parsed.pathname.replace('/', '') || null;
    }
    if (host.includes('youtube.com')) {
      if (parsed.pathname === '/watch') return parsed.searchParams.get('v');
      if (parsed.pathname.startsWith('/shorts/')) return parsed.pathname.split('/')[2] || null;
      if (parsed.pathname.startsWith('/embed/')) return parsed.pathname.split('/')[2] || null;
    }
    return null;
  } catch {
    return null;
  }
}

function isValidAudioInputUrl(value: string) {
  try {
    const url = new URL(value.trim());
    if (!['http:', 'https:'].includes(url.protocol)) return false;
    const hostname = url.hostname.toLowerCase();
    const pathname = url.pathname.toLowerCase();
    const search = url.search.toLowerCase();
    const audioExt = ['.mp3', '.wav', '.ogg', '.aac', '.m4a', '.flac', '.opus', '.weba', '.m3u8', '.pls'];
    const isYoutube = hostname.includes('youtube.com') || hostname.includes('youtu.be');
    const hasAudioExt = audioExt.some((ext) => pathname.endsWith(ext) || search.includes(ext));
    const isLikelyStream = pathname.includes('stream') || pathname.includes('live') || search.includes('stream');
    return isYoutube || hasAudioExt || isLikelyStream;
  } catch {
    return false;
  }
}
