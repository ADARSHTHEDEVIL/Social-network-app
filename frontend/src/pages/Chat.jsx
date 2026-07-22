import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

function Chat() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [locked, setLocked] = useState(true);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const pollRef = useRef(null);

  const CHAT_PIN = localStorage.getItem("chat_pin") || "";

  useEffect(() => {
    if (!locked) {
      loadConversations();
    }
  }, [locked]);

  useEffect(() => {
    if (activeChat && !locked) {
      loadMessages(activeChat.user_id);
      pollRef.current = setInterval(() => loadMessages(activeChat.user_id), 4000);
      return () => clearInterval(pollRef.current);
    }
  }, [activeChat, locked]);

  const loadConversations = async () => {
    try {
      const res = await api.get("/conversations/");
      setConversations(res.data);
    } catch (err) {
      console.error(err);
    }
  };
  
  const searchUsers = async (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await api.get(`/users/search/?q=${encodeURIComponent(query)}`);
      setSearchResults(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const startNewChat = (user) => {
    setActiveChat({ user_id: user.id, full_name: user.full_name });
    setShowNewChat(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const loadMessages = async (userId) => {
    try {
      const res = await api.get(`/conversations/${userId}/`);
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !activeChat) return;
    try {
      await api.post(`/conversations/${activeChat.user_id}/`, { text: newMessage });
      setNewMessage("");
      loadMessages(activeChat.user_id);
      loadConversations();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnlock = () => {
    if (!CHAT_PIN) {
      localStorage.setItem("chat_pin", pinInput);
      setLocked(false);
      return;
    }
    if (pinInput === CHAT_PIN) {
      setLocked(false);
      setPinError("");
    } else {
      setPinError("Incorrect PIN");
    }
    setPinInput("");
  };

  if (locked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
        <div className="w-full max-w-sm bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl p-8 text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="text-xl font-bold text-white mb-2">
            {CHAT_PIN ? "Enter Chat PIN" : "Set a Chat PIN"}
          </h1>
          <p className="text-slate-400 text-sm mb-6">
            {CHAT_PIN
              ? "Private chats are locked for your privacy."
              : "Create a PIN to protect your private conversations."}
          </p>
          <input
            type="password"
            inputMode="numeric"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
            placeholder="Enter PIN"
            className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-center tracking-widest placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition mb-3"
            autoFocus
          />
          {pinError && <p className="text-red-400 text-sm mb-3">{pinError}</p>}
          <button
            onClick={handleUnlock}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-lg transition"
          >
            {CHAT_PIN ? "Unlock" : "Set PIN"}
          </button>
          <button
            onClick={() => navigate("/profile")}
            className="w-full text-slate-400 hover:text-white text-sm mt-4 transition"
          >
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Messages</h1>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => setShowNewChat((prev) => !prev)}
              className="text-indigo-400 hover:text-indigo-300 text-sm font-medium transition"
            >
              + New Message
            </button>
            <button
              onClick={() => setLocked(true)}
              className="text-slate-400 hover:text-white text-sm font-medium transition"
            >
              🔒 Lock
            </button>
            <button
              onClick={() => navigate("/profile")}
              className="text-slate-400 hover:text-white text-sm font-medium transition"
            >
              Back to Profile
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[70vh]">
          {/* Conversation list */}
          <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl p-4 overflow-y-auto">
            {showNewChat && (
              <div className="mb-3 pb-3 border-b border-slate-700/50">
                <input
                  value={searchQuery}
                  onChange={(e) => searchUsers(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition mb-2"
                  autoFocus
                />
                {searchResults.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => startNewChat(u)}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-slate-700/50 transition"
                  >
                    {u.full_name} <span className="text-slate-500 text-xs">{u.email}</span>
                  </button>
                ))}
              </div>
            )}
            {conversations.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-8">No conversations yet.</p>
            )}
            {conversations.map((conv) => (
              <button
                key={conv.user_id}
                onClick={() => setActiveChat(conv)}
                className={`w-full text-left p-3 rounded-lg mb-1 transition ${
                  activeChat?.user_id === conv.user_id ? "bg-indigo-600/30" : "hover:bg-slate-700/50"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-white text-sm font-medium">{conv.full_name}</span>
                  {conv.unread_count > 0 && (
                    <span className="bg-indigo-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
                <p className="text-slate-500 text-xs truncate">{conv.last_message}</p>
              </button>
            ))}
          </div>

          {/* Chat window */}
          <div className="md:col-span-2 bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl flex flex-col">
            {!activeChat ? (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
                Select a conversation
              </div>
            ) : (
              <>
                <div className="p-4 border-b border-slate-700/50">
                  <p className="text-white font-medium">{activeChat.full_name}</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`max-w-[70%] px-3 py-2 rounded-lg text-sm ${
                        msg.sender === activeChat.user_id
                          ? "bg-slate-700 text-slate-200 self-start"
                          : "bg-indigo-600 text-white self-end ml-auto"
                      }`}
                    >
                      {msg.text}
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-slate-700/50 flex gap-2">
                  <input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  />
                  <button
                    onClick={handleSend}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 rounded-lg transition"
                  >
                    Send
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Chat;