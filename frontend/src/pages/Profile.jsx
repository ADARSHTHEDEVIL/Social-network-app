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
        <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 overflow-hidden">
          <button onClick={() => shareToPlatform("whatsapp")} className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 transition">WhatsApp</button>
          <button onClick={() => shareToPlatform("facebook")} className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 transition">Facebook</button>
          <button onClick={() => shareToPlatform("twitter")} className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 transition">X (Twitter)</button>
          <button onClick={() => shareToPlatform("linkedin")} className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 transition">LinkedIn</button>
          <button onClick={() => shareToPlatform("telegram")} className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 transition">Telegram</button>
          <button onClick={() => shareToPlatform("email")} className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 transition">Email</button>
          <button onClick={() => shareToPlatform("copy")} className="w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 transition border-t border-slate-700">Copy Link</button>
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
