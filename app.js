/* Configuration */
const API_BASE_URL = 'https://watch-api-eight.vercel.app';
const API_KEY = 'broke-oclock-003';
const USER_STORAGE_KEY = 'watch_user';

/* DOM Elements - Navigation and Auth */
const navUserBadge = document.getElementById('nav-user-badge');
const navAuthBtn = document.getElementById('nav-auth-btn');
const authModal = document.getElementById('auth-modal');
const authCloseBtn = document.getElementById('auth-close-btn');
const authForm = document.getElementById('auth-form');
const authModalTitle = document.getElementById('auth-modal-title');
const authModalSubtitle = document.getElementById('auth-modal-subtitle');
const authSubmitBtn = document.getElementById('auth-submit-btn');
const authSwitchPrompt = document.getElementById('auth-switch-prompt');
const authSwitchBtn = document.getElementById('auth-switch-btn');
const authMessage = document.getElementById('auth-message');

/* DOM Elements - Search and Favorites */
const searchInput = document.getElementById('watch-search');
const searchBtn = document.getElementById('search-btn');
const searchDropdown = document.getElementById('search-dropdown');
const favoritesWrap = document.getElementById('favorites-wrap');
const favoritesBtn = document.getElementById('favorites-btn');
const favoritesCount = document.getElementById('favorites-count');
const favoritesDropdown = document.getElementById('favorites-dropdown');
const favoriteToggleBtn = document.getElementById('favorite-toggle-btn');

/* DOM Elements - Watch Card */
const watchBrand = document.getElementById('watch-brand');
const specYear = document.getElementById('spec-year');
const watchImg = document.getElementById('watch-img');
const imagePlaceholder = document.getElementById('image-placeholder');
const watchModel = document.getElementById('watch-model');
const watchNickname = document.getElementById('watch-nickname');
const watchPrice = document.getElementById('watch-price');

/* DOM Elements - 6 Spec Tiles */
const specCase = document.getElementById('spec-case');
const specMovement = document.getElementById('spec-movement');
const specCategory = document.getElementById('spec-category');
const specOrigin = document.getElementById('spec-origin');
const specRef = document.getElementById('spec-ref');
const specReserve = document.getElementById('spec-reserve');

/* DOM Elements - Calculator */
const salaryInput = document.getElementById('monthly-salary');
const savingsSlider = document.getElementById('savings-rate');
const savingsDisplay = document.getElementById('savings-display');
const verdictBadge = document.getElementById('verdict-badge');
const outYears = document.getElementById('out-years');
const outCutoffs = document.getElementById('out-cutoffs');
const outHours = document.getElementById('out-hours');
const equivalentsList = document.getElementById('equivalents-items');
const humorQuote = document.getElementById('humor-quote');

/* State */
let selectedWatch = null;
let currentUser = null;
let userFavorites = [];
let isRegisterMode = false;

/* Request headers helper */
function getApiHeaders() {
  return {
    'x-api-key': API_KEY,
    'Content-Type': 'application/json'
  };
}

/* Currency helper */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0
  }).format(amount);
}

/* Read logged-in user from localStorage */
function loadSavedUser() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.id && parsed.role !== 'guest') {
      return parsed;
    }
    return null;
  } catch (error) {
    return null;
  }
}

/* Update navbar and favorites UI for current user */
async function syncUserSession() {
  currentUser = loadSavedUser();

  if (currentUser) {
    navUserBadge.textContent = `@${currentUser.username}`;
    navUserBadge.classList.remove('hidden');
    navAuthBtn.textContent = 'Sign Out';
    favoritesWrap.classList.remove('hidden');
    await fetchUserFavorites();
  } else {
    userFavorites = [];
    navUserBadge.textContent = '';
    navUserBadge.classList.add('hidden');
    navAuthBtn.textContent = 'Sign In';
    favoritesWrap.classList.add('hidden');
    favoritesDropdown.classList.add('hidden');
  }

  updateFavoriteToggleState();
}

/* Open and close auth modal */
function openAuthModal() {
  isRegisterMode = false;
  authForm.reset();
  authMessage.textContent = '';
  authMessage.className = 'auth-message';
  authModalTitle.textContent = 'Sign In';
  authModalSubtitle.textContent = 'Sign in to sync your favorite watches.';
  authSubmitBtn.textContent = 'SIGN IN';
  authSwitchPrompt.textContent = "Don't have an account?";
  authSwitchBtn.textContent = 'Create Account';
  authModal.classList.remove('hidden');
}

function closeAuthModal() {
  authModal.classList.add('hidden');
}

/* Fetch user favorites */
async function fetchUserFavorites() {
  if (!currentUser || !currentUser.id) return;

  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/users/${currentUser.id}/favorites`, {
      method: 'GET',
      headers: getApiHeaders()
    });

    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    const data = await response.json();
    userFavorites = data.favorites || [];
    favoritesCount.textContent = userFavorites.length;
    renderFavoritesDropdown();
    updateFavoriteToggleState();
  } catch (error) {
    console.error('Failed to fetch favorites:', error);
  }
}

/* Render user favorites dropdown */
function renderFavoritesDropdown() {
  favoritesDropdown.innerHTML = '';

  if (userFavorites.length === 0) {
    const emptyRow = document.createElement('div');
    emptyRow.className = 'search-item';
    emptyRow.textContent = 'No favorite watches yet';
    favoritesDropdown.appendChild(emptyRow);
    return;
  }

  userFavorites.forEach((watch) => {
    const row = document.createElement('div');
    row.className = 'search-item';
    row.innerHTML = `
      <span>${watch.model}</span>
      <span class="search-item-brand">${formatCurrency(watch.price_php || 0)}</span>
    `;

    row.addEventListener('click', () => {
      displayWatch(watch);
      favoritesDropdown.classList.add('hidden');
    });

    favoritesDropdown.appendChild(row);
  });
}

/* Update Favorite button on watch card */
function updateFavoriteToggleState() {
  if (!selectedWatch || !selectedWatch.id) {
    favoriteToggleBtn.textContent = '+ Favorite';
    favoriteToggleBtn.classList.remove('is-saved');
    return;
  }

  const isSaved = userFavorites.some((item) => item.id === selectedWatch.id);
  if (isSaved) {
    favoriteToggleBtn.textContent = 'Favorited ★';
    favoriteToggleBtn.classList.add('is-saved');
  } else {
    favoriteToggleBtn.textContent = '+ Favorite';
    favoriteToggleBtn.classList.remove('is-saved');
  }
}

/* Add or remove selected watch from favorites */
async function toggleSelectedWatchFavorite() {
  if (!selectedWatch || !selectedWatch.id) return;

  if (!currentUser || !currentUser.id) {
    openAuthModal();
    return;
  }

  const isSaved = userFavorites.some((item) => item.id === selectedWatch.id);
  favoriteToggleBtn.disabled = true;

  try {
    if (isSaved) {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/favorites/${currentUser.id}/${selectedWatch.id}`,
        {
          method: 'DELETE',
          headers: getApiHeaders()
        }
      );
      if (!response.ok) throw new Error('Failed to remove favorite.');
    } else {
      const response = await fetch(`${API_BASE_URL}/api/v1/favorites`, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          user_id: currentUser.id,
          watch_id: selectedWatch.id
        })
      });
      if (!response.ok) throw new Error('Failed to add favorite.');
    }

    await fetchUserFavorites();
  } catch (error) {
    console.error('Favorite toggle error:', error);
  } finally {
    favoriteToggleBtn.disabled = false;
  }
}

/* Fetch all watches */
async function fetchAllWatches() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/watches`, {
      method: 'GET',
      headers: getApiHeaders()
    });

    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    const data = await response.json();
    return data.watches || [];
  } catch (error) {
    console.error('Failed to fetch watches list:', error);
    return [];
  }
}

/* Search watches */
async function searchWatches(query) {
  try {
    const url = `${API_BASE_URL}/api/v1/watches/search?q=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getApiHeaders()
    });

    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('API connection error:', error);
    return [];
  }
}

/* Populate the Watch Card */
function displayWatch(watch) {
  selectedWatch = watch;

  watchBrand.textContent = watch.brand ? watch.brand.toUpperCase() : 'WATCH BRAND';
  specYear.textContent = watch.year || watch.release_year || '----';
  watchModel.textContent = watch.model || 'Select a watch';
  watchNickname.textContent = watch.nickname ? `"${watch.nickname}"` : '';

  const priceVal = watch.price_php || watch.price || 0;
  watchPrice.textContent = formatCurrency(priceVal);

  const caseDiameter = watch.case_size_mm || watch.case_diameter_mm || watch.case_diameter || watch.case_size;
  specCase.textContent = caseDiameter ? `${caseDiameter} mm` : '-- mm';

  specMovement.textContent = watch.movement || watch.calibre || watch.caliber || '--';
  specCategory.textContent = watch.category || '--';
  specOrigin.textContent = watch.origin || '--';

  /* Additional balanced attributes */
  specRef.textContent = watch.reference_number || watch.reference || watch.ref || 'Ref. Standard';
  
  const powerReserve = watch.power_reserve_hours || watch.power_reserve || watch.complication;
  specReserve.textContent = powerReserve 
    ? (typeof powerReserve === 'number' ? `${powerReserve} Hours` : powerReserve)
    : '70 Hours';

  /* Local image path resolver */
  const rawImagePath = watch.image || watch.image_url || watch.img || '';

  if (rawImagePath && typeof rawImagePath === 'string' && rawImagePath.trim() !== '') {
    const fileName = rawImagePath.split('/').pop().trim();
    const localSrc = `images/${fileName}`;

    watchImg.onload = () => {
      watchImg.classList.remove('hidden');
      watchImg.style.display = 'block';
      imagePlaceholder.classList.add('hidden');
      imagePlaceholder.style.display = 'none';
    };

    watchImg.onerror = () => {
      watchImg.classList.add('hidden');
      watchImg.style.display = 'none';
      imagePlaceholder.classList.remove('hidden');
      imagePlaceholder.style.display = 'block';
    };

    watchImg.src = localSrc;
  } else {
    watchImg.classList.add('hidden');
    watchImg.style.display = 'none';
    imagePlaceholder.classList.remove('hidden');
    imagePlaceholder.style.display = 'block';
  }

  updateFavoriteToggleState();
  calculateReality();
}

/* Calculation engine */
function calculateReality() {
  const salary = parseFloat(salaryInput.value);
  const savingsPct = parseInt(savingsSlider.value, 10);
  savingsDisplay.textContent = `${savingsPct}%`;

  if (!selectedWatch || !salary || salary <= 0) {
    outYears.textContent = '--';
    outCutoffs.textContent = '--';
    outHours.textContent = '--';
    verdictBadge.textContent = 'Awaiting Input';
    equivalentsList.innerHTML = '<li>Enter your salary above to view trade-offs.</li>';
    return;
  }

  const price = parseFloat(selectedWatch.price_php || selectedWatch.price || 0);
  const monthlyAllocation = salary * (savingsPct / 100);

  const monthsNeeded = price / monthlyAllocation;
  const yearsNeeded = (monthsNeeded / 12).toFixed(1);
  const cutoffsNeeded = Math.ceil(monthsNeeded * 2);
  const hourlyRate = salary / 176;
  const hoursNeeded = Math.ceil(price / hourlyRate);

  outYears.textContent = yearsNeeded;
  outCutoffs.textContent = cutoffsNeeded.toLocaleString();
  outHours.textContent = hoursNeeded.toLocaleString();

  if (monthsNeeded <= 6) {
    verdictBadge.textContent = 'Financially Sane';
  } else if (monthsNeeded <= 24) {
    verdictBadge.textContent = 'Major Commitment';
  } else if (monthsNeeded <= 60) {
    verdictBadge.textContent = 'Midlife Crisis Level';
  } else {
    verdictBadge.textContent = 'Generational Debt';
  }

  const jollibeeMeals = Math.floor(price / 180);
  const icedCoffees = Math.floor(price / 190);
  const iPhones = (price / 85000).toFixed(1);
  const studioRents = Math.floor(price / 15000);

  equivalentsList.innerHTML = `
    <li><strong>${jollibeeMeals.toLocaleString()}</strong> 2-pc Chickenjoy with rice meals</li>
    <li><strong>${icedCoffees.toLocaleString()}</strong> Spanish Lattes from local cafés</li>
    <li><strong>${iPhones}</strong> flagship iPhones at retail price</li>
    <li><strong>${studioRents}</strong> months of Metro studio rent</li>
  `;

  if (monthsNeeded <= 12) {
    humorQuote.textContent = '"A year of discipline. Entirely doable if you cut unli-samgyup."';
  } else if (monthsNeeded <= 60) {
    humorQuote.textContent = '"Your wrist will look brilliant while your savings account weeps softly."';
  } else if (monthsNeeded <= 120) {
    humorQuote.textContent = '"A decade of labor. By then, the service cost alone will need a loan."';
  } else {
    humorQuote.textContent = '"Leave this page open as your desktop wallpaper for character development."';
  }
}

/* Render search dropdown items */
function showDropdown(items) {
  searchDropdown.innerHTML = '';

  if (!items || items.length === 0) {
    const emptyRow = document.createElement('div');
    emptyRow.className = 'search-item';
    emptyRow.textContent = 'No watches found';
    searchDropdown.appendChild(emptyRow);
    searchDropdown.classList.remove('hidden');
    return;
  }

  items.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'search-item';
    row.innerHTML = `
      <span>${item.model}</span>
      <span class="search-item-brand">${item.brand}</span>
    `;

    row.addEventListener('click', () => {
      displayWatch(item);
      searchDropdown.classList.add('hidden');
      searchInput.value = '';
    });

    searchDropdown.appendChild(row);
  });

  searchDropdown.classList.remove('hidden');
}

/* Auth Event Listeners */
navAuthBtn.addEventListener('click', () => {
  if (currentUser) {
    localStorage.removeItem(USER_STORAGE_KEY);
    syncUserSession();
  } else {
    openAuthModal();
  }
});

authCloseBtn.addEventListener('click', closeAuthModal);

authModal.addEventListener('click', (e) => {
  if (e.target === authModal) {
    closeAuthModal();
  }
});

authSwitchBtn.addEventListener('click', () => {
  isRegisterMode = !isRegisterMode;
  authMessage.textContent = '';
  authMessage.className = 'auth-message';

  if (isRegisterMode) {
    authModalTitle.textContent = 'Create Account';
    authModalSubtitle.textContent = 'Create an account to save your favorite watches.';
    authSubmitBtn.textContent = 'CREATE ACCOUNT';
    authSwitchPrompt.textContent = 'Already have an account?';
    authSwitchBtn.textContent = 'Sign In';
  } else {
    authModalTitle.textContent = 'Sign In';
    authModalSubtitle.textContent = 'Sign in to sync your favorite watches.';
    authSubmitBtn.textContent = 'SIGN IN';
    authSwitchPrompt.textContent = "Don't have an account?";
    authSwitchBtn.textContent = 'Create Account';
  }
});

authForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('auth-username').value.trim();
  const password = document.getElementById('auth-password').value;

  authSubmitBtn.disabled = true;
  authSubmitBtn.textContent = 'PLEASE WAIT...';
  authMessage.textContent = '';

  const endpoint = isRegisterMode ? '/api/v1/auth/register' : '/api/v1/auth/login';

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getApiHeaders(),
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || 'Authentication failed.');
    }

    if (isRegisterMode) {
      authMessage.textContent = 'Account created. Please sign in.';
      authMessage.className = 'auth-message success';
      isRegisterMode = false;
      authModalTitle.textContent = 'Sign In';
      authModalSubtitle.textContent = 'Sign in to sync your favorite watches.';
      authSubmitBtn.textContent = 'SIGN IN';
      authSwitchPrompt.textContent = "Don't have an account?";
      authSwitchBtn.textContent = 'Create Account';
      document.getElementById('auth-password').value = '';
    } else {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
      closeAuthModal();
      await syncUserSession();
    }
  } catch (error) {
    authMessage.textContent = error.message;
    authMessage.className = 'auth-message error';
    authSubmitBtn.textContent = isRegisterMode ? 'CREATE ACCOUNT' : 'SIGN IN';
  } finally {
    authSubmitBtn.disabled = false;
  }
});

/* Favorites Event Listeners */
favoritesBtn.addEventListener('click', () => {
  favoritesDropdown.classList.toggle('hidden');
  searchDropdown.classList.add('hidden');
});

favoriteToggleBtn.addEventListener('click', toggleSelectedWatchFavorite);

/* Search and Calculator Event Listeners */
searchInput.addEventListener('input', async (e) => {
  const query = e.target.value.trim();
  if (query.length < 2) {
    searchDropdown.classList.add('hidden');
    return;
  }
  const results = await searchWatches(query);
  showDropdown(results);
});

searchBtn.addEventListener('click', async () => {
  const query = searchInput.value.trim();
  if (!query) return;
  const results = await searchWatches(query);
  showDropdown(results);
});

searchInput.addEventListener('keydown', async (e) => {
  if (e.key === 'Enter') {
    const query = searchInput.value.trim();
    if (!query) return;
    const results = await searchWatches(query);
    showDropdown(results);
  }
});

salaryInput.addEventListener('input', calculateReality);
savingsSlider.addEventListener('input', calculateReality);

/* Close dropdowns on outside click */
document.addEventListener('click', (e) => {
  if (!searchDropdown.contains(e.target) && e.target !== searchInput && e.target !== searchBtn) {
    searchDropdown.classList.add('hidden');
  }
  if (!favoritesDropdown.contains(e.target) && e.target !== favoritesBtn) {
    favoritesDropdown.classList.add('hidden');
  }
});

/* Default initialization on load */
window.addEventListener('DOMContentLoaded', async () => {
  await syncUserSession();
  const watches = await fetchAllWatches();
  if (watches.length > 0) {
    displayWatch(watches[0]);
  }
});