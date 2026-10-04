/* Configuration */
const API_BASE_URL = 'https://watch-api-eight.vercel.app';
const API_KEY = 'broke-oclock-003';

/* DOM Elements - Search */
const searchInput = document.getElementById('watch-search');
const searchBtn = document.getElementById('search-btn');
const searchDropdown = document.getElementById('search-dropdown');

/* DOM Elements - Watch Card */
const watchBrand = document.getElementById('watch-brand');
const specYear = document.getElementById('spec-year');
const watchImg = document.getElementById('watch-img');
const imagePlaceholder = document.getElementById('image-placeholder');
const watchModel = document.getElementById('watch-model');
const watchNickname = document.getElementById('watch-nickname');
const watchPrice = document.getElementById('watch-price');
const specCase = document.getElementById('spec-case');
const specMovement = document.getElementById('spec-movement');
const specCategory = document.getElementById('spec-category');
const specOrigin = document.getElementById('spec-origin');

/* State */
let selectedWatch = null;

/* Currency helper */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0
  }).format(amount);
}

/* Fetch all watches */
async function fetchAllWatches() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/watches`, {
      method: 'GET',
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      }
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
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      }
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

  specCase.textContent = watch.case_diameter ? `${watch.case_diameter} mm` : '-- mm';
  specMovement.textContent = watch.movement || '--';
  specCategory.textContent = watch.category || '--';
  specOrigin.textContent = watch.origin || '--';

  if (watch.image_url) {
    watchImg.src = watch.image_url;
    watchImg.classList.remove('hidden');
    imagePlaceholder.classList.add('hidden');
  } else {
    watchImg.classList.add('hidden');
    imagePlaceholder.classList.remove('hidden');
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

/* Event listeners */
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

/* Close dropdown on outside click */
document.addEventListener('click', (e) => {
  if (!searchDropdown.contains(e.target) && e.target !== searchInput && e.target !== searchBtn) {
    searchDropdown.classList.add('hidden');
  }
});

/* Default initialization on load */
window.addEventListener('DOMContentLoaded', async () => {
  const watches = await fetchAllWatches();
  if (watches.length > 0) {
    displayWatch(watches[0]);
  }
});