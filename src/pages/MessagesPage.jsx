import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, MessageCircle, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  getConversation,
  getConversations,
  markAsRead,
  sendMessage,
  subscribeToConversation,
} from '../services/messagesService';
import { getProfile } from '../services/usersService';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/ui/Avatar';
import { useToast } from '../components/ui/Toast';

// ─── Conversation list item ───────────────────────────────────────────────────
function ConvoItem({ convo, active, onClick }) {
  const { other, lastMessage } = convo;
  const isUnread = !lastMessage.read && lastMessage.receiver_id === convo.myId;
  const time = lastMessage.created_at
    ? new Date(lastMessage.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className={`w-full flex items-center gap-3 px-4 py-3.5 transition-colors text-left
        ${active ? 'bg-brand-50' : 'hover:bg-surface-50'}`}
    >
      <Avatar name={other?.name} src={other?.avatar_url} size="md" verified={other?.is_verified} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm truncate ${isUnread ? 'font-bold text-surface-900' : 'font-semibold text-surface-800'}`}>
            {other?.name ?? 'User'}
          </p>
          <span className="text-[11px] text-surface-400 flex-shrink-0">{time}</span>
        </div>
        <p className={`text-xs truncate mt-0.5 ${isUnread ? 'text-surface-700 font-medium' : 'text-surface-400'}`}>
          {lastMessage.content}
        </p>
      </div>
      {isUnread && (
        <div className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />
      )}
    </motion.button>
  );
}

// ─── Chat bubble ─────────────────────────────────────────────────────────────
function ChatBubble({ message, isMine }) {
  const time = message.created_at
    ? new Date(message.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-2`}
    >
      <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isMine
            ? 'bg-brand-600 text-white rounded-br-md'
            : 'bg-white text-surface-900 border border-surface-100 rounded-bl-md'
        }`}>
          {message.content}
        </div>
        <span className="text-[10px] text-surface-400 px-1">{time}</span>
      </div>
    </motion.div>
  );
}

// ─── Chat window ─────────────────────────────────────────────────────────────
function ChatWindow({ userId, otherId, otherProfile, onBack }) {
  const toast = useToast();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // Load messages
  useEffect(() => {
    if (!userId || !otherId) return;
    setLoading(true);
    getConversation(userId, otherId)
      .then(setMessages)
      .catch(() => toast('Could not load messages', 'error'))
      .finally(() => setLoading(false));

    markAsRead(userId, otherId).catch(() => {});
  }, [userId, otherId]);

  // Real-time subscription
  useEffect(() => {
    if (!userId || !otherId) return;
    const channel = subscribeToConversation(userId, otherId, (newMsg) => {
      setMessages(prev => [...prev, newMsg]);
      markAsRead(userId, otherId).catch(() => {});
    });
    return () => channel.unsubscribe();
  }, [userId, otherId]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setText('');
    try {
      const msg = await sendMessage({
        senderId:   userId,
        receiverId: otherId,
        content:    trimmed,
      });
      setMessages(prev => [...prev, msg]);
    } catch (err) {
      toast(err.message || 'Failed to send', 'error');
      setText(trimmed); // restore on failure
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-surface-100 bg-white">
        <button
          onClick={onBack}
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-surface-100 transition-colors text-surface-600"
        >
          <ArrowLeft size={20} />
        </button>
        <Avatar name={otherProfile?.name} src={otherProfile?.avatar_url} size="md" verified={otherProfile?.is_verified} />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-surface-900 text-sm">{otherProfile?.name ?? 'User'}</p>
          <p className="text-xs text-surface-400">{otherProfile?.college ?? ''}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 bg-surface-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-brand-300 border-t-brand-600 rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center">
              <MessageCircle size={24} className="text-brand-400" />
            </div>
            <p className="font-semibold text-surface-700">No messages yet</p>
            <p className="text-sm text-surface-400">Say hi to get the conversation started!</p>
          </div>
        ) : (
          <>
            {messages.map(msg => (
              <ChatBubble
                key={msg.id}
                message={msg}
                isMine={msg.sender_id === userId}
              />
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-3 bg-white border-t border-surface-100">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            rows={1}
            className="flex-1 px-4 py-3 rounded-2xl bg-surface-50 border border-surface-100 text-surface-900 text-sm
                       font-medium placeholder:text-surface-300 resize-none focus:outline-none
                       focus:ring-2 focus:ring-brand-200 focus:border-brand-300 transition-all
                       max-h-32 overflow-y-auto"
            style={{ fieldSizing: 'content' }}
          />
          <motion.button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-11 h-11 rounded-2xl bg-brand-600 flex items-center justify-center text-white
                       disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0
                       hover:bg-brand-700 transition-colors"
          >
            <Send size={18} />
          </motion.button>
        </div>
        <p className="text-[11px] text-surface-400 mt-1.5 pl-1">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function MessagesPage() {
  const { user, profile } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Use profile.id (stable) rather than user.id (anon session uid that may differ)
  const myProfileId = profile?.id ?? user?.id;

  const [convos,      setConvos]      = useState([]);
  const [convosLoading, setConvosLoading] = useState(true);
  const [activeId,    setActiveId]    = useState(searchParams.get('userId') || null);
  const [otherProfile, setOtherProfile] = useState(null);

  // Load conversation list
  useEffect(() => {
    if (!myProfileId) return;
    setConvosLoading(true);
    getConversations(myProfileId)
      .then(data => setConvos(data.map(c => ({ ...c, myId: myProfileId }))))
      .catch(() => toast('Could not load conversations', 'error'))
      .finally(() => setConvosLoading(false));
  }, [myProfileId]);

  // Load other user's profile when activeId changes
  useEffect(() => {
    if (!activeId) { setOtherProfile(null); return; }
    const existing = convos.find(c => c.other?.id === activeId);
    if (existing?.other) { setOtherProfile(existing.other); return; }
    getProfile(activeId)
      .then(setOtherProfile)
      .catch(() => {});
  }, [activeId, convos]);

  const openConvo = (otherId) => {
    setActiveId(otherId);
    setSearchParams({ userId: otherId });
  };

  const closeConvo = () => {
    setActiveId(null);
    setSearchParams({});
  };

  const showList = !activeId;
  const showChat = !!activeId;

  return (
    <div className="min-h-screen bg-surface-50 pt-20 pb-28 sm:pb-0">
      <div className="max-w-4xl mx-auto h-[calc(100vh-5rem)]">
        <div className="flex h-full bg-white rounded-3xl overflow-hidden card-shadow border border-surface-100 mx-4 sm:mx-6">

          {/* ── Sidebar — conversation list ── */}
          <div className={`
            ${activeId ? 'hidden md:flex' : 'flex'}
            flex-col w-full md:w-80 border-r border-surface-100 flex-shrink-0
          `}>
            {/* Sidebar header */}
            <div className="px-5 py-4 border-b border-surface-100">
              <h1 className="text-xl font-black text-surface-950">Messages</h1>
              <p className="text-xs text-surface-400 mt-0.5">Your ride conversations</p>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {convosLoading ? (
                <div className="space-y-1 p-3">
                  {[1,2,3].map(i => (
                    <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                      <div className="w-10 h-10 rounded-full bg-surface-100 flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-surface-100 rounded w-1/2" />
                        <div className="h-2 bg-surface-100 rounded w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : convos.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-surface-50 flex items-center justify-center">
                    <MessageCircle size={24} className="text-surface-300" />
                  </div>
                  <p className="font-semibold text-surface-600 text-sm">No conversations yet</p>
                  <p className="text-xs text-surface-400">Book a ride and message your driver!</p>
                </div>
              ) : (
                <div className="divide-y divide-surface-50">
                  {convos.map(convo => (
                    <ConvoItem
                      key={convo.other?.id}
                      convo={convo}
                      active={activeId === convo.other?.id}
                      onClick={() => openConvo(convo.other?.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Chat window ── */}
          <div className={`flex-1 flex-col ${activeId ? 'flex' : 'hidden md:flex'}`}>
            {showChat && user && activeId ? (
              <ChatWindow
                userId={myProfileId}
                otherId={activeId}
                otherProfile={otherProfile}
                onBack={closeConvo}
              />
            ) : (
              /* Empty state on desktop */
              <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
                <div className="w-20 h-20 rounded-3xl bg-brand-50 flex items-center justify-center">
                  <MessageCircle size={36} className="text-brand-300" />
                </div>
                <div>
                  <p className="font-bold text-surface-700 mb-1">Select a conversation</p>
                  <p className="text-sm text-surface-400">Choose a chat from the list to get started</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
