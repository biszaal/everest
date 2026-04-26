import { create } from 'zustand';
import type { Video } from '@/types';

interface QueueState {
  queue: Video[];
  currentIndex: number;
  autoPlay: boolean;
  /**
   * User's current play-intent. False means "don't auto-start the current video".
   * Reset to false on setQueue (so tapping a video in the library never auto-plays).
   * Flipped to true when the user taps the play button, and preserved through
   * skipNext/skipPrev so auto-play-next keeps working once playback has started.
   */
  autostart: boolean;

  current: () => Video | null;
  nextVideo: () => Video | null;

  setQueue: (videos: Video[], startIndex?: number) => void;
  playNow: (video: Video) => void;
  addNext: (video: Video) => void;
  addToQueue: (video: Video) => void;
  removeAt: (index: number) => void;
  move: (from: number, to: number) => void;
  clear: () => void;

  skipNext: () => Video | null;
  skipPrevious: () => Video | null;
  jumpTo: (index: number) => void;

  setAutoPlay: (value: boolean) => void;
  setAutostart: (value: boolean) => void;
}

const clampIndex = (index: number, length: number): number => {
  if (length <= 0) return -1;
  if (index < 0) return 0;
  if (index >= length) return length - 1;
  return index;
};

export const useQueueStore = create<QueueState>((set, get) => ({
  queue: [],
  currentIndex: -1,
  autoPlay: true,
  autostart: false,

  current: () => {
    const { queue, currentIndex } = get();
    return currentIndex >= 0 && currentIndex < queue.length ? queue[currentIndex] : null;
  },

  nextVideo: () => {
    const { queue, currentIndex } = get();
    const next = currentIndex + 1;
    return next >= 0 && next < queue.length ? queue[next] : null;
  },

  setQueue: (videos, startIndex = 0) => {
    set({
      queue: videos,
      currentIndex: videos.length ? clampIndex(startIndex, videos.length) : -1,
      autostart: false,
    });
  },

  playNow: (video) => {
    const { queue, currentIndex } = get();
    const existingIdx = queue.findIndex((v) => v.videoId === video.videoId);
    if (existingIdx >= 0) {
      set({ currentIndex: existingIdx, autostart: true });
      return;
    }
    const nextQueue = [...queue];
    const insertAt = currentIndex < 0 ? 0 : currentIndex + 1;
    nextQueue.splice(insertAt, 0, video);
    set({ queue: nextQueue, currentIndex: insertAt, autostart: true });
  },

  addNext: (video) => {
    const { queue, currentIndex } = get();
    if (queue.some((v) => v.videoId === video.videoId)) return;
    const nextQueue = [...queue];
    const insertAt = currentIndex < 0 ? 0 : currentIndex + 1;
    nextQueue.splice(insertAt, 0, video);
    set({
      queue: nextQueue,
      currentIndex: currentIndex < 0 ? 0 : currentIndex,
    });
  },

  addToQueue: (video) => {
    const { queue, currentIndex } = get();
    if (queue.some((v) => v.videoId === video.videoId)) return;
    const nextQueue = [...queue, video];
    set({
      queue: nextQueue,
      currentIndex: currentIndex < 0 ? 0 : currentIndex,
    });
  },

  removeAt: (index) => {
    const { queue, currentIndex } = get();
    if (index < 0 || index >= queue.length) return;
    const nextQueue = queue.filter((_, i) => i !== index);
    let nextIndex = currentIndex;
    if (index < currentIndex) nextIndex = currentIndex - 1;
    else if (index === currentIndex) nextIndex = clampIndex(currentIndex, nextQueue.length);
    set({ queue: nextQueue, currentIndex: nextQueue.length ? nextIndex : -1 });
  },

  move: (from, to) => {
    const { queue, currentIndex } = get();
    if (from < 0 || from >= queue.length || to < 0 || to >= queue.length || from === to) return;
    const nextQueue = [...queue];
    const [item] = nextQueue.splice(from, 1);
    nextQueue.splice(to, 0, item);

    let nextIndex = currentIndex;
    if (from === currentIndex) nextIndex = to;
    else if (from < currentIndex && to >= currentIndex) nextIndex = currentIndex - 1;
    else if (from > currentIndex && to <= currentIndex) nextIndex = currentIndex + 1;
    set({ queue: nextQueue, currentIndex: nextIndex });
  },

  clear: () => set({ queue: [], currentIndex: -1 }),

  skipNext: () => {
    const { queue, currentIndex } = get();
    const next = currentIndex + 1;
    if (next >= queue.length) return null;
    set({ currentIndex: next });
    return queue[next];
  },

  skipPrevious: () => {
    const { queue, currentIndex } = get();
    const prev = currentIndex - 1;
    if (prev < 0) return null;
    set({ currentIndex: prev });
    return queue[prev];
  },

  jumpTo: (index) => {
    const { queue } = get();
    if (index < 0 || index >= queue.length) return;
    set({ currentIndex: index });
  },

  setAutoPlay: (value) => set({ autoPlay: value }),
  setAutostart: (value) => set({ autostart: value }),
}));
