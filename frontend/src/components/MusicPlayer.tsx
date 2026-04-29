import React, { useEffect, useRef, useState } from 'react';
import { Music, Pause, Play, Plus, Repeat, Volume2 } from 'lucide-react';
import { useGame } from '../GameContext';

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
  } = useGame();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [newTrackName, setNewTrackName] = useState('');
  const [newTrackUrl, setNewTrackUrl] = useState('');
  const [audioError, setAudioError] = useState('');
  const isMaster = Boolean(currentPlayer?.isMaster);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !music) return;

    audio.volume = music.volume / 100;
    audio.loop = music.isLooping;

    if (music.isPlaying && currentTrack?.url) {
      audio.play().then(() => setAudioError('')).catch(() => {
        setAudioError('Clique em play para liberar o audio neste navegador.');
      });
    } else {
      audio.pause();
    }
  }, [currentTrack?.url, music]);

  const addTrack = () => {
    if (!newTrackUrl.trim()) return;
    addMusicTrack({
      name: newTrackName.trim() || `Faixa ${(music?.playlist.length || 0) + 1}`,
      url: newTrackUrl.trim(),
    });
    setNewTrackName('');
    setNewTrackUrl('');
  };

  return (
    <div className="border-t border-[#c9a45f]/25 bg-[linear-gradient(180deg,#182132_0%,#0b101a_100%)] p-3 text-[#f6ead0] shadow-[0_-12px_30px_rgba(0,0,0,0.28)]">
      <audio ref={audioRef} src={currentTrack?.url || undefined} />
      <div className="mx-auto flex max-w-7xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#d7b56d]/40 bg-[#101827] shadow-inner shadow-black/50">
            <Music size={20} className="text-[#f0d18b]" />
          </div>
          <div className="min-w-0">
            <div className="truncate font-serif text-sm font-semibold tracking-wide text-[#fff3d8]">
              {currentTrack ? `Tocando: ${currentTrack.name}` : 'Nenhuma musica tocando'}
            </div>
            <div className="truncate text-xs text-[#aeb7c8]">
              {audioError || currentTrack?.url || 'Adicione uma URL direta de audio MP3 ou stream.'}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isMaster && (
            <>
              <input
                value={newTrackName}
                onChange={(event) => setNewTrackName(event.target.value)}
                placeholder="Nome"
                className="w-32 rounded-md border border-[#58647a]/55 bg-[#101827] px-3 py-2 text-sm text-[#f6ead0] outline-none placeholder:text-[#7f8796] focus:border-[#f0d18b] focus:ring-2 focus:ring-[#d7b56d]/35"
              />
              <input
                value={newTrackUrl}
                onChange={(event) => setNewTrackUrl(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && addTrack()}
                placeholder="URL MP3"
                className="w-52 rounded-md border border-[#58647a]/55 bg-[#101827] px-3 py-2 text-sm text-[#f6ead0] outline-none placeholder:text-[#7f8796] focus:border-[#f0d18b] focus:ring-2 focus:ring-[#d7b56d]/35"
              />
              <button
                onClick={addTrack}
                className="rounded-md border border-[#f0d18b]/50 bg-[#b8843f] p-2 text-white shadow-md shadow-black/20 transition hover:bg-[#c9934a]"
                title="Adicionar faixa"
              >
                <Plus size={16} />
              </button>
              <button
                onClick={() => currentTrack && music?.isPlaying ? pauseMusic() : currentTrack && playMusic(currentTrack.id)}
                className="rounded-md border border-[#58647a]/55 bg-[#101827] p-2 text-[#dce6f6] transition hover:border-[#d7b56d] hover:bg-[#1d2b42] hover:text-white"
                title={music?.isPlaying ? 'Pausar' : 'Tocar'}
              >
                {music?.isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <button
                onClick={() => setMusicLoop(!music?.isLooping)}
                className={`rounded-md border p-2 transition ${
                  music?.isLooping
                    ? 'border-[#f0d18b] bg-[#b8843f] text-white shadow-[0_0_16px_rgba(216,181,109,0.35)]'
                    : 'border-[#58647a]/55 bg-[#101827] text-[#dce6f6] hover:border-[#d7b56d] hover:bg-[#1d2b42] hover:text-white'
                }`}
                title="Loop"
              >
                <Repeat size={16} />
              </button>
            </>
          )}
          <div className="flex items-center gap-2">
            <Volume2 size={16} className="text-[#aeb7c8]" />
            <input
              type="range"
              min="0"
              max="100"
              value={music?.volume || 50}
              disabled={!isMaster}
              onChange={(event) => setMusicVolume(Number(event.target.value))}
              className="h-2 w-24 accent-[#d7b56d]"
            />
          </div>
        </div>
      </div>

      {isMaster && Boolean(music?.playlist.length) && (
        <div className="mx-auto mt-3 flex max-w-7xl gap-2 overflow-x-auto border-t border-[#c9a45f]/15 pt-3 pb-1">
          {music?.playlist.map((track) => (
            <button
              key={track.id}
              onClick={() => playMusic(track.id)}
              className={`shrink-0 rounded-md border px-3 py-1 text-sm transition ${
                currentTrack?.id === track.id
                  ? 'border-[#f0d18b] bg-[#b8843f] text-white shadow-[0_0_14px_rgba(216,181,109,0.25)]'
                  : 'border-[#58647a]/45 bg-[#101827] text-[#c9d3e5] hover:border-[#d7b56d] hover:bg-[#1d2b42]'
              }`}
            >
              {track.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
