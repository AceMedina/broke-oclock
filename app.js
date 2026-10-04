/* Configuration */
const API_BASE_URL = 'https://watch-api-eight.vercel.app';
const API_KEY = 'broke-oclock-003';

/* DOM Elements */
const searchInput = document.getElementById('watch-search');
const searchBtn = document.getElementById('search-btn');

/* Fetch watches from backend */
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

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data = await response.json();
    console.log('API results:', data.results);
    return data.results;
  } catch (error) {
    console.error('API connection error:', error);
    return [];
  }
}

/* Event listener to test connectivity */
searchBtn.addEventListener('click', async () => {
  const query = searchInput.value.trim();
  if (!query) {
    console.log('Search box is empty.');
    return;
  }

  console.log(`Connecting to API for "${query}"...`);
  const results = await searchWatches(query);
  console.log('Received data:', results);
});