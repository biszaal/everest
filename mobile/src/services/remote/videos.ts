import { supabase } from '@/services/supabase';
import { resolveMetadata } from '@/services/metadata';
import { mapVideo, type Video, type VideoRow } from '@/types';

const requireUserId = async (): Promise<string> => {
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user?.id;
  if (!id) throw new Error('Not signed in');
  return id;
};

export const videosService = {
  async list(): Promise<Video[]> {
    const userId = await requireUserId();
    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return ((data ?? []) as VideoRow[]).map(mapVideo);
  },

  async get(id: string): Promise<Video> {
    const { data, error } = await supabase.from('videos').select('*').eq('id', id).single();
    if (error) throw error;
    return mapVideo(data as VideoRow);
  },

  async add(url: string): Promise<Video> {
    const userId = await requireUserId();
    const meta = await resolveMetadata(url);
    const { data, error } = await supabase
      .from('videos')
      .insert({
        user_id: userId,
        url,
        title: meta.title,
        thumbnail: meta.thumbnail,
        platform: meta.platform,
        stream_url: meta.streamUrl,
        embed_url: meta.embedUrl,
      })
      .select('*')
      .single();
    if (error) throw error;
    return mapVideo(data as VideoRow);
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('videos').delete().eq('id', id);
    if (error) throw error;
  },
};
