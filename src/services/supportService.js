import { supabase } from '../lib/supabase';

// ─── Submit a support ticket (user-facing) ────────────────────────────────────
export async function submitTicket({ userId, name, email, phone, category, subject, message }) {
  const { data, error } = await supabase
    .from('support_tickets')
    .insert([{
      user_id:  userId ?? null,
      name:     name.trim(),
      email:    email?.trim() || null,
      phone:    phone?.trim() || null,
      category,
      subject:  subject.trim(),
      message:  message.trim(),
      status:   'open',
      priority: category === 'Safety Concern' ? 'urgent'
               : category === 'Driver Complaint' ? 'high'
               : 'normal',
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Get tickets for current user ─────────────────────────────────────────────
export async function getMyTickets(userId) {
  const { data, error } = await supabase
    .from('support_tickets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ─── Admin: get all tickets ───────────────────────────────────────────────────
export async function getAllTickets({ status, priority, page = 1, limit = 30 } = {}) {
  let query = supabase
    .from('support_tickets')
    .select(`
      *,
      user:profiles!support_tickets_user_id_fkey(id, name, phone, college)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (status)   query = query.eq('status', status);
  if (priority) query = query.eq('priority', priority);

  const { data, error, count } = await query;
  if (error) throw error;
  return { data: data ?? [], total: count ?? 0 };
}

// ─── Admin: reply to a ticket ─────────────────────────────────────────────────
export async function replyTicket(ticketId, { adminId, reply, status = 'in_progress' }) {
  const { data, error } = await supabase
    .from('support_tickets')
    .update({
      admin_reply: reply.trim(),
      replied_by:  adminId,
      replied_at:  new Date().toISOString(),
      status,
    })
    .eq('id', ticketId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Admin: update ticket status ──────────────────────────────────────────────
export async function updateTicketStatus(ticketId, status) {
  const { data, error } = await supabase
    .from('support_tickets')
    .update({ status })
    .eq('id', ticketId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ─── Admin: get support stats ─────────────────────────────────────────────────
export async function getSupportStats() {
  const [open, inProgress, resolved] = await Promise.all([
    supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'in_progress'),
    supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'resolved'),
  ]);
  return {
    open:       open.count       ?? 0,
    inProgress: inProgress.count ?? 0,
    resolved:   resolved.count   ?? 0,
  };
}
