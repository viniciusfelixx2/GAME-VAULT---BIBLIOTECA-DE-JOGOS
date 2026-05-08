const SUPABASE_URL = 'https://ovduoginecidlcfjbxso.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92ZHVvZ2luZWNpZGxjZmpieHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNTMxOTMsImV4cCI6MjA5MzgyOTE5M30.sIG0x0JJQv_zf91LaFLTr5dTUpoClrg4mHlKvg-5h7M';

const state = {
  supabaseUrl: SUPABASE_URL,
  supabaseKey: SUPABASE_ANON_KEY,
  session: JSON.parse(localStorage.getItem('GAMEVAULT_SESSION') || 'null'),
  categories: [],
  games: [],
  searchTerm: ''
};

const $ = (selector) => document.querySelector(selector);

const els = {
  guestView: $('#guestView'),
  appView: $('#appView'),
  logoutBtn: $('#logoutBtn'),
  toast: $('#toast'),
  showLoginBtn: $('#showLoginBtn'),
  showRegisterBtn: $('#showRegisterBtn'),
  loginForm: $('#loginForm'),
  registerForm: $('#registerForm'),
  welcomeText: $('#welcomeText'),
  loginEmail: $('#loginEmail'),
  loginPassword: $('#loginPassword'),
  registerName: $('#registerName'),
  registerEmail: $('#registerEmail'),
  registerPassword: $('#registerPassword'),
  categoryForm: $('#categoryForm'),
  categoryId: $('#categoryId'),
  categoryName: $('#categoryName'),
  categoryDescription: $('#categoryDescription'),
  cancelCategoryEdit: $('#cancelCategoryEdit'),
  categoryList: $('#categoryList'),
  gameForm: $('#gameForm'),
  gameId: $('#gameId'),
  gameName: $('#gameName'),
  gameCategory: $('#gameCategory'),
  gamePlatform: $('#gamePlatform'),
  gamePrice: $('#gamePrice'),
  gameStatus: $('#gameStatus'),
  gameRating: $('#gameRating'),
  gameDescription: $('#gameDescription'),
  cancelGameEdit: $('#cancelGameEdit'),
  gameList: $('#gameList'),
  searchInput: $('#searchInput'),
  categoryCount: $('#categoryCount'),
  gameCount: $('#gameCount'),
  totalValue: $('#totalValue')
};

function getAccessToken() {
  return state.session?.access_token || state.supabaseKey;
}

function getCurrentUser() {
  return state.session?.user || null;
}

function showToast(message, type = 'success') {
  els.toast.textContent = message;
  els.toast.classList.remove('hidden');
  els.toast.style.borderColor = type === 'error' ? 'rgba(248, 113, 113, .55)' : 'rgba(34, 211, 238, .35)';
  setTimeout(() => els.toast.classList.add('hidden'), 3500);
}

function normalizeUrl(url) {
  return url.trim().replace(/\/$/, '');
}

function ensureConfig() {
  if (!state.supabaseUrl || !state.supabaseKey) {
    showToast('Configuração do sistema indisponível.', 'error');
    return false;
  }
  return true;
}

async function supabaseFetch(path, options = {}) {
  if (!ensureConfig()) throw new Error('Supabase não configurado.');

  const headers = {
    apikey: state.supabaseKey,
    Authorization: `Bearer ${getAccessToken()}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
    ...(options.headers || {})
  };

  const response = await fetch(`${state.supabaseUrl}${path}`, {
    ...options,
    headers
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.msg || data?.message || data?.error_description || data?.hint || 'Erro na requisição.';
    throw new Error(message);
  }

  return data;
}

async function authFetch(path, body) {
  if (!ensureConfig()) throw new Error('Supabase não configurado.');

  const response = await fetch(`${state.supabaseUrl}${path}`, {
    method: 'POST',
    headers: {
      apikey: state.supabaseKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.msg || data?.message || data?.error_description || 'Não foi possível autenticar.';
    throw new Error(message);
  }

  return data;
}

function saveSession(session) {
  state.session = session;
  localStorage.setItem('GAMEVAULT_SESSION', JSON.stringify(session));
}

function clearSession() {
  state.session = null;
  localStorage.removeItem('GAMEVAULT_SESSION');
}

function setAuthTab(tab) {
  const isLogin = tab === 'login';
  els.loginForm.classList.toggle('hidden', !isLogin);
  els.registerForm.classList.toggle('hidden', isLogin);
  els.showLoginBtn.classList.toggle('active', isLogin);
  els.showRegisterBtn.classList.toggle('active', !isLogin);
}

function renderViews() {
  const logged = Boolean(state.session?.access_token);
  els.guestView.classList.toggle('hidden', logged);
  els.appView.classList.toggle('hidden', !logged);
  els.logoutBtn.classList.toggle('hidden', !logged);

  if (logged) {
    const user = getCurrentUser();
    const name = user?.user_metadata?.name || user?.email || 'usuário';
    els.welcomeText.textContent = `Olá, ${name}. Seja bem-vindo(a)!`;
  }
}

function money(value) {
  return Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function loadData() {
  if (!state.session?.access_token) return;
  await Promise.all([loadCategories(), loadGames()]);
  renderAll();
}

async function loadCategories() {
  state.categories = await supabaseFetch('/rest/v1/categories?select=*&order=created_at.desc');
}

async function loadGames() {
  state.games = await supabaseFetch('/rest/v1/games?select=*,categories(name)&order=created_at.desc');
}

function renderAll() {
  renderCategories();
  renderCategoryOptions();
  renderGames();
  renderStats();
}

function renderStats() {
  els.categoryCount.textContent = state.categories.length;
  els.gameCount.textContent = state.games.length;
  const total = state.games.reduce((sum, game) => sum + Number(game.price || 0), 0);
  els.totalValue.textContent = money(total);
}

function renderCategoryOptions() {
  if (!state.categories.length) {
    els.gameCategory.innerHTML = '<option value="">Cadastre uma categoria primeiro</option>';
    return;
  }

  els.gameCategory.innerHTML = state.categories
    .map(category => `<option value="${category.id}">${escapeHtml(category.name)}</option>`)
    .join('');
}

function renderCategories() {
  if (!state.categories.length) {
    els.categoryList.innerHTML = `<div class="item-card text-slate-400">Nenhuma categoria cadastrada.</div>`;
    return;
  }

  els.categoryList.innerHTML = state.categories.map(category => `
    <article class="item-card">
      <div class="flex items-start justify-between gap-3">
        <div>
          <h4 class="font-black text-lg">${escapeHtml(category.name)}</h4>
          <p class="text-slate-400 text-sm mt-1">${escapeHtml(category.description || 'Sem descrição')}</p>
        </div>
        <span class="badge">Categoria</span>
      </div>
      <div class="flex gap-2 mt-4">
        <button class="btn-secondary flex-1" onclick="editCategory('${category.id}')">Editar</button>
        <button class="btn-danger flex-1" onclick="deleteCategory('${category.id}')">Excluir</button>
      </div>
    </article>
  `).join('');
}

function renderGames() {
  const term = state.searchTerm.toLowerCase();
  const filtered = state.games.filter(game => {
    const haystack = `${game.name} ${game.platform} ${game.status} ${game.categories?.name || ''}`.toLowerCase();
    return haystack.includes(term);
  });

  if (!filtered.length) {
    els.gameList.innerHTML = `<div class="item-card md:col-span-2 text-slate-400">Nenhum jogo encontrado.</div>`;
    return;
  }

  els.gameList.innerHTML = filtered.map(game => `
    <article class="item-card">
      <div class="flex items-start justify-between gap-3">
        <div>
          <span class="badge">${escapeHtml(game.categories?.name || 'Sem categoria')}</span>
          <h4 class="font-black text-xl mt-3">${escapeHtml(game.name)}</h4>
          <p class="text-slate-400 text-sm mt-1">${escapeHtml(game.description || 'Sem descrição')}</p>
        </div>
        <strong class="text-cyan-200 text-lg">${Number(game.rating || 0).toFixed(1)}</strong>
      </div>

      <div class="grid grid-cols-2 gap-2 mt-4 text-sm">
        <div class="rounded-2xl bg-white/5 p-3">
          <p class="text-slate-400">Plataforma</p>
          <strong>${escapeHtml(game.platform)}</strong>
        </div>
        <div class="rounded-2xl bg-white/5 p-3">
          <p class="text-slate-400">Preço</p>
          <strong>${money(game.price)}</strong>
        </div>
        <div class="rounded-2xl bg-white/5 p-3 col-span-2">
          <p class="text-slate-400">Status</p>
          <strong>${escapeHtml(game.status)}</strong>
        </div>
      </div>

      <div class="flex gap-2 mt-4">
        <button class="btn-secondary flex-1" onclick="editGame('${game.id}')">Editar</button>
        <button class="btn-danger flex-1" onclick="deleteGame('${game.id}')">Excluir</button>
      </div>
    </article>
  `).join('');
}

window.editCategory = function editCategory(id) {
  const category = state.categories.find(item => item.id === id);
  if (!category) return;

  els.categoryId.value = category.id;
  els.categoryName.value = category.name;
  els.categoryDescription.value = category.description || '';
  els.cancelCategoryEdit.classList.remove('hidden');
  els.categoryName.focus();
};

window.deleteCategory = async function deleteCategory(id) {
  const hasGames = state.games.some(game => game.category_id === id);
  if (hasGames) {
    showToast('Não é possível excluir categoria com jogos vinculados. Exclua ou edite os jogos primeiro.', 'error');
    return;
  }

  if (!confirm('Deseja realmente excluir esta categoria?')) return;

  try {
    await supabaseFetch(`/rest/v1/categories?id=eq.${id}`, { method: 'DELETE' });
    showToast('Categoria excluída com sucesso.');
    resetCategoryForm();
    await loadData();
  } catch (error) {
    showToast(error.message, 'error');
  }
};

window.editGame = function editGame(id) {
  const game = state.games.find(item => item.id === id);
  if (!game) return;

  els.gameId.value = game.id;
  els.gameName.value = game.name;
  els.gameCategory.value = game.category_id;
  els.gamePlatform.value = game.platform;
  els.gamePrice.value = game.price;
  els.gameStatus.value = game.status;
  els.gameRating.value = game.rating;
  els.gameDescription.value = game.description || '';
  els.cancelGameEdit.classList.remove('hidden');
  els.gameName.focus();
};

window.deleteGame = async function deleteGame(id) {
  if (!confirm('Deseja realmente excluir este jogo?')) return;

  try {
    await supabaseFetch(`/rest/v1/games?id=eq.${id}`, { method: 'DELETE' });
    showToast('Jogo excluído com sucesso.');
    resetGameForm();
    await loadData();
  } catch (error) {
    showToast(error.message, 'error');
  }
};

function resetCategoryForm() {
  els.categoryForm.reset();
  els.categoryId.value = '';
  els.cancelCategoryEdit.classList.add('hidden');
}

function resetGameForm() {
  els.gameForm.reset();
  els.gameId.value = '';
  els.cancelGameEdit.classList.add('hidden');
}

els.showLoginBtn.addEventListener('click', () => setAuthTab('login'));
els.showRegisterBtn.addEventListener('click', () => setAuthTab('register'));

els.loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  try {
    const data = await authFetch('/auth/v1/token?grant_type=password', {
      email: els.loginEmail.value.trim(),
      password: els.loginPassword.value
    });

    saveSession(data);
    showToast('Login realizado com sucesso.');
    renderViews();
    await loadData();
  } catch (error) {
    showToast(error.message, 'error');
  }
});

els.registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  try {
    const data = await authFetch('/auth/v1/signup', {
      email: els.registerEmail.value.trim(),
      password: els.registerPassword.value,
      data: { name: els.registerName.value.trim() }
    });

    if (data.access_token) {
      saveSession(data);
      renderViews();
      await loadData();
    }

    showToast('Cadastro criado. Se o Supabase pedir confirmação, verifique seu e-mail antes de entrar.');
    setAuthTab('login');
  } catch (error) {
    showToast(error.message, 'error');
  }
});

els.logoutBtn.addEventListener('click', () => {
  clearSession();
  state.categories = [];
  state.games = [];
  renderViews();
  showToast('Você saiu da conta.');
});

els.categoryForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const id = els.categoryId.value;
  const payload = {
    name: els.categoryName.value.trim(),
    description: els.categoryDescription.value.trim() || null,
    user_id: getCurrentUser()?.id
  };

  try {
    if (id) {
      await supabaseFetch(`/rest/v1/categories?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: payload.name, description: payload.description })
      });
      showToast('Categoria atualizada com sucesso.');
    } else {
      await supabaseFetch('/rest/v1/categories', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      showToast('Categoria cadastrada com sucesso.');
    }

    resetCategoryForm();
    await loadData();
  } catch (error) {
    showToast(error.message, 'error');
  }
});

els.cancelCategoryEdit.addEventListener('click', resetCategoryForm);

els.gameForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!state.categories.length) {
    showToast('Cadastre pelo menos uma categoria antes de adicionar jogos.', 'error');
    return;
  }

  const id = els.gameId.value;
  const payload = {
    name: els.gameName.value.trim(),
    category_id: els.gameCategory.value,
    platform: els.gamePlatform.value.trim(),
    price: Number(els.gamePrice.value),
    status: els.gameStatus.value,
    rating: Number(els.gameRating.value),
    description: els.gameDescription.value.trim() || null,
    user_id: getCurrentUser()?.id
  };

  try {
    if (id) {
      const { user_id, ...updatePayload } = payload;
      await supabaseFetch(`/rest/v1/games?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updatePayload)
      });
      showToast('Jogo atualizado com sucesso.');
    } else {
      await supabaseFetch('/rest/v1/games', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      showToast('Jogo cadastrado com sucesso.');
    }

    resetGameForm();
    await loadData();
  } catch (error) {
    showToast(error.message, 'error');
  }
});

els.cancelGameEdit.addEventListener('click', resetGameForm);

els.searchInput.addEventListener('input', (event) => {
  state.searchTerm = event.target.value;
  renderGames();
});

async function boot() {
  renderViews();
  if (state.session?.access_token) {
    try {
      await loadData();
    } catch (error) {
      showToast(`Erro ao carregar dados: ${error.message}`, 'error');
    }
  }
}

boot();
