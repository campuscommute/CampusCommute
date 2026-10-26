import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle, BarChart2, Car, CheckCircle, ChevronRight,
  Clock, GraduationCap, HelpCircle, LayoutDashboard,
  MessageSquare, RefreshCw, Send, Shield, TrendingUp,
  Users, X, XCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  getAdminStats, getAllUsers, reviewVerification,
} from '../services/usersService';
import {
  getAllTickets, replyTicket, updateTicketStatus, getSupportStats,
} from '../services/supportService';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';

// ─── Stat Card ────────────────────────────────────────────────────────────────
function AdminStatCard({ label, value, icon, color = 'brand', delay = 0, loading }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 300, damping: 24 }}
      className="bg-white rounded-2xl p-5 card-shadow border border-surface-50"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
        color === 'brand' ? 'bg-brand-50 text-brand-600' :
        color === 'green' ? 'bg-green-50 text-green-600' :
        color === 'amber' ? 'bg-amber-50 text-amber-600' :
        color === 'red'   ? 'bg-red-50 text-red-500'     : 'bg-surface-50 text-surface-500'
      }`}>{icon}</div>
      {loading
        ? <div className="h-8 w-16 bg-surface-100 rounded-lg animate-pulse mb-1" />
        : <p className="text-3xl font-black text-surface-950">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      }
      <p className="text-sm text-surface-400 font-medium mt-1">{label}</p>
    </motion.div>
  );
}

// ─── Dashboard panel ──────────────────────────────────────────────────────────
function DashboardPanel() {
  const toast = useToast();
  const [stats,      setStats]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [activity,   setActivity]   = useState([]);
  const [actLoading, setActLoading] = useState(true);

  const loadStats = () => {
    setLoading(true);
    getAdminStats()
      .then(setStats)
      .catch(err => toast(err.message || 'Could not load stats', 'error'))
      .finally(() => setLoading(false));
  };

  const loadActivity = async () => {
    setActLoading(true);
    try {
      const [bookings, verifs, rides, tickets] = await Promise.all([
        supabase.from('bookings')
          .select('id, created_at, passenger:profiles!bookings_passenger_id_fkey(name), ride:rides(from_label,to_label)')
          .order('created_at', { ascending: false }).limit(4),
        supabase.from('profiles')
          .select('id, name, created_at').eq('verification_status', 'pending')
          .order('created_at', { ascending: false }).limit(3),
        supabase.from('rides')
          .select('id, from_label, to_label, created_at, driver:profiles!rides_driver_id_fkey(name)')
          .order('created_at', { ascending: false }).limit(3),
        supabase.from('support_tickets')
          .select('id, subject, category, created_at, name')
          .order('created_at', { ascending: false }).limit(3),
      ]);

      const items = [];
      (verifs.data  ?? []).forEach(v => items.push({ text: `${v.name} submitted a verification request`, time: v.created_at, type: 'verification' }));
      (bookings.data ?? []).forEach(b => items.push({ text: `${b.passenger?.name ?? 'A passenger'} booked: ${b.ride?.from_label ?? '?'} → ${b.ride?.to_label ?? '?'}`, time: b.created_at, type: 'booking' }));
      (rides.data   ?? []).forEach(r => items.push({ text: `${r.driver?.name ?? 'A driver'} published ride: ${r.from_label} → ${r.to_label}`, time: r.created_at, type: 'ride' }));
      (tickets.data ?? []).forEach(t => items.push({ text: `Support ticket: "${t.subject}" from ${t.name}`, time: t.created_at, type: 'support' }));

      items.sort((a, b) => new Date(b.time) - new Date(a.time));
      setActivity(items.slice(0, 10));
    } catch { /* silent */ }
    finally { setActLoading(false); }
  };

  useEffect(() => { loadStats(); loadActivity(); }, []);

  const timeAgo = (iso) => {
    if (!iso) return '';
    const m = Math.floor((Date.now() - new Date(iso)) / 60000);
    if (m < 1)  return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  const typeStyle = {
    verification: { icon: <GraduationCap size={13} />, cls: 'bg-brand-50 text-brand-600' },
    booking:      { icon: <Car size={13} />,            cls: 'bg-green-50 text-green-600' },
    ride:         { icon: <TrendingUp size={13} />,     cls: 'bg-amber-50 text-amber-600' },
    support:      { icon: <HelpCircle size={13} />,     cls: 'bg-purple-50 text-purple-600' },
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black text-surface-950">Overview</h2>
          <button onClick={() => { loadStats(); loadActivity(); }}
            className="flex items-center gap-1.5 text-xs text-surface-400 hover:text-brand-600 transition-colors font-semibold">
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <AdminStatCard loading={loading} label="Total Students"        value={stats?.totalStudents        ?? 0} icon={<Users size={18} />}     color="brand" delay={0.00} />
          <AdminStatCard loading={loading} label="Total Rides"           value={stats?.totalRides           ?? 0} icon={<Car size={18} />}       color="green" delay={0.06} />
          <AdminStatCard loading={loading} label="Active Rides"          value={stats?.activeRides          ?? 0} icon={<BarChart2 size={18} />} color="amber" delay={0.12} />
          <AdminStatCard loading={loading} label="Pending Verifications" value={stats?.pendingVerifications ?? 0} icon={<Shield size={18} />}    color="red"   delay={0.18} />
        </div>
      </div>

      {/* Real activity feed */}
      <div className="bg-white rounded-3xl p-5 card-shadow border border-surface-50">
        <h3 className="font-bold text-surface-900 mb-4 flex items-center gap-2">
          <Clock size={16} className="text-brand-500" /> Recent Activity
        </h3>
        {actLoading ? (
          <div className="space-y-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-7 h-7 rounded-xl bg-surface-100 flex-shrink-0" />
                <div className="flex-1 h-3 bg-surface-100 rounded" />
                <div className="w-12 h-3 bg-surface-100 rounded" />
              </div>
            ))}
          </div>
        ) : activity.length === 0 ? (
          <p className="text-surface-400 text-sm text-center py-6">No recent activity yet.</p>
        ) : (
          <div className="space-y-1">
            {activity.map((a, i) => {
              const s = typeStyle[a.type] ?? typeStyle.booking;
              return (
                <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3 py-2.5 border-b border-surface-50 last:border-0">
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${s.cls}`}>{s.icon}</div>
                  <p className="text-sm text-surface-700 flex-1 leading-snug">{a.text}</p>
                  <span className="text-xs text-surface-400 flex-shrink-0 whitespace-nowrap">{timeAgo(a.time)}</span>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Verification panel ───────────────────────────────────────────────────────
function VerificationPanel() {
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    supabase.from('profiles')
      .select('id, name, college, enrollment_no, college_id_url, selfie_url, verification_status, gender, phone, created_at')
      .eq('verification_status', 'pending')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) toast(error.message, 'error');
        else setRequests(data ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleAction = async (id, action) => {
    try {
      await reviewVerification(id, action);
      setRequests(prev => prev.filter(r => r.id !== id));
      toast(action === 'approve' ? 'Student approved!' : 'Verification rejected.', action === 'approve' ? 'success' : 'error');
    } catch (err) { toast(err.message || 'Action failed', 'error'); }
  };

  return (
    <div>
      <h2 className="text-xl font-black text-surface-950 mb-4">
        Verification Requests
        {requests.length > 0 && <span className="ml-2 text-sm font-semibold text-red-500">({requests.length} pending)</span>}
      </h2>
      <div className="bg-white rounded-3xl card-shadow border border-surface-50 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-surface-50 rounded-2xl animate-pulse" />)}</div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle size={40} className="text-green-400 mx-auto mb-3" />
            <p className="font-bold text-surface-700">All caught up!</p>
            <p className="text-surface-400 text-sm mt-1">No pending verification requests.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-surface-100">
                {['Student','College','Enroll No.','Phone','Documents','Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3.5 text-xs font-bold text-surface-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {requests.map((req, i) => (
                  <motion.tr key={req.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                    className="border-b border-surface-50 last:border-0 hover:bg-surface-50/50 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={req.name} size="sm" />
                        <div>
                          <p className="font-semibold text-surface-900">{req.name}</p>
                          <p className="text-xs text-surface-400 capitalize">{req.gender ?? '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-surface-600 font-medium">{req.college ?? '—'}</td>
                    <td className="px-4 py-3.5 font-mono text-xs text-surface-500">{req.enrollment_no ?? '—'}</td>
                    <td className="px-4 py-3.5 font-mono text-xs text-surface-500">{req.phone ?? '—'}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-1.5">
                        {req.college_id_url
                          ? <a href={req.college_id_url} target="_blank" rel="noreferrer" className="text-xs px-2 py-1 rounded-lg font-semibold bg-green-50 text-green-700 hover:bg-green-100">View ID</a>
                          : <span className="text-xs px-2 py-1 rounded-lg font-semibold bg-red-50 text-red-600">No ID</span>}
                        {req.selfie_url
                          ? <a href={req.selfie_url} target="_blank" rel="noreferrer" className="text-xs px-2 py-1 rounded-lg font-semibold bg-green-50 text-green-700 hover:bg-green-100">Selfie</a>
                          : <span className="text-xs px-2 py-1 rounded-lg font-semibold bg-red-50 text-red-600">No Selfie</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-2">
                        <Button size="xs" variant="success" icon={<CheckCircle size={13} />} onClick={() => handleAction(req.id, 'approve')}>Approve</Button>
                        <Button size="xs" variant="danger"  icon={<XCircle size={13} />}    onClick={() => handleAction(req.id, 'reject')}>Reject</Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Users panel ─────────────────────────────────────────────────────────────
function UsersPanel() {
  const toast = useToast();
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState('all');

  const load = () => {
    setLoading(true);
    getAllUsers({ search: search || undefined })
      .then(({ data }) => setUsers(data ?? []))
      .catch(err => toast(err.message || 'Could not load users', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = users.filter(u =>
    filter === 'verified' ? u.is_verified :
    filter === 'unverified' ? !u.is_verified : true
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-black text-surface-950">All Users <span className="text-sm font-semibold text-surface-400">({users.length})</span></h2>
        <div className="flex gap-2">
          <input type="text" placeholder="Search name…" value={search}
            onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()}
            className="px-3 py-2 rounded-xl bg-white border border-surface-200 text-sm text-surface-900 placeholder:text-surface-300 focus:outline-none focus:ring-2 focus:ring-brand-200 w-44" />
          <Button size="sm" variant="secondary" onClick={load} icon={<RefreshCw size={13} />}>Search</Button>
        </div>
      </div>
      <div className="flex gap-2 mb-4">
        {[['all','All'],['verified','Verified'],['unverified','Unverified']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${filter === val ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-surface-600 border-surface-200 hover:border-brand-300'}`}>
            {label}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-3xl card-shadow border border-surface-50 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-surface-50 rounded-2xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-surface-400">No users found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-surface-100">
                {['User','Phone','College','Status','Rides','Rating','Joined'].map(h => (
                  <th key={h} className="text-left px-4 py-3.5 text-xs font-bold text-surface-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {filtered.map((u, i) => (
                  <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    className="border-b border-surface-50 last:border-0 hover:bg-surface-50/50 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={u.name} size="sm" verified={u.is_verified} />
                        <div>
                          <p className="font-semibold text-surface-900">{u.name}</p>
                          <p className="text-xs text-surface-400 capitalize">{u.gender ?? '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-surface-500">{u.phone ?? '—'}</td>
                    <td className="px-4 py-3.5 text-surface-600 max-w-[120px] truncate">{u.college ?? '—'}</td>
                    <td className="px-4 py-3.5"><Badge variant={u.is_verified ? 'success' : 'warning'}>{u.is_verified ? 'Verified' : 'Unverified'}</Badge></td>
                    <td className="px-4 py-3.5 font-semibold text-surface-700 text-center">{u.total_rides ?? 0}</td>
                    <td className="px-4 py-3.5">{u.rating ? <span className="font-semibold text-amber-600">★ {Number(u.rating).toFixed(1)}</span> : <span className="text-surface-300">—</span>}</td>
                    <td className="px-4 py-3.5 text-surface-400 text-xs font-medium whitespace-nowrap">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' }) : '—'}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Rides panel ─────────────────────────────────────────────────────────────
function RidesPanel() {
  const toast = useToast();
  const [rides,   setRides]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all');

  const load = () => {
    setLoading(true);
    supabase.from('rides')
      .select('id, from_label, to_label, date, time, price_per_seat, available_seats, total_seats, status, created_at, driver:profiles!rides_driver_id_fkey(name, phone)')
      .order('created_at', { ascending: false }).limit(100)
      .then(({ data, error }) => { if (error) toast(error.message, 'error'); else setRides(data ?? []); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = rides.filter(r => filter === 'all' || r.status === filter);
  const statusColor = { active: 'success', upcoming: 'brand', completed: 'neutral', cancelled: 'danger' };
  const counts = { all: rides.length, upcoming: 0, active: 0, completed: 0, cancelled: 0 };
  rides.forEach(r => { if (counts[r.status] !== undefined) counts[r.status]++; });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-black text-surface-950">All Rides <span className="text-sm font-semibold text-surface-400">({rides.length})</span></h2>
        <button onClick={load} className="flex items-center gap-1.5 text-xs text-surface-400 hover:text-brand-600 transition-colors font-semibold"><RefreshCw size={13} /> Refresh</button>
      </div>
      <div className="flex gap-2 mb-4 flex-wrap">
        {[['all','All'],['upcoming','Upcoming'],['active','Active'],['completed','Completed'],['cancelled','Cancelled']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${filter === val ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-surface-600 border-surface-200 hover:border-brand-300'}`}>
            {label} {counts[val] > 0 && <span className="opacity-70">({counts[val]})</span>}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-3xl card-shadow border border-surface-50 overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-12 bg-surface-50 rounded-2xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-surface-400">No rides found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-surface-100">
                {['Driver','Route','Date','Time','Price','Seats','Status'].map(h => (
                  <th key={h} className="text-left px-4 py-3.5 text-xs font-bold text-surface-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {filtered.map((ride, i) => (
                  <motion.tr key={ride.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="border-b border-surface-50 last:border-0 hover:bg-surface-50/50 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-surface-900">{ride.driver?.name ?? '—'}</p>
                      {ride.driver?.phone && <p className="text-xs text-surface-400 font-mono">{ride.driver.phone}</p>}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="flex items-center gap-1 text-surface-700 font-medium">
                        <span className="max-w-[90px] truncate">{ride.from_label}</span>
                        <ChevronRight size={12} className="text-surface-300 flex-shrink-0" />
                        <span className="max-w-[90px] truncate">{ride.to_label}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-surface-500 font-medium whitespace-nowrap">
                      {ride.date ? new Date(ride.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-surface-500 font-medium">{ride.time}</td>
                    <td className="px-4 py-3.5 font-bold text-brand-600">₹{ride.price_per_seat}</td>
                    <td className="px-4 py-3.5 text-surface-600">{ride.available_seats}/{ride.total_seats}</td>
                    <td className="px-4 py-3.5"><Badge variant={statusColor[ride.status] || 'neutral'} dot={ride.status === 'active'}>{ride.status?.charAt(0).toUpperCase() + ride.status?.slice(1)}</Badge></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Reports panel ────────────────────────────────────────────────────────────
function ReportsPanel() {
  const toast = useToast();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    supabase.from('reports')
      .select('id, type, description, status, created_at, reporter:profiles!reports_reporter_id_fkey(name, phone), reported:profiles!reports_reported_user_id_fkey(name, phone)')
      .order('created_at', { ascending: false }).limit(50)
      .then(({ data, error }) => { if (error) toast(error.message, 'error'); else setReports(data ?? []); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const statusColor = { resolved: 'success', reviewing: 'warning', escalated: 'danger', open: 'neutral', dismissed: 'neutral' };
  const openCount = reports.filter(r => r.status === 'open' || r.status === 'reviewing').length;

  const handleAction = async (id, status) => {
    const { error } = await supabase.from('reports').update({ status, ...(status === 'resolved' ? { resolved_at: new Date().toISOString() } : {}) }).eq('id', id);
    if (error) { toast(error.message, 'error'); return; }
    setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    toast(status === 'resolved' ? 'Marked as resolved' : 'Report dismissed', 'success');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-black text-surface-950">Reports {openCount > 0 && <span className="ml-2 text-sm font-semibold text-red-500">({openCount} open)</span>}</h2>
        <button onClick={load} className="flex items-center gap-1.5 text-xs text-surface-400 hover:text-brand-600 transition-colors font-semibold"><RefreshCw size={13} /> Refresh</button>
      </div>
      {loading ? (
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="bg-white rounded-3xl h-28 animate-pulse card-shadow border border-surface-50" />)}</div>
      ) : reports.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center card-shadow border border-surface-100">
          <CheckCircle size={40} className="text-green-400 mx-auto mb-3" />
          <p className="font-bold text-surface-700">No reports filed</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((rep, i) => (
            <motion.div key={rep.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white rounded-3xl p-5 card-shadow border border-surface-50">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${rep.type === 'Harassment' || rep.type === 'Unsafe Driving' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'}`}>{rep.type}</span>
                  <span className="text-xs text-surface-400">{rep.created_at ? new Date(rep.created_at).toLocaleDateString('en-IN') : '—'}</span>
                </div>
                <Badge variant={statusColor[rep.status] || 'neutral'}>{rep.status?.charAt(0).toUpperCase() + rep.status?.slice(1)}</Badge>
              </div>
              <p className="text-sm text-surface-700 mb-3 leading-relaxed">{rep.description}</p>
              <div className="flex flex-wrap gap-4 text-xs text-surface-400 mb-3">
                <span>Filed by: <strong className="text-surface-700">{rep.reporter?.name ?? '—'}</strong>{rep.reporter?.phone && <span className="font-mono ml-1">({rep.reporter.phone})</span>}</span>
                <span>Against: <strong className="text-surface-700">{rep.reported?.name ?? '—'}</strong></span>
              </div>
              {rep.status !== 'resolved' && rep.status !== 'dismissed' && (
                <div className="flex gap-2">
                  <Button size="xs" icon={<CheckCircle size={12} />} onClick={() => handleAction(rep.id, 'resolved')}>Resolve</Button>
                  <Button size="xs" variant="secondary" icon={<X size={12} />} onClick={() => handleAction(rep.id, 'dismissed')}>Dismiss</Button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Support panel ────────────────────────────────────────────────────────────
function SupportPanel() {
  const toast = useToast();
  const { profile } = useAuth();

  const [tickets,    setTickets]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState('open');
  const [stats,      setStats]      = useState(null);
  const [activeId,   setActiveId]   = useState(null);
  const [reply,      setReply]      = useState('');
  const [replying,   setReplying]   = useState(false);

  const load = async (status) => {
    setLoading(true);
    try {
      const { data } = await getAllTickets({ status: status !== 'all' ? status : undefined });
      setTickets(data);
      const s = await getSupportStats();
      setStats(s);
    } catch (err) { toast(err.message || 'Failed to load tickets', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(filter); }, [filter]);

  const handleReply = async (ticketId) => {
    if (!reply.trim()) { toast('Enter a reply', 'error'); return; }
    setReplying(true);
    try {
      await replyTicket(ticketId, {
        adminId: profile?.id,
        reply,
        status: 'in_progress',
      });
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, admin_reply: reply, status: 'in_progress', replied_at: new Date().toISOString() } : t));
      setReply('');
      setActiveId(null);
      toast('Reply sent!', 'success');
    } catch (err) { toast(err.message || 'Failed to send reply', 'error'); }
    finally { setReplying(false); }
  };

  const handleClose = async (ticketId) => {
    try {
      await updateTicketStatus(ticketId, 'resolved');
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: 'resolved' } : t));
      toast('Ticket resolved', 'success');
    } catch (err) { toast(err.message, 'error'); }
  };

  const statusColor  = { open: 'brand', in_progress: 'warning', resolved: 'success', closed: 'neutral' };
  const priorityColor = { urgent: 'danger', high: 'warning', normal: 'brand', low: 'neutral' };
  const openCount    = (stats?.open ?? 0) + (stats?.inProgress ?? 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-black text-surface-950">
          Support Tickets
          {openCount > 0 && <span className="ml-2 text-sm font-semibold text-red-500">({openCount} open)</span>}
        </h2>
        <button onClick={() => load(filter)} className="flex items-center gap-1.5 text-xs text-surface-400 hover:text-brand-600 transition-colors font-semibold">
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Open',        value: stats.open,        color: 'bg-brand-50 text-brand-700'  },
            { label: 'In Progress', value: stats.inProgress,  color: 'bg-amber-50 text-amber-700'  },
            { label: 'Resolved',    value: stats.resolved,    color: 'bg-green-50 text-green-700'  },
          ].map(s => (
            <div key={s.label} className={`${s.color} rounded-2xl p-4 text-center`}>
              <p className="text-2xl font-black">{s.value}</p>
              <p className="text-xs font-semibold mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter chips */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[['open','Open'],['in_progress','In Progress'],['resolved','Resolved'],['all','All']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${filter === val ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-surface-600 border-surface-200 hover:border-brand-300'}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="bg-white rounded-3xl h-32 animate-pulse card-shadow border border-surface-50" />)}</div>
      ) : tickets.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center card-shadow border border-surface-100">
          <HelpCircle size={40} className="text-surface-200 mx-auto mb-3" />
          <p className="font-bold text-surface-700">No tickets found</p>
          <p className="text-surface-400 text-sm mt-1">
            {filter === 'open' ? 'No open support tickets right now.' : `No ${filter.replace('_', ' ')} tickets.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white rounded-3xl p-5 card-shadow border border-surface-50">

              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <Badge variant={statusColor[t.status]   ?? 'neutral'}>{t.status?.replace('_',' ')}</Badge>
                    <Badge variant={priorityColor[t.priority] ?? 'neutral'}>{t.priority}</Badge>
                    <span className="text-xs bg-surface-100 text-surface-600 px-2 py-0.5 rounded-full font-medium">{t.category}</span>
                  </div>
                  <p className="font-bold text-surface-900">{t.subject}</p>
                </div>
                <span className="text-xs text-surface-400 whitespace-nowrap">
                  {new Date(t.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
              </div>

              {/* Submitter info */}
              <div className="flex items-center gap-3 mb-3 bg-surface-50 rounded-xl px-3 py-2">
                <Avatar name={t.name} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-surface-900">{t.name}</p>
                  <p className="text-xs text-surface-400">
                    {t.user?.phone && <span className="font-mono">{t.user.phone}</span>}
                    {t.user?.college && <span> · {t.user.college}</span>}
                    {t.email && !t.user?.phone && <span>{t.email}</span>}
                  </p>
                </div>
              </div>

              {/* Message */}
              <p className="text-sm text-surface-700 leading-relaxed mb-3">{t.message}</p>

              {/* Existing admin reply */}
              {t.admin_reply && (
                <div className="bg-brand-50 border border-brand-100 rounded-2xl p-3.5 mb-3">
                  <p className="text-xs font-bold text-brand-600 mb-1.5 flex items-center gap-1.5">
                    <MessageSquare size={11} /> Your Reply
                    {t.replied_at && <span className="font-normal text-surface-400 ml-1">· {new Date(t.replied_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>}
                  </p>
                  <p className="text-sm text-surface-700">{t.admin_reply}</p>
                </div>
              )}

              {/* Reply box */}
              {activeId === t.id && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-3">
                  <textarea
                    rows={3}
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                    placeholder="Type your reply to the user…"
                    className="w-full px-4 py-3 rounded-2xl bg-surface-50 border border-surface-100 text-sm text-surface-900 placeholder:text-surface-300 focus:outline-none focus:ring-2 focus:ring-brand-200 resize-none"
                  />
                </motion.div>
              )}

              {/* Actions */}
              {t.status !== 'resolved' && t.status !== 'closed' && (
                <div className="flex gap-2 flex-wrap">
                  {activeId === t.id ? (
                    <>
                      <Button size="xs" loading={replying} icon={<Send size={12} />} onClick={() => handleReply(t.id)}>Send Reply</Button>
                      <Button size="xs" variant="secondary" onClick={() => { setActiveId(null); setReply(''); }}>Cancel</Button>
                    </>
                  ) : (
                    <>
                      <Button size="xs" icon={<MessageSquare size={12} />} onClick={() => { setActiveId(t.id); setReply(t.admin_reply ?? ''); }}>
                        {t.admin_reply ? 'Edit Reply' : 'Reply'}
                      </Button>
                      <Button size="xs" variant="secondary" icon={<CheckCircle size={12} />} onClick={() => handleClose(t.id)}>Mark Resolved</Button>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────
export default function AdminPage() {
  const { profile } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [pendingVerif,  setPendingVerif]  = useState(0);
  const [openTickets,   setOpenTickets]   = useState(0);

  useEffect(() => {
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('verification_status', 'pending')
      .then(({ count }) => setPendingVerif(count ?? 0));
    supabase.from('support_tickets').select('id', { count: 'exact', head: true }).eq('status', 'open')
      .then(({ count }) => setOpenTickets(count ?? 0));
  }, []);

  const NAV_ITEMS = [
    { id: 'dashboard',    label: 'Dashboard',    icon: <LayoutDashboard size={18} /> },
    { id: 'verification', label: 'Verification', icon: <Shield size={18} />,      badge: pendingVerif },
    { id: 'users',        label: 'Users',        icon: <Users size={18} /> },
    { id: 'rides',        label: 'Rides',        icon: <Car size={18} /> },
    { id: 'reports',      label: 'Reports',      icon: <AlertTriangle size={18} /> },
    { id: 'support',      label: 'Support',      icon: <HelpCircle size={18} />,   badge: openTickets  },
  ];

  const panels = {
    dashboard:    <DashboardPanel />,
    verification: <VerificationPanel />,
    users:        <UsersPanel />,
    rides:        <RidesPanel />,
    reports:      <ReportsPanel />,
    support:      <SupportPanel />,
  };

  return (
    <div className="min-h-screen bg-surface-50 flex">

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-surface-100 fixed left-0 top-0 bottom-0 pt-20 z-30">
        <div className="px-4 py-3 mb-2">
          <p className="text-xs font-bold text-surface-400 uppercase tracking-wider px-2">Admin Panel</p>
        </div>
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(item => (
            <motion.button key={item.id} onClick={() => setActiveSection(item.id)} whileHover={{ x: 2 }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 text-left
                ${activeSection === item.id ? 'bg-brand-50 text-brand-700' : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'}`}>
              <span className={activeSection === item.id ? 'text-brand-600' : 'text-surface-400'}>{item.icon}</span>
              {item.label}
              {item.badge > 0 && (
                <span className="ml-auto text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">{item.badge}</span>
              )}
            </motion.button>
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-surface-100">
          <div className="flex items-center gap-2.5">
            <Avatar name={profile?.name ?? 'Admin'} size="sm" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-surface-900 truncate">{profile?.name ?? 'Admin'}</p>
              <p className="text-[10px] text-surface-400 truncate">{profile?.phone ? `+91 ${profile.phone}` : 'Admin'}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-surface-100 pt-16">
        <div className="flex gap-1 px-3 py-2 overflow-x-auto no-scrollbar">
          {NAV_ITEMS.map(item => (
            <button key={item.id} onClick={() => setActiveSection(item.id)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200
                ${activeSection === item.id ? 'bg-brand-600 text-white' : 'bg-surface-100 text-surface-600'}`}>
              {item.icon}
              {item.label}
              {item.badge > 0 && activeSection !== item.id && (
                <span className="bg-red-500 text-white text-[9px] font-bold px-1 rounded-full">{item.badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 lg:ml-60 pt-32 lg:pt-24 pb-8 px-4 sm:px-6 lg:px-8 min-w-0">
        <AnimatePresence mode="wait">
          <motion.div key={activeSection}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}>
            {panels[activeSection]}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
