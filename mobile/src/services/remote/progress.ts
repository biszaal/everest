import { supabase } from '@/services/supabase';
import { mapProgress, type WatchProgress, type WatchProgressRow } from '@/types';

const requireUserId = async (): Promise<string> => {
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user?.id;
  if (!id) throw new Error('Not signed in');
  return id;
};

export const progressService = {
  async upsert(videoId: string, progressSec: number, durationSec?: number): Promise<void> {
    const userId = await requireUserId();
    const { error } = await supabase.from('watch_progress').upsert(
      {
        user_id: userId,
        video_id: videoId,
        progress_sec: progressSec,
        duration_sec: durationSec ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,video_id' },
    );
    if (error) throw error;
  },

  async list(limit = 20): Promise<WatchProgress[]> {
    const userId = await requireUserId();
    const { data, error } = await supabase
      .from('watch_progress')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return ((data ?? []) as WatchProgressRow[]).map(mapProgress);
  },
};
