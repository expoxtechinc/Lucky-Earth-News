const API = '/api';
let token = localStorage.getItem('len_token');
let deleteTargetId = null;

const loginScreen = document.getElementById('loginScreen');
const dashboard = document.getElementById('dashboard');

function showAlert(msg, type = 'success') {
  const box = document.getElementById('alertBox');
  box.className = `alert alert-${type}`;
  box.textContent = msg;
  box.style.display = 'block';
  setTimeout(() => { box.style.display = 'none'; }, 4000);
}

function authHeader() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
}

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

async function init() {
  if (token) {
    try {
      const res = await fetch(`${API}/news?limit=1`, { headers: authHeader() });
      if (res.status === 401) { logout(); return; }
      showDashboard();
    } catch { showLogin(); }
  } else {
    showLogin();
  }
}

function showLogin() {
  loginScreen.style.display = 'flex';
  dashboard.style.display = 'none';
  document.body.style.background = '';
}

function showDashboard() {
  loginScreen.style.display = 'none';
  dashboard.style.display = 'flex';
  document.body.style.background = 'var(--bg)';
  document.body.style.alignItems = '';
  document.body.style.justifyContent = '';
  loadNews();
  loadStats();
  showView('news');
}

function logout() {
  token = null;
  localStorage.removeItem('len_token');
  showLogin();
}

document.getElementById('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = document.getElementById('loginBtn');
  const errBox = document.getElementById('loginError');
  errBox.style.display = 'none';
  btn.disabled = true;
  btn.textContent = 'Signing in…';
  try {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: document.getElementById('loginUsername').value.trim(),
        password: document.getElementById('loginPassword').value,
      }),
    });
    const data = await res.json();
    if (!res.ok) { errBox.textContent = data.message || 'Login failed'; errBox.style.display = 'block'; return; }
    if (data.role !== 'admin') { errBox.textContent = 'Admin access required'; errBox.style.display = 'block'; return; }
    token = data.token;
    localStorage.setItem('len_token', token);
    showDashboard();
  } catch { errBox.textContent = 'Network error. Try again.'; errBox.style.display = 'block'; }
  finally { btn.disabled = false; btn.textContent = 'Sign In'; }
});

document.getElementById('logoutBtn').addEventListener('click', logout);

function showView(view) {
  const newsView = document.getElementById('newsView');
  const formView = document.getElementById('formView');
  document.querySelectorAll('.sidebar-link[data-view]').forEach(l => l.classList.remove('active'));
  const activeLink = document.querySelector(`.sidebar-link[data-view="${view}"]`);
  if (activeLink) activeLink.classList.add('active');

  if (view === 'news') {
    newsView.style.display = 'block';
    formView.style.display = 'none';
    document.getElementById('dashTitle').textContent = 'All News';
    document.getElementById('dashSub').textContent = 'Manage your published stories';
  } else if (view === 'create') {
    resetForm();
    newsView.style.display = 'none';
    formView.style.display = 'block';
    document.getElementById('dashTitle').textContent = 'Create Post';
    document.getElementById('dashSub').textContent = 'Write and publish a new story';
  }
}

document.querySelectorAll('.sidebar-link[data-view]').forEach(link => {
  link.addEventListener('click', e => { e.preventDefault(); showView(link.dataset.view); });
});

document.getElementById('newPostBtn').addEventListener('click', () => showView('create'));
document.getElementById('cancelFormBtn').addEventListener('click', () => showView('news'));

async function loadStats() {
  try {
    const [newsRes, catRes] = await Promise.all([
      fetch(`${API}/news?limit=1`),
      fetch(`${API}/news/categories`),
    ]);
    const newsData = await newsRes.json();
    const cats = await catRes.json();
    document.getElementById('statTotal').textContent = newsData.total ?? '—';
    document.getElementById('statCats').textContent = cats.length ?? '—';
    if (newsData.news && newsData.news.length > 0) {
      document.getElementById('statLatest').textContent = fmtDate(newsData.news[0].createdAt);
    }
  } catch {}
}

async function loadNews() {
  const tbody = document.getElementById('newsTableBody');
  const tLoader = document.getElementById('tableLoader');
  const tEmpty = document.getElementById('tableEmpty');
  tbody.innerHTML = '';
  tLoader.style.display = 'flex';
  tEmpty.style.display = 'none';
  try {
    const res = await fetch(`${API}/news?limit=100`);
    const data = await res.json();
    tLoader.style.display = 'none';
    if (!data.news || data.news.length === 0) { tEmpty.style.display = 'block'; return; }
    data.news.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${item.image
          ? `<img class="table-thumb" src="${item.image}" alt="" onerror="this.parentElement.innerHTML='<div class=table-thumb-placeholder>📰</div>'" />`
          : `<div class="table-thumb-placeholder">📰</div>`}</td>
        <td><div class="table-title" title="${item.title}">${item.title}</div></td>
        <td><span class="badge">${item.category}</span></td>
        <td>${fmtDate(item.createdAt)}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-outline btn-sm edit-btn" data-id="${item._id}">Edit</button>
            <button class="btn btn-danger btn-sm delete-btn" data-id="${item._id}">Delete</button>
          </div>
        </td>`;
      tbody.appendChild(tr);
    });
    document.querySelectorAll('.edit-btn').forEach(btn => btn.addEventListener('click', () => editPost(btn.dataset.id)));
    document.querySelectorAll('.delete-btn').forEach(btn => btn.addEventListener('click', () => promptDelete(btn.dataset.id)));
  } catch { tLoader.style.display = 'none'; }
}

async function editPost(id) {
  try {
    const res = await fetch(`${API}/news/${id}`);
    const item = await res.json();
    document.getElementById('editId').value = item._id;
    document.getElementById('fTitle').value = item.title;
    document.getElementById('fContent').value = item.content;
    document.getElementById('fCategory').value = item.category;
    document.getElementById('fImage').value = item.image || '';
    document.getElementById('fVideo').value = item.video || '';
    document.getElementById('formTitle').textContent = 'Edit Post';
    document.getElementById('formSubmitBtn').textContent = 'Update Post';
    showView('edit-internal');
    document.getElementById('newsView').style.display = 'none';
    document.getElementById('formView').style.display = 'block';
    document.getElementById('dashTitle').textContent = 'Edit Post';
  } catch { showAlert('Failed to load post', 'error'); }
}

function promptDelete(id) {
  deleteTargetId = id;
  document.getElementById('deleteModal').style.display = 'flex';
}

document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
  document.getElementById('deleteModal').style.display = 'none';
  deleteTargetId = null;
});
document.getElementById('deleteBackdrop').addEventListener('click', () => {
  document.getElementById('deleteModal').style.display = 'none';
  deleteTargetId = null;
});

document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
  if (!deleteTargetId) return;
  const btn = document.getElementById('confirmDeleteBtn');
  btn.disabled = true;
  btn.textContent = 'Deleting…';
  try {
    const res = await fetch(`${API}/news/${deleteTargetId}`, { method: 'DELETE', headers: authHeader() });
    if (res.ok) { showAlert('Post deleted successfully'); loadNews(); loadStats(); }
    else { showAlert('Failed to delete post', 'error'); }
  } catch { showAlert('Network error', 'error'); }
  finally {
    btn.disabled = false;
    btn.textContent = 'Yes, Delete';
    document.getElementById('deleteModal').style.display = 'none';
    deleteTargetId = null;
  }
});

function resetForm() {
  document.getElementById('editId').value = '';
  document.getElementById('newsForm').reset();
  document.getElementById('formTitle').textContent = 'Create New Post';
  document.getElementById('formSubmitBtn').textContent = 'Publish Post';
}

document.getElementById('newsForm').addEventListener('submit', async e => {
  e.preventDefault();
  const editId = document.getElementById('editId').value;
  const btn = document.getElementById('formSubmitBtn');
  btn.disabled = true;
  btn.textContent = editId ? 'Updating…' : 'Publishing…';
  const body = {
    title: document.getElementById('fTitle').value.trim(),
    content: document.getElementById('fContent').value.trim(),
    category: document.getElementById('fCategory').value.trim(),
    image: document.getElementById('fImage').value.trim(),
    video: document.getElementById('fVideo').value.trim(),
  };
  try {
    const url = editId ? `${API}/news/${editId}` : `${API}/news`;
    const method = editId ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: authHeader(), body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) { showAlert(data.message || 'Failed to save post', 'error'); return; }
    showAlert(editId ? 'Post updated!' : 'Post published!');
    resetForm();
    showView('news');
    loadNews();
    loadStats();
  } catch { showAlert('Network error', 'error'); }
  finally { btn.disabled = false; btn.textContent = editId ? 'Update Post' : 'Publish Post'; }
});

document.getElementById('seedBtn').addEventListener('click', async () => {
  const btn = document.getElementById('seedBtn');
  btn.disabled = true;
  btn.textContent = 'Seeding…';
  try {
    const res = await fetch(`${API}/seed`, { method: 'POST' });
    const data = await res.json();
    showAlert(data.message || 'Seeded!');
    loadNews();
    loadStats();
  } catch { showAlert('Seed failed', 'error'); }
  finally { btn.disabled = false; btn.textContent = 'Seed DB'; }
});

init();
