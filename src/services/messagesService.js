import { supabase } from '../lib/supabase';

// ─── Send a message ───────────────────────────────────────────────────────────
export async function sendMessage({ senderId, receiverId, content, bookingId = null }) {
  const { data, error } = await supabase
    .from('messages')
    .insert([{
      sender_id:   senderId,
      receiver_id: receiverId,
      content:     content.trim(),
      booking_id:  bookingId,
    }])
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey(id, name, avatar_url, is_verified),
      receiver:profiles!messages_receiver_id_fkey(id, name, avatar_url, is_verified)
    `)
    .single();
  if (error) throw error;
  return data;
}

// ─── Get conversation between two users ──────────────────────────────────────
export async function getConversation(userId, otherId) {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey(id, name, avatar_url, is_verified),
      receiver:profiles!messages_receiver_id_fkey(id, name, avatar_url, is_verified)
    `)
    .or(
      `and(sender_id.eq.${userId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${userId})`
    )
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// ─── Get all conversations for a user (latest message per contact) ────────────
export async function getConversations(userId) {
  // Fetch all messages involving the user, ordered newest first
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey(id, name, avatar_url, is_verified),
      receiver:profiles!messages_receiver_id_fkey(id, name, avatar_url, is_verified)
    `)
    .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!data) return [];

  // Deduplicate — keep only the latest message per conversation partner
  const seen = new Set();
  const convos = [];
  for (const msg of data) {
    const otherId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
    if (!seen.has(otherId)) {
      seen.add(otherId);
      const other = msg.sender_id === userId ? msg.receiver : msg.sender;
      convos.push({ other, lastMessage: msg });
    }
  }
  return convos;
}

// ─── Mark messages as read ────────────────────────────────────────────────────
export async function markAsRead(userId, senderId) {
  const { error } = await supabase
    .from('messages')
    .update({ read: true })
    .eq('receiver_id', userId)
    .eq('sender_id', senderId)
    .eq('read', false);
  if (error) throw error;
}

// ─── Get unread count ─────────────────────────────────────────────────────────
export async function getUnreadCount(userId) {
  const { count, error } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('receiver_id', userId)
    .eq('read', false);
  if (error) throw error;
  return count ?? 0;
}

// ─── Cleanup messages older than 30 days (called on app load) ────────────────
export async function cleanupOldMessages() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  await supabase
    .from('messages')
    .delete()
    .lt('created_at', cutoff.toISOString());
  // Silently ignore errors — cleanup is best-effort
}
export function subscribeToConversation(userId, otherId, onMessage) {
  return supabase
    .channel(`conversation:${[userId, otherId].sort().join('_')}`)
    .on(
      'postgres_changes',
      {
        event:  'INSERT',
        schema: 'public',
        table:  'messages',
        filter: `receiver_id=eq.${userId}`,
      },
      (payload) => {
        // Only emit if it's from the other person in this conversation
        if (payload.new.sender_id === otherId) {
          onMessage(payload.new);
        }
      }
    )
    .subscribe();
}
