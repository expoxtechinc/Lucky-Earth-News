const API = '/api';
let currentPage = 1;
let currentCat = 'all';
let currentSearch = '';
let totalPages = 1;
let isLoading = false;

const newsGrid = document.getElementById('newsGrid');
const loader = document.getElementById('loader');
const emptyState = document.getElementById('emptyState');
const loadMoreWrap = document.getElementById('loadMore');
const loadMoreBtn = document.getElementById('loadMoreBtn');
const categoryFilters = document.getElementById('categoryFilters');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const modal = document.getElementById('modal');
const modalBackdrop = document.getElementById('modalBackdrop');
const modalClose = document.getElementById('modalClose');

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function truncate(str, n) {
  return str.length > n ? str.slice(0, n) + '…' : str;
}

async function fetchCategories() {
  try {
    const res = await fetch(`${API}/news/categories`);
    const cats = await res.json();
    cats.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'filter-btn';
      btn.dataset.cat = cat;
      btn.textContent = cat;
      categoryFilters.appendChild(btn);
    });
  } catch {}
}

async function fetchNews(reset = false) {
  if (isLoading) return;
  isLoading = true;
  if (reset) {
    currentPage = 1;
    newsGrid.innerHTML = '';
  }
  loader.style.display = 'flex';
  emptyState.style.display = 'none';
  loadMoreWrap.style.display = 'none';

  try {
    const params = new URLSearchParams({ page: currentPage, limit: 12 });
    if (currentCat !== 'all') params.set('category', currentCat);
    if (currentSearch) params.set('search', currentSearch);
    const res = await fetch(`${API}/news?${params}`);
    const data = await res.json();
    totalPages = data.pages;
    renderCards(data.news);
    if (data.news.length === 0 && currentPage === 1) {
      emptyState.style.display = 'block';
    }
    if (currentPage < totalPages) {
      loadMoreWrap.style.display = 'block';
    }
  } catch (e) {
    if (currentPage === 1) {
      emptyState.style.display = 'block';
      emptyState.querySelector('p').textContent = 'Failed to load news. Check your connection.';
    }
  } finally {
    loader.style.display = 'none';
    isLoading = false;
  }
}

function renderCards(items) {
  items.forEach(item => {
    const card = document.createElement('article');
    card.className = 'news-card';
    card.innerHTML = `
      <div class="card-img-wrap">
        ${item.image
          ? `<img src="${item.image}" alt="${item.title}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=card-img-placeholder>📰</div>'" />`
          : `<div class="card-img-placeholder">📰</div>`}
      </div>
      <div class="card-body">
        <div class="card-meta">
          <span class="badge">${item.category}</span>
          <span class="card-date">${fmtDate(item.createdAt)}</span>
        </div>
        <h2 class="card-title">${item.title}</h2>
        <p class="card-preview">${truncate(item.content, 140)}</p>
      </div>
      <div class="card-footer">
        <span class="read-more">Read more →</span>
        ${item.video ? '<span class="video-badge">▶ Video</span>' : ''}
      </div>`;
    card.addEventListener('click', () => openModal(item));
    newsGrid.appendChild(card);
  });
}

function openModal(item) {
  document.getElementById('modalImg').src = item.image || '';
  document.getElementById('modalImg').style.display = item.image ? 'block' : 'none';
  document.getElementById('modalCat').textContent = item.category;
  document.getElementById('modalTitle').textContent = item.title;
  document.getElementById('modalDate').textContent = fmtDate(item.createdAt);
  document.getElementById('modalContent').textContent = item.content;
  const vidLink = document.getElementById('modalVideo');
  if (item.video) { vidLink.href = item.video; vidLink.style.display = 'inline-block'; }
  else { vidLink.style.display = 'none'; }
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modal.style.display = 'none';
  document.body.style.overflow = '';
}

modalClose.addEventListener('click', closeModal);
modalBackdrop.addEventListener('click', closeModal);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

categoryFilters.addEventListener('click', e => {
  if (!e.target.classList.contains('filter-btn')) return;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  e.target.classList.add('active');
  currentCat = e.target.dataset.cat;
  currentSearch = '';
  searchInput.value = '';
  fetchNews(true);
});

searchBtn.addEventListener('click', () => {
  currentSearch = searchInput.value.trim();
  currentCat = 'all';
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.filter-btn[data-cat="all"]').classList.add('active');
  fetchNews(true);
});
searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') searchBtn.click(); });

loadMoreBtn.addEventListener('click', () => {
  currentPage++;
  fetchNews(false);
});

(async () => {
  await fetchCategories();
  await fetchNews(true);
})();
