import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState("");

  const [newPostText, setNewPostText] = useState("");
  const [newPostImage, setNewPostImage] = useState(null);
  const [newPostDocument, setNewPostDocument] = useState(null);
  const [posting, setPosting] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [expandedPost, setExpandedPost] = useState(null);
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    loadProfile();
    loadPosts();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await api.get("/profile/");
      setUser(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadPosts = async () => {
    try {
      const res = await api.get("/posts/");
      setPosts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (field, currentValue) => {
    setEditingField(field);
    setEditValue(currentValue);
  };

  const saveEdit = async (field) => {
    try {
      const res = await api.patch("/profile/", { [field]: editValue });
      setUser(res.data);
      setEditingField(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleProfilePictureChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("profile_picture", file);
    try {
      const res = await api.patch("/profile/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUser(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostText.trim() && !newPostImage && !newPostDocument) return;
    setPosting(true);
    const formData = new FormData();
    formData.append("description", newPostText);
    if (newPostImage) formData.append("image", newPostImage);
    if (newPostDocument) formData.append("document", newPostDocument);

    try {
      await api.post("/posts/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setNewPostText("");
      setNewPostImage(null);
      setNewPostDocument(null);
      loadPosts();
    } catch (err) {
      console.error(err);
    } finally {
      setPosting(false);
    }
  };
  const handleDeletePost = async (postId) => {
    try {
      await api.delete(`/posts/${postId}/`);
      setPosts(posts.filter((p) => p.id !== postId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleReact = async (postId, reactionType) => {
    try {
      await api.post(`/posts/${postId}/react/`, {
        reaction_type: reactionType,
      });
      loadPosts();
    } catch (err) {
      console.error(err);
    }
  };

  const getShareUrl = () => `${window.location.origin}/u/${user.id}`;
  const getDocumentViewerUrl = (url) => {
    if (url.toLowerCase().endsWith(".pdf")) {
      return url;
    }
    return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
  };
  const shareToPlatform = (platform) => {
    const url = encodeURIComponent(getShareUrl());
    const text = encodeURIComponent(`Check out ${user.full_name}'s profile on Social Network`);
    const links = {
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      telegram: `https://t.me/share/url?url=${url}&text=${text}`,
      email: `mailto:?subject=${text}&body=${url}`,
    };
    if (platform === "copy") {
      navigator.clipboard.writeText(getShareUrl());
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      window.open(links[platform], "_blank");
    }
    setShowShareMenu(false);
  };
  const toggleComments = async (postId) => {
    if (expandedPost === postId) {
      setExpandedPost(null);
      return;
    }
    setExpandedPost(postId);
    if (!comments[postId]) {
      try {
        const res = await api.get(`/posts/${postId}/comments/`);
        setComments((prev) => ({ ...prev, [postId]: res.data }));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleAddComment = async (postId) => {
    if (!newComment.trim()) return;
    try {
      const res = await api.post(`/posts/${postId}/comments/`, { text: newComment });
      setComments((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), res.data],
      }));
      setNewComment("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    try {
      await api.delete(`/comments/${commentId}/`);
      setComments((prev) => ({
        ...prev,
        [postId]: prev[postId].filter((c) => c.id !== commentId),
      }));
    } catch (err) {
      console.error(err);
    }
  };
  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Social Network</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
      <button
        onClick={() => setShowShareMenu((prev) => !prev)}
        className="text-slate-400 hover:text-white text-sm font-medium transition"
      >
        {copiedLink ? "Link copied!" : "Share Profile"}
      </button>
      {showShareMenu && (
        <div className="absolute right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-10 p-3">
          <div className="grid grid-cols-4 gap-5">
            <button onClick={() => shareToPlatform("whatsapp")} title="WhatsApp" className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center hover:opacity-80 transition">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /><path d="M12 2C6.477 2 2 6.477 2 12c0 1.9.525 3.68 1.437 5.2L2 22l4.938-1.396A9.94 9.94 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18.2a8.17 8.17 0 01-4.393-1.267l-.315-.187-3.107.878.83-3.03-.205-.325A8.174 8.174 0 013.8 12c0-4.53 3.67-8.2 8.2-8.2s8.2 3.67 8.2 8.2-3.67 8.2-8.2 8.2z" /></svg>
            </button>
            <button onClick={() => shareToPlatform("facebook")} title="Facebook" className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center hover:opacity-80 transition">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.128 22 16.991 22 12z" /></svg>
            </button>
            <button onClick={() => shareToPlatform("twitter")} title="X (Twitter)" className="w-10 h-10 rounded-full bg-black flex items-center justify-center hover:opacity-80 transition">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
            </button>
            <button onClick={() => shareToPlatform("linkedin")} title="LinkedIn" className="w-10 h-10 rounded-full bg-[#0A66C2] flex items-center justify-center hover:opacity-80 transition">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 11.001-4.124 2.062 2.062 0 01-.001 4.124zM7.114 20.452H3.558V9h3.556v11.452z" /></svg>
            </button>
            <button onClick={() => shareToPlatform("telegram")} title="Telegram" className="w-10 h-10 rounded-full bg-[#26A5E4] flex items-center justify-center hover:opacity-80 transition">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M9.417 15.181l-.397 5.584c.568 0 .814-.244 1.109-.537l2.663-2.545 5.518 4.041c1.012.564 1.725.267 1.998-.931L23.98 4.156c.359-1.436-.517-2.107-1.484-1.75L1.114 10.53c-1.407.549-1.386 1.335-.24 1.692l5.443 1.7 12.643-7.98c.595-.394 1.136-.176.691.218" /></svg>
            </button>
            <button onClick={() => shareToPlatform("email")} title="Email" className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center hover:opacity-80 transition">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M22 4H2a2 2 0 00-2 2v12a2 2 0 002 2h20a2 2 0 002-2V6a2 2 0 00-2-2zm0 4l-10 6L2 8V6l10 6 10-6v2z" /></svg>
            </button>
            <button onClick={() => shareToPlatform("copy")} title="Copy Link" className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center hover:opacity-80 transition">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-white" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" /></svg>
            </button>
          </div>
          {copiedLink && <p className="text-xs text-green-400 text-center mt-2">Link copied!</p>}
        </div>
      )}
    </div>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-white text-sm font-medium transition"
            >
              Log out
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="md:col-span-1">
            <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl p-6 text-center">
              <div className="relative w-24 h-24 mx-auto mb-4 group">
                <img
                  src={
                    user.profile_picture ||
                    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23334155'/%3E%3Ccircle cx='50' cy='35' r='18' fill='%2394a3b8'/%3E%3Cellipse cx='50' cy='85' rx='30' ry='25' fill='%2394a3b8'/%3E%3C/svg%3E"
                  }
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-2 border-slate-600"
                />
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition cursor-pointer text-white text-xs">
                  Change
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleProfilePictureChange}
                  />
                </label>
              </div>

              {/* Full Name - editable */}
              <div className="group mb-2">
                {editingField === "full_name" ? (
                  <div className="flex gap-1">
                    <input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full px-2 py-1 bg-slate-900 border border-indigo-500 rounded text-white text-center"
                      autoFocus
                    />
                    <button
                      onClick={() => saveEdit("full_name")}
                      className="text-green-400 text-sm"
                    >
                      ✓
                    </button>
                  </div>
                ) : (
                  <h2
                    onClick={() => startEdit("full_name", user.full_name)}
                    className="text-lg font-semibold text-white cursor-pointer inline-flex items-center gap-1.5 hover:text-indigo-300 transition"
                  >
                    {user.full_name}
                    <svg
                      className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition text-slate-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </h2>
                )}
              </div>

              <p className="text-slate-400 text-sm mb-3">{user.email}</p>

              {/* DOB - editable */}
              <div className="group">
                {editingField === "date_of_birth" ? (
                  <div className="flex gap-1">
                    <input
                      type="date"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full px-2 py-1 bg-slate-900 border border-indigo-500 rounded text-white text-xs"
                      autoFocus
                    />
                    <button
                      onClick={() => saveEdit("date_of_birth")}
                      className="text-green-400 text-sm"
                    >
                      ✓
                    </button>
                  </div>
                ) : (
                  <p
                    onClick={() =>
                      startEdit("date_of_birth", user.date_of_birth)
                    }
                    className="text-xs text-slate-500 cursor-pointer inline-flex items-center gap-1.5 hover:text-indigo-300 transition"
                  >
                    DOB: {user.date_of_birth}
                    <svg
                      className="w-3 h-3 opacity-0 group-hover:opacity-100 transition"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Posts Section */}
          <div className="md:col-span-2 space-y-4">
            {/* New Post Form */}
            <div className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl p-5">
              <form onSubmit={handleCreatePost}>
                <textarea
                  value={newPostText}
                  onChange={(e) => setNewPostText(e.target.value)}
                  placeholder="What's on your mind?"
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition"
                />
                <div className="flex justify-between items-center mt-3">
                  <div className="flex gap-2">
                    <label className="text-sm text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-slate-700 file:text-white hover:file:bg-slate-600 file:cursor-pointer cursor-pointer transition">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setNewPostImage(e.target.files[0])}
                      />
                      {newPostImage ? newPostImage.name : "📷 Add Image"}
                    </label>
                    <label className="text-sm text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-slate-700 file:text-white hover:file:bg-slate-600 file:cursor-pointer cursor-pointer transition">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.txt,.xlsx,.pptx"
                        className="hidden"
                        onChange={(e) => setNewPostDocument(e.target.files[0])}
                      />
                      {newPostDocument
                        ? newPostDocument.name
                        : "📄 Add Document"}
                    </label>
                  </div>
                  <button
                    type="submit"
                    disabled={posting}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 rounded-lg transition shadow-lg shadow-indigo-600/20"
                  >
                    {posting ? "Posting..." : "Post"}
                  </button>
                </div>
              </form>
            </div>

            {/* Posts Feed */}
            {posts.length === 0 && (
              <p className="text-slate-500 text-center py-8">
                No posts yet. Share something!
              </p>
            )}

            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-xl p-5"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-white font-medium text-sm">
                      {post.author_name}
                    </p>
                    <p className="text-slate-500 text-xs">
                      {new Date(post.created_at).toLocaleString()}
                    </p>
                  </div>
                  {post.author === user.id && (
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="text-slate-500 hover:text-red-400 text-xs transition"
                    >
                      Delete
                    </button>
                  )}
                </div>

                {post.description && (
                  <p className="text-slate-200 text-sm mb-3">
                    {post.description}
                  </p>
                )}

                {post.image && (
                  <img
                    src={post.image}
                    alt="Post"
                    className="w-full rounded-lg mb-3 max-h-96 object-cover"
                  />
                )}
                {post.document && (<a                 
                    href={getDocumentViewerUrl(post.document)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 mb-3 px-4 py-2.5 bg-slate-900/50 border border-slate-600 rounded-lg text-indigo-300 hover:text-indigo-200 hover:border-indigo-500 transition text-sm"
                  >
                    📄 View attached document
                  </a>
            )}

                <div className="flex gap-4 pt-2 border-t border-slate-700/50">
  <button
    onClick={() => handleReact(post.id, "like")}
    className={`flex items-center gap-1.5 text-sm font-medium transition ${
      post.my_reaction === "like"
        ? "text-indigo-400"
        : "text-slate-400 hover:text-indigo-300"
    }`}
  >
    👍 Like {post.like_count > 0 && `(${post.like_count})`}
  </button>
  <button
    onClick={() => handleReact(post.id, "dislike")}
    className={`flex items-center gap-1.5 text-sm font-medium transition ${
      post.my_reaction === "dislike"
        ? "text-red-400"
        : "text-slate-400 hover:text-red-300"
    }`}
  >
    👎 Dislike{" "}
    {post.dislike_count > 0 && `(${post.dislike_count})`}
  </button>
  <button
    onClick={() => toggleComments(post.id)}
    className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-indigo-300 transition"
  >
    💬 Comments {comments[post.id]?.length > 0 && `(${comments[post.id].length})`}
  </button>
</div>

{expandedPost === post.id && (
  <div className="mt-3 pt-3 border-t border-slate-700/50 space-y-3">
    {(comments[post.id] || []).map((comment) => (
      <div key={comment.id} className="flex justify-between items-start text-sm">
        <div>
          <span className="text-white font-medium">{comment.author_name}</span>{" "}
          <span className="text-slate-300">{comment.text}</span>
        </div>
        {comment.author === user.id && (
          <button
            onClick={() => handleDeleteComment(post.id, comment.id)}
            className="text-slate-500 hover:text-red-400 text-xs ml-2 shrink-0"
          >
            Delete
          </button>
        )}
      </div>
    ))}
    {(comments[post.id] || []).length === 0 && (
      <p className="text-slate-500 text-xs">No comments yet.</p>
    )}
    <div className="flex gap-2">
      <input
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleAddComment(post.id)}
        placeholder="Write a comment..."
        className="flex-1 px-3 py-1.5 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
      />
      <button
        onClick={() => handleAddComment(post.id)}
        className="text-indigo-400 hover:text-indigo-300 text-sm font-medium px-2"
      >
        Send
      </button>
    </div>
  </div>
)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
