import { useQueueStore } from '@/store/queueStore';

export const useQueue = () => {
  const queue = useQueueStore((s) => s.queue);
  const currentIndex = useQueueStore((s) => s.currentIndex);
  const autoPlay = useQueueStore((s) => s.autoPlay);
  const autostart = useQueueStore((s) => s.autostart);

  const setQueue = useQueueStore((s) => s.setQueue);
  const playNow = useQueueStore((s) => s.playNow);
  const addNext = useQueueStore((s) => s.addNext);
  const addToQueue = useQueueStore((s) => s.addToQueue);
  const removeAt = useQueueStore((s) => s.removeAt);
  const move = useQueueStore((s) => s.move);
  const clear = useQueueStore((s) => s.clear);
  const skipNext = useQueueStore((s) => s.skipNext);
  const skipPrevious = useQueueStore((s) => s.skipPrevious);
  const jumpTo = useQueueStore((s) => s.jumpTo);
  const setAutoPlay = useQueueStore((s) => s.setAutoPlay);
  const setAutostart = useQueueStore((s) => s.setAutostart);

  const current = currentIndex >= 0 && currentIndex < queue.length ? queue[currentIndex] : null;
  const upcoming = queue.slice(currentIndex + 1);
  const previous = currentIndex > 0 ? queue.slice(0, currentIndex) : [];
  const nextVideo = queue[currentIndex + 1] ?? null;

  return {
    queue,
    currentIndex,
    current,
    nextVideo,
    upcoming,
    previous,
    autoPlay,
    autostart,
    setQueue,
    playNow,
    addNext,
    addToQueue,
    removeAt,
    move,
    clear,
    skipNext,
    skipPrevious,
    jumpTo,
    setAutoPlay,
    setAutostart,
  };
};
