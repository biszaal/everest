import { create } from 'zustand';

interface PlayerState {
  isPlaying: boolean;
  isBuffering: boolean;
  isFullscreen: boolean;
  position: number;
  duration: number;
  error: string | null;
  /** Whether the floating player is rendered in fullscreen (true) or PIP corner (false). */
  expanded: boolean;
  /** 0.5 / 1 / 1.25 / 1.5 / 2 — fed into expo-av Video's `rate` prop. App-level, persists across video changes. */
  playbackRate: number;

  setPlaying: (value: boolean) => void;
  togglePlay: () => void;
  setBuffering: (value: boolean) => void;
  setFullscreen: (value: boolean) => void;
  setProgress: (position: number, duration: number) => void;
  setError: (err: string | null) => void;
  setExpanded: (value: boolean) => void;
  setPlaybackRate: (value: number) => void;
  reset: () => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  isPlaying: false,
  isBuffering: false,
  isFullscreen: false,
  position: 0,
  duration: 0,
  error: null,
  expanded: false,
  playbackRate: 1,

  setPlaying: (value) => set({ isPlaying: value }),
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setBuffering: (value) => set({ isBuffering: value }),
  setFullscreen: (value) => set({ isFullscreen: value }),
  setProgress: (position, duration) => set({ position, duration }),
  setError: (err) => set({ error: err }),
  setExpanded: (value) => set({ expanded: value }),
  setPlaybackRate: (value) => set({ playbackRate: value }),
  reset: () => set({ isPlaying: false, isBuffering: false, position: 0, duration: 0, error: null }),
}));
