import { useState, useEffect } from "react";
import { apiFetch, getAuthHeaders, NewsItem, NewsResponse } from "@/lib/api";

type View = "news" | "create" | "edit" | "users";

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

interface LoginProps { onLogin: (token: string, username: string) => void; }

function LoginScreen({ onLogin }: LoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const data = await apiFetch<{ token: string; role: string; username: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      if (data.role !== "admin") { setError("Admin access required."); return; }
      localStorage.setItem("len_token", data.token);
      localStorage.setItem("len_username", data.username);
      onLogin(data.token, data.username);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a6b3c] to-[#0e4a2a] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl">
        <div className="flex items-center gap-2 justify-center mb-6">
          <span className="text-3xl">🌍</span>
          <span className="text-xl font-bold text-gray-900">
            LEN <strong className="text-[#1a6b3c]">Admin</strong>
          </span>
        </div>
        <h2 className="text-2xl font-extrabold text-center mb-1">Admin Login</h2>
        <p className="text-center text-gray-500 text-sm mb-6">Sign in to manage your platform</p>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-2.5 text-sm mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold mb-1.5">Username</label>
            <input
              type="text" required value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="admin"
              autoComplete="username"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-base focus:outline-none focus:border-[#1a6b3c] focus:ring-2 focus:ring-[#1a6b3c]/10"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">Password</label>
            <input
              type="password" required value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-base focus:outline-none focus:border-[#1a6b3c] focus:ring-2 focus:ring-[#1a6b3c]/10"
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full py-3 bg-[#1a6b3c] hover:bg-[#135230] text-white font-semibold rounded-lg transition-colors disabled:opacity-50 mt-1"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
        <p className="text-center text-xs text-gray-400 mt-5">
          Default: <code className="bg-gray-100 px-1 rounded">admin</code> /{" "}
          <code className="bg-gray-100 px-1 rounded">admin123</code> (after seeding)
        </p>
      </div>
    </div>
  );
}

interface UserItem { _id: string; username: string; role: string; createdAt: string; }

interface DashboardProps { token: string; currentUsername: string; onLogout: () => void; }

interface FormState {
  title: string; content: string; category: string; image: string; video: string;
}
const emptyForm: FormState = { title: "", content: "", category: "", image: "", video: "" };

function Dashboard({ token, currentUsername, onLogout }: DashboardProps) {
  const [view, setView] = useState<View>("news");
  const [news, setNews] = useState<NewsItem[]>([]);
  const [total, setTotal] = useState(0);
  const [catCount, setCatCount] = useState(0);
  const [tableLoading, setTableLoading] = useState(true);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [alert, setAlert] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [seedLoading, setSeedLoading] = useState(false);

  // Users state
  const [users, setUsers] = useState<UserItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [signupForm, setSignupForm] = useState({ username: "", password: "", role: "admin" });
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState("");

  const authHeaders = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const showAlert = (msg: string, type: "success" | "error" = "success") => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 4000);
  };

  const loadNews = async () => {
    setTableLoading(true);
    try {
      const [data, cats] = await Promise.all([
        apiFetch<NewsResponse>("/news?limit=100"),
        apiFetch<string[]>("/news/categories"),
      ]);
      setNews(data.news);
      setTotal(data.total);
      setCatCount(cats.length);
    } catch {}
    finally { setTableLoading(false); }
  };

  const loadUsers = async () => {
    setUsersLoading(true);
    try {
      const data = await apiFetch<UserItem[]>("/auth/users", { headers: authHeaders });
      setUsers(data);
    } catch { showAlert("Failed to load users", "error"); }
    finally { setUsersLoading(false); }
  };

  useEffect(() => { loadNews(); }, []);
  useEffect(() => { if (view === "users") loadUsers(); }, [view]);

  const goCreate = () => { setForm(emptyForm); setEditId(null); setView("create"); };
  const goEdit = async (id: string) => {
    try {
      const item = await apiFetch<NewsItem>(`/news/${id}`);
      setForm({ title: item.title, content: item.content, category: item.category, image: item.image, video: item.video });
      setEditId(id);
      setView("edit");
    } catch { showAlert("Failed to load post", "error"); }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setFormLoading(true);
    try {
      const url = editId ? `/news/${editId}` : "/news";
      const method = editId ? "PUT" : "POST";
      await apiFetch(url, { method, headers: authHeaders, body: JSON.stringify(form) });
      showAlert(editId ? "Post updated!" : "Post published!");
      setView("news"); setForm(emptyForm); setEditId(null); loadNews();
    } catch (err: unknown) {
      showAlert(err instanceof Error ? err.message : "Failed", "error");
    } finally { setFormLoading(false); }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await apiFetch(`/news/${deleteId}`, { method: "DELETE", headers: authHeaders });
      showAlert("Post deleted");
      loadNews();
    } catch { showAlert("Delete failed", "error"); }
    setDeleteId(null);
  };

  const handleSeed = async () => {
    setSeedLoading(true);
    try {
      const data = await apiFetch<{ message: string }>("/seed", { method: "POST" });
      showAlert(data.message); loadNews();
    } catch { showAlert("Seed failed", "error"); }
    finally { setSeedLoading(false); }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(""); setSignupLoading(true);
    try {
      const data = await apiFetch<{ message: string; username: string }>("/auth/register", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(signupForm),
      });
      showAlert(`${data.message}: ${data.username}`);
      setSignupForm({ username: "", password: "", role: "admin" });
      loadUsers();
    } catch (err: unknown) {
      setSignupError(err instanceof Error ? err.message : "Signup failed");
    } finally { setSignupLoading(false); }
  };

  const confirmDeleteUser = async () => {
    if (!deleteUserId) return;
    try {
      await apiFetch(`/auth/users/${deleteUserId}`, { method: "DELETE", headers: authHeaders });
      showAlert("User deleted");
      loadUsers();
    } catch (err: unknown) {
      showAlert(err instanceof Error ? err.message : "Delete failed", "error");
    }
    setDeleteUserId(null);
  };

  const latest = news[0]?.createdAt ? fmtDate(news[0].createdAt) : "—";

  const navItems = [
    { id: "news" as View, icon: "📰", label: "All News" },
    { id: "create" as View, icon: "✏️", label: "Create Post" },
    { id: "users" as View, icon: "👤", label: "Users" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-56 min-w-[224px] bg-gray-900 text-white flex flex-col p-4 gap-1">
        <div className="flex items-center gap-2 px-2 py-3 mb-4">
          <span className="text-2xl">🌍</span>
          <span className="font-bold text-sm">LEN <span className="text-amber-400">Admin</span></span>
        </div>
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => item.id === "create" ? goCreate() : setView(item.id)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-left transition-colors cursor-pointer ${
              view === item.id ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            {item.icon} {item.label}
          </button>
        ))}
        <a href="/" target="_blank" className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors mt-1 no-underline">
          🌐 View Site
        </a>
        <div className="mt-auto">
          <div className="px-3 py-2 text-xs text-white/40 truncate">Logged in as <span className="text-white/60 font-semibold">{currentUsername}</span></div>
          <button
            onClick={onLogout}
            className="w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-300 hover:bg-red-500/20 transition-colors text-left cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 min-w-0">
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">
              {view === "news" ? "All News" : view === "create" ? "Create Post" : view === "edit" ? "Edit Post" : "User Management"}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {view === "news" ? "Manage your published stories" :
               view === "users" ? "Create and manage admin accounts" :
               "Write and publish your story"}
            </p>
          </div>
          {view === "news" && (
            <div className="flex gap-2">
              <button onClick={goCreate} className="px-4 py-2 bg-[#1a6b3c] text-white rounded-lg text-sm font-semibold hover:bg-[#135230] transition-colors cursor-pointer">
                + New Post
              </button>
              <button onClick={handleSeed} disabled={seedLoading} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:border-[#1a6b3c] hover:text-[#1a6b3c] transition-colors cursor-pointer disabled:opacity-50">
                {seedLoading ? "Seeding…" : "Seed DB"}
              </button>
            </div>
          )}
        </div>

        {alert && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-sm border ${
            alert.type === "success"
              ? "bg-[#e8f5ee] text-[#135230] border-[#6ee7b7]"
              : "bg-red-50 text-red-700 border-red-200"
          }`}>{alert.msg}</div>
        )}

        {/* Stats */}
        {view === "news" && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: "Total Posts", value: total },
              { label: "Categories", value: catCount },
              { label: "Latest", value: latest },
            ].map(s => (
              <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="text-2xl font-extrabold text-[#1a6b3c]">{s.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* News table */}
        {view === "news" && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {tableLoading ? (
              <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-gray-200 border-t-[#1a6b3c] rounded-full animate-spin" /></div>
            ) : news.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <div className="text-4xl mb-3">📋</div>
                <p className="mb-3">No posts yet. Click "Seed DB" to add sample articles, or create your first post.</p>
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    {["Image", "Title", "Category", "Date", "Actions"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {news.map(item => (
                    <tr key={item._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        {item.image
                          ? <img src={item.image} alt="" className="w-14 h-10 object-cover rounded-md" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
                          : <div className="w-14 h-10 bg-[#e8f5ee] rounded-md flex items-center justify-center text-lg">📰</div>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-sm text-gray-900 max-w-xs truncate">{item.title}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-[#e8f5ee] text-[#1a6b3c] rounded-full text-xs font-semibold">{item.category}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-400">{fmtDate(item.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => goEdit(item._id)} className="px-3 py-1 text-xs font-semibold border border-gray-200 rounded-lg hover:border-[#1a6b3c] hover:text-[#1a6b3c] transition-colors cursor-pointer">Edit</button>
                          <button onClick={() => setDeleteId(item._id)} className="px-3 py-1 text-xs font-semibold bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 transition-colors cursor-pointer">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Create/Edit form */}
        {(view === "create" || view === "edit") && (
          <div className="bg-white rounded-xl shadow-sm p-6 max-w-3xl">
            <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Title <span className="text-red-500">*</span></label>
                  <input type="text" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Enter news title"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a6b3c] focus:ring-2 focus:ring-[#1a6b3c]/10" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Category <span className="text-red-500">*</span></label>
                  <input type="text" required value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    placeholder="World, Tech, Sports…" list="catOptions"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a6b3c] focus:ring-2 focus:ring-[#1a6b3c]/10" />
                  <datalist id="catOptions">
                    {["World","Technology","Sports","Business","Health","Entertainment","Politics"].map(c => <option key={c} value={c} />)}
                  </datalist>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Content <span className="text-red-500">*</span></label>
                <textarea required rows={8} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  placeholder="Write the full news story here…"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg resize-y focus:outline-none focus:border-[#1a6b3c] focus:ring-2 focus:ring-[#1a6b3c]/10 leading-relaxed" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Image URL</label>
                  <input type="url" value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a6b3c] focus:ring-2 focus:ring-[#1a6b3c]/10" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1.5">Video URL (optional)</label>
                  <input type="url" value={form.video} onChange={e => setForm(f => ({ ...f, video: e.target.value }))}
                    placeholder="https://youtube.com/watch?v=…"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a6b3c] focus:ring-2 focus:ring-[#1a6b3c]/10" />
                </div>
              </div>
              <div className="flex gap-3 mt-2">
                <button type="submit" disabled={formLoading}
                  className="px-6 py-2.5 bg-[#1a6b3c] hover:bg-[#135230] text-white font-semibold rounded-lg transition-colors disabled:opacity-50 cursor-pointer">
                  {formLoading ? "Saving…" : editId ? "Update Post" : "Publish Post"}
                </button>
                <button type="button" onClick={() => setView("news")}
                  className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-lg hover:border-[#1a6b3c] hover:text-[#1a6b3c] transition-colors cursor-pointer">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* User Management */}
        {view === "users" && (
          <div className="space-y-6 max-w-3xl">
            {/* Create User Form */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold mb-1">Create New Admin Account</h2>
              <p className="text-sm text-gray-500 mb-4">Add new administrators who can manage the news platform.</p>
              {signupError && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-2.5 text-sm mb-4">{signupError}</div>
              )}
              <form onSubmit={handleSignup} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Username <span className="text-red-500">*</span></label>
                    <input
                      type="text" required
                      value={signupForm.username}
                      onChange={e => setSignupForm(f => ({ ...f, username: e.target.value }))}
                      placeholder="newadmin"
                      autoComplete="off"
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a6b3c] focus:ring-2 focus:ring-[#1a6b3c]/10"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Password <span className="text-red-500">*</span></label>
                    <input
                      type="password" required minLength={6}
                      value={signupForm.password}
                      onChange={e => setSignupForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="Min 6 characters"
                      autoComplete="new-password"
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a6b3c] focus:ring-2 focus:ring-[#1a6b3c]/10"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-1.5">Role</label>
                    <select
                      value={signupForm.role}
                      onChange={e => setSignupForm(f => ({ ...f, role: e.target.value }))}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#1a6b3c] focus:ring-2 focus:ring-[#1a6b3c]/10 bg-white"
                    >
                      <option value="admin">Admin</option>
                      <option value="editor">Editor</option>
                    </select>
                  </div>
                </div>
                <div>
                  <button type="submit" disabled={signupLoading}
                    className="px-6 py-2.5 bg-[#1a6b3c] hover:bg-[#135230] text-white font-semibold rounded-lg transition-colors disabled:opacity-50 cursor-pointer">
                    {signupLoading ? "Creating…" : "Create Account"}
                  </button>
                </div>
              </form>
            </div>

            {/* Users List */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-bold">All Admin Users</h2>
                <button onClick={loadUsers} className="text-sm text-[#1a6b3c] hover:underline cursor-pointer">Refresh</button>
              </div>
              {usersLoading ? (
                <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-gray-200 border-t-[#1a6b3c] rounded-full animate-spin" /></div>
              ) : users.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No users found.</div>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      {["Username", "Role", "Created", "Actions"].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-[#1a6b3c] flex items-center justify-center text-white text-xs font-bold">
                              {u.username[0].toUpperCase()}
                            </div>
                            <span className="font-semibold text-sm text-gray-900">{u.username}</span>
                            {u.username === currentUsername && (
                              <span className="text-xs text-[#1a6b3c] bg-[#e8f5ee] px-1.5 py-0.5 rounded-full">You</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            u.role === "admin" ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"
                          }`}>{u.role}</span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-400">{fmtDate(u.createdAt)}</td>
                        <td className="px-4 py-3">
                          {u.username !== currentUsername ? (
                            <button
                              onClick={() => setDeleteUserId(u._id)}
                              className="px-3 py-1 text-xs font-semibold bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                            >
                              Delete
                            </button>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete Post modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold mb-2">Delete Post?</h3>
            <p className="text-gray-500 text-sm mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={confirmDelete} className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm cursor-pointer">Yes, Delete</button>
              <button onClick={() => setDeleteId(null)} className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-lg text-sm hover:border-gray-400 cursor-pointer">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User modal */}
      {deleteUserId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleteUserId(null)} />
          <div className="relative bg-white rounded-xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold mb-2">Delete User?</h3>
            <p className="text-gray-500 text-sm mb-5">This user will lose access to the admin dashboard.</p>
            <div className="flex gap-3">
              <button onClick={confirmDeleteUser} className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg text-sm cursor-pointer">Yes, Delete</button>
              <button onClick={() => setDeleteUserId(null)} className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-lg text-sm hover:border-gray-400 cursor-pointer">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Admin() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("len_token"));
  const [currentUsername, setCurrentUsername] = useState<string>(() => localStorage.getItem("len_username") ?? "admin");

  const handleLogin = (t: string, username: string) => {
    setToken(t);
    setCurrentUsername(username);
  };

  const handleLogout = () => {
    localStorage.removeItem("len_token");
    localStorage.removeItem("len_username");
    setToken(null);
  };

  if (!token) return <LoginScreen onLogin={handleLogin} />;
  return <Dashboard token={token} currentUsername={currentUsername} onLogout={handleLogout} />;
}
