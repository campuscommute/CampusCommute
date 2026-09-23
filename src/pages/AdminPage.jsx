import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle, BarChart2, Car, CheckCircle,
  ChevronRight, GraduationCap, LayoutDashboard,
  Shield, TrendingUp, Users, X, XCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { adminReports, adminRides } from '../data/mockData';
import {
  getAdminStats,
  getAllUsers,
  reviewVerification,
} from '../services/usersService';
import { supabase } from '../lib/supabase';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';

const NAV_ITEMS = [
  { id: 'dashboard',    label: 'Dashboard',    icon: <LayoutDashboard size={18} /> },
  { id: 'verification', label: 'Verification', icon: <Shield size={18} />, badge: 5 },
  { id: 'users',        label: 'Users',        icon: <Users size={18} /> },
  { id: 'rides',        label: 'Rides',        icon: <Car size={18} /> },
  { id: 'reports',      label: 'Reports',      icon: <AlertTriangle size={18} /> },
];

// ─── Stat Card ────────────────────────────────────────────────────────────────
function AdminStatCard({ label, value, icon, sub, color = 'brand', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 300, damping: 24 }}
      className="bg-white rounded-2xl p-5 card-shadow border border-surface-50"
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
          color === 'brand' ? 'bg-brand-50 text-brand-600' :
          color === 'green' ? 'bg-green-50 text-green-600' :
          color === 'amber' ? 'bg-amber-50 text-amber-600' :
          color === 'red'   ? 'bg-red-50 text-red-500'     : 'bg-surface-50 text-surface-500'
        }`}>
          {icon}
        </div>
        {sub && (
          <span className={`text-xs font-semibold flex items-center gap-1 ${
            sub.startsWith('+') ? 'text-green-600' : 'text-surface-400'
          }`}>
            <TrendingUp size={11} />
            {sub}
          </span>
        )}
      </div>
      <p className="text-3xl font-black text-surface-950">{typeof value === 'number' ? value.toLocaleString() : value}</p>
      <p className="text-sm text-surface-400 font-medium mt-1">{label}</p>
    </motion.div>
  );
}

// ─── Dashboard panel ──────────────────────────────────────────────────────────
function DashboardPanel() {
  const toast = useToast();
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch(err => toast(err.message || 'Could not load stats', 'error'))
      .finally(() => setStatsLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-black text-surface-950 mb-4">Overview</h2>
        {statsLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white rounded-2xl p-5 card-shadow border border-surface-50 animate-pulse h-28" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <AdminStatCard label="Total Students"         value={stats?.totalStudents        ?? 0} icon={<Users size={18} />}    color="brand" delay={0.00} />
            <AdminStatCard label="Total Rides"            value={stats?.totalRides           ?? 0} icon={<Car size={18} />}      color="green" delay={0.06} />
            <AdminStatCard label="Active Rides"           value={stats?.activeRides          ?? 0} icon={<BarChart2 size={18} />} color="amber" delay={0.12} />
            <AdminStatCard label="Pending Verifications"  value={stats?.pendingVerifications ?? 0} icon={<Shield size={18} />}   color="red"   delay={0.18} />
          </div>
        )}
      </div>

      {/* Recent activity — static feed; replace with real subscription when needed */}
      <div className="bg-white rounded-3xl p-5 card-shadow border border-surface-50">
        <h3 className="font-bold text-surface-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {[
            { text: 'Sneha Patel submitted verification request',  time: '2 min ago',  icon: '🎓' },
            { text: 'Rahul Kumar completed ride: Okhla → GNIOT',  time: '14 min ago', icon: '✅' },
            { text: 'New report: Unsafe Driving by Arjun Mehta',  time: '1 hr ago',   icon: '⚠️' },
            { text: 'Aman Sharma published a new ride',           time: '2 hr ago',   icon: '🚗' },
            { text: 'Riya Joshi submitted verification request',  time: '3 hr ago',   icon: '🎓' },
          ].map((a, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.07 }}
              className="flex items-center gap-3 py-2 border-b border-surface-50 last:border-0"
            >
              <span className="text-lg flex-shrink-0">{a.icon}</span>
              <p className="text-sm text-surface-700 flex-1">{a.text}</p>
              <span className="text-xs text-surface-400 flex-shrink-0">{a.time}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Verification panel ───────────────────────────────────────────────────────
function VerificationPanel() {
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all pending verification profiles from Supabase
  useEffect(() => {
    supabase
      .from('profiles')
      .select('id, name, college, enrollment_no, college_id_url, selfie_url, verification_status, created_at')
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
      toast(
        action === 'approve' ? 'Student approved successfully!' : 'Verification rejected.',
        action === 'approve' ? 'success' : 'error',
      );
    } catch (err) {
      toast(err.message || 'Action failed', 'error');
    }
  };

  const statusBadge = {
    pending:  <Badge variant="warning">Pending</Badge>,
    approved: <Badge variant="success">Approved</Badge>,
    rejected: <Badge variant="danger">Rejected</Badge>,
  };

  return (
    <div>
      <h2 className="text-xl font-black text-surface-950 mb-4">
        Verification Requests
        <span className="ml-2 text-sm font-semibold text-brand-600">
          ({requests.length} pending)
        </span>
      </h2>

      <div className="bg-white rounded-3xl card-shadow border border-surface-50 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-surface-400 animate-pulse">Loading…</div>
        ) : requests.length === 0 ? (
          <div className="p-8 text-center text-surface-400">No pending verification requests.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-100">
                  {['Student', 'College', 'Enroll No.', 'Documents', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3.5 text-xs font-bold text-surface-400 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map((req, i) => (
                  <motion.tr
                    key={req.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b border-surface-50 last:border-0 hover:bg-surface-50/50 transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={req.name} size="sm" />
                        <div>
                          <p className="font-semibold text-surface-900 text-sm">{req.name}</p>
                          <p className="text-xs text-surface-400">
                            {req.created_at ? new Date(req.created_at).toLocaleDateString('en-IN') : '—'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-surface-600 font-medium">{req.college}</td>
                    <td className="px-4 py-3.5 font-mono text-xs text-surface-500">{req.enrollment_no ?? '—'}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-1.5">
                        <span className={`text-xs px-2 py-1 rounded-lg font-semibold ${req.college_id_url ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                          {req.college_id_url ? '✓ ID' : '✗ ID'}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-lg font-semibold ${req.selfie_url ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                          {req.selfie_url ? '✓ Selfie' : '✗ Selfie'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-2">
                        <Button
                          size="xs"
                          variant="success"
                          icon={<CheckCircle size={13} />}
                          onClick={() => handleAction(req.id, 'approve')}
                        >
                          Approve
                        </Button>
                        <Button
                          size="xs"
                          variant="danger"
                          icon={<XCircle size={13} />}
                          onClick={() => handleAction(req.id, 'reject')}
                        >
                          Reject
                        </Button>
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
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllUsers()
      .then(({ data }) => setUsers(data ?? []))
      .catch(err => toast(err.message || 'Could not load users', 'error'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h2 className="text-xl font-black text-surface-950 mb-4">All Users</h2>
      <div className="bg-white rounded-3xl card-shadow border border-surface-50 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-surface-400 animate-pulse">Loading…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-100">
                  {['User', 'College', 'Status', 'Rides', 'Rating', 'Joined'].map(h => (
                    <th key={h} className="text-left px-4 py-3.5 text-xs font-bold text-surface-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b border-surface-50 last:border-0 hover:bg-surface-50/50 transition-colors cursor-pointer"
                    onClick={() => toast(`Viewing ${u.name}'s profile`, 'info')}
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={u.name} size="sm" verified={u.is_verified} />
                        <p className="font-semibold text-surface-900">{u.name}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-surface-600">{u.college}</td>
                    <td className="px-4 py-3.5">
                      <Badge variant={u.is_verified ? 'success' : 'warning'}>
                        {u.is_verified ? '🎓 Verified' : '⏳ Pending'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-surface-700">{u.total_rides ?? 0}</td>
                    <td className="px-4 py-3.5">
                      {u.rating ? (
                        <span className="flex items-center gap-1 font-semibold text-amber-600">
                          ★ {u.rating}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-surface-400 text-xs font-medium">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—'}
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
  const statusColor = { active: 'success', upcoming: 'brand', completed: 'neutral' };
  return (
    <div>
      <h2 className="text-xl font-black text-surface-950 mb-4">All Rides</h2>
      <div className="bg-white rounded-3xl card-shadow border border-surface-50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-100">
                {['Driver', 'Route', 'Date', 'Time', 'Price', 'Passengers', 'Status'].map(h => (
                  <th key={h} className="text-left px-4 py-3.5 text-xs font-bold text-surface-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {adminRides.map((ride, i) => (
                <motion.tr
                  key={ride.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b border-surface-50 last:border-0 hover:bg-surface-50/50 transition-colors"
                >
                  <td className="px-4 py-3.5 font-semibold text-surface-900">{ride.driver}</td>
                  <td className="px-4 py-3.5">
                    <span className="flex items-center gap-1 text-surface-700 font-medium">
                      {ride.from} <ChevronRight size={12} className="text-surface-300" /> {ride.to}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-surface-500 font-medium">{ride.date}</td>
                  <td className="px-4 py-3.5 text-surface-500 font-medium">{ride.time}</td>
                  <td className="px-4 py-3.5 font-bold text-brand-600">₹{ride.price}</td>
                  <td className="px-4 py-3.5 text-surface-600">{ride.passengers}/{ride.seats}</td>
                  <td className="px-4 py-3.5">
                    <Badge variant={statusColor[ride.status] || 'neutral'} dot={ride.status === 'active'}>
                      {ride.status.charAt(0).toUpperCase() + ride.status.slice(1)}
                    </Badge>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Reports panel ────────────────────────────────────────────────────────────
function ReportsPanel() {
  const toast = useToast();
  const [reports, setReports] = useState(adminReports);

  const statusColor = { resolved: 'success', reviewing: 'warning', escalated: 'danger' };

  const handleResolve = (id) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, status: 'resolved' } : r));
    toast('Report marked as resolved', 'success');
  };

  return (
    <div>
      <h2 className="text-xl font-black text-surface-950 mb-4">Reports</h2>
      <div className="space-y-4">
        {reports.map((rep, i) => (
          <motion.div
            key={rep.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className="bg-white rounded-3xl p-5 card-shadow border border-surface-50"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  rep.type === 'Harassment' || rep.type === 'Unsafe Driving'
                    ? 'bg-red-50 text-red-600'
                    : 'bg-amber-50 text-amber-700'
                }`}>
                  {rep.type}
                </span>
                <span className="text-xs text-surface-400">{rep.date}</span>
              </div>
              <Badge variant={statusColor[rep.status] || 'neutral'}>
                {rep.status.charAt(0).toUpperCase() + rep.status.slice(1)}
              </Badge>
            </div>
            <p className="text-sm text-surface-700 mb-2 leading-relaxed">{rep.description}</p>
            <div className="flex items-center gap-4 text-xs text-surface-400 mb-3">
              <span>Reporter: <strong className="text-surface-600">{rep.reporter}</strong></span>
              <span>Against: <strong className="text-surface-600">{rep.against}</strong></span>
            </div>
            {rep.status !== 'resolved' && (
              <div className="flex gap-2">
                <Button size="xs" onClick={() => handleResolve(rep.id)} icon={<CheckCircle size={12} />}>
                  Mark Resolved
                </Button>
                <Button size="xs" variant="secondary" onClick={() => toast('Escalation coming soon', 'info')}>
                  Escalate
                </Button>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────
export default function AdminPage() {
  const [activeSection, setActiveSection] = useState('dashboard');

  const panels = {
    dashboard:    <DashboardPanel />,
    verification: <VerificationPanel />,
    users:        <UsersPanel />,
    rides:        <RidesPanel />,
    reports:      <ReportsPanel />,
  };

  return (
    <div className="min-h-screen bg-surface-50 flex">

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-white border-r border-surface-100 fixed left-0 top-0 bottom-0 pt-20 z-30">
        <div className="px-4 py-3 mb-2">
          <p className="text-xs font-bold text-surface-400 uppercase tracking-wider px-2">Admin Panel</p>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {NAV_ITEMS.map(item => (
            <motion.button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              whileHover={{ x: 2 }}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold
                transition-all duration-200 text-left
                ${activeSection === item.id
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'
                }
              `}
            >
              <span className={activeSection === item.id ? 'text-brand-600' : 'text-surface-400'}>
                {item.icon}
              </span>
              {item.label}
              {item.badge && (
                <span className="ml-auto text-[10px] font-bold bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </motion.button>
          ))}
        </nav>

        {/* Admin user */}
        <div className="px-4 py-4 border-t border-surface-100">
          <div className="flex items-center gap-2.5">
            <Avatar name="Admin User" size="sm" />
            <div>
              <p className="text-xs font-bold text-surface-900">Admin</p>
              <p className="text-[10px] text-surface-400">admin@campus.com</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-surface-100 pt-16">
        <div className="flex gap-1 px-3 py-2 overflow-x-auto no-scrollbar">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`
                flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold
                transition-all duration-200
                ${activeSection === item.id
                  ? 'bg-brand-600 text-white'
                  : 'bg-surface-100 text-surface-600'
                }
              `}
            >
              {item.icon}
              {item.label}
              {item.badge && activeSection !== item.id && (
                <span className="bg-brand-500 text-white text-[9px] font-bold px-1 rounded-full">{item.badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 lg:ml-60 pt-32 lg:pt-24 pb-8 px-4 sm:px-6 lg:px-8 min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            {panels[activeSection]}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
