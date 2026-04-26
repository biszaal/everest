import { supabase } from '@/services/supabase';
import {
  mapPlaylist,
  mapPlaylistItem,
  type Playlist,
  type PlaylistDetail,
  type PlaylistItem,
  type PlaylistItemRow,
  type PlaylistRow,
} from '@/types';

const requireUserId = async (): Promise<string> => {
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user?.id;
  if (!id) throw new Error('Not signed in');
  return id;
};

export const playlistsService = {
  async list(): Promise<Playlist[]> {
    const userId = await requireUserId();
    const { data, error } = await supabase
      .from('playlists')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return ((data ?? []) as PlaylistRow[]).map(mapPlaylist);
  },

  async get(playlistId: string): Promise<PlaylistDetail> {
    const [{ data: pl, error: plErr }, { data: items, error: itemsErr }] = await Promise.all([
      supabase.from('playlists').select('*').eq('id', playlistId).single(),
      supabase
        .from('playlist_items')
        .select('*, videos(*)')
        .eq('playlist_id', playlistId)
        .order('order', { ascending: true }),
    ]);
    if (plErr) throw plErr;
    if (itemsErr) throw itemsErr;

    return {
      playlist: mapPlaylist(pl as PlaylistRow),
      items: ((items ?? []) as PlaylistItemRow[]).map(mapPlaylistItem),
    };
  },

  async create(name: string, description?: string): Promise<Playlist> {
    const userId = await requireUserId();
    const { data, error } = await supabase
      .from('playlists')
      .insert({
        user_id: userId,
        name,
        description: description ?? null,
      })
      .select('*')
      .single();
    if (error) throw error;
    return mapPlaylist(data as PlaylistRow);
  },

  async remove(playlistId: string): Promise<void> {
    const { error } = await supabase.from('playlists').delete().eq('id', playlistId);
    if (error) throw error;
  },

  async addItem(playlistId: string, videoId: string): Promise<PlaylistItem> {
    const { count } = await supabase
      .from('playlist_items')
      .select('id', { count: 'exact', head: true })
      .eq('playlist_id', playlistId);
    const nextOrder = count ?? 0;

    const { data, error } = await supabase
      .from('playlist_items')
      .insert({ playlist_id: playlistId, video_id: videoId, order: nextOrder })
      .select('*, videos(*)')
      .single();
    if (error) throw error;
    return mapPlaylistItem(data as PlaylistItemRow);
  },

  async removeItem(_playlistId: string, itemId: string): Promise<void> {
    const { error } = await supabase.from('playlist_items').delete().eq('id', itemId);
    if (error) throw error;
  },

  async reorder(playlistId: string, orderedItemIds: string[]): Promise<void> {
    await Promise.all(
      orderedItemIds.map((itemId, idx) =>
        supabase
          .from('playlist_items')
          .update({ order: idx })
          .eq('id', itemId)
          .eq('playlist_id', playlistId),
      ),
    );
  },
};
