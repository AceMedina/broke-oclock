/* API configuration */
const API_BASE_URL = 'https://watch-api-eight.vercel.app';
const API_KEY = 'broke-oclock-003';
const USER_STORAGE_KEY = 'watch_user';
const CATALOG_CACHE_KEY = 'watch_catalog_cache';
const MIN_SALARY_PHP = 1000;
const MAX_SALARY_PHP = 100000000;

/* Shared helpers */
function getApiHeaders() {
  return {
    'x-api-key': API_KEY,
    'Content-Type': 'application/json'
  };
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0
  }).format(amount);
}

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

function getGoalPlanOverride(goalId) {
  try {
    const raw = localStorage.getItem(`broke_oclock_goal_plan_${goalId}`);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function saveGoalPlanOverride(goalId, plan) {
  try {
    localStorage.setItem(`broke_oclock_goal_plan_${goalId}`, JSON.stringify(plan));
  } catch (error) {
    console.error('Failed to save goal plan override:', error);
  }
}

function removeGoalPlanOverride(goalId) {
  try {
    localStorage.removeItem(`broke_oclock_goal_plan_${goalId}`);
  } catch (error) {
    console.error('Failed to clear goal plan override:', error);
  }
}

function computeVerdictLabel(monthsNeeded) {
  if (monthsNeeded <= 6) return 'FINANCIALLY SANE';
  if (monthsNeeded <= 24) return 'MAJOR COMMITMENT';
  if (monthsNeeded <= 60) return 'MIDLIFE CRISIS LEVEL';
  return 'GENERATIONAL DEBT';
}

/* Login and register page */
function initLoginPage() {
  const authForm = document.getElementById('auth-form');
  if (!authForm) return;

  const tabSignIn = document.getElementById('tab-signin');
  const tabRegister = document.getElementById('tab-register');
  const authSubmitBtn = document.getElementById('auth-submit-btn');
  const authMessage = document.getElementById('auth-message');
  const usernameInput = document.getElementById('auth-username');
  const passwordInput = document.getElementById('auth-password');

  let isRegisterMode = false;

  function setAuthMode(registerMode) {
    isRegisterMode = registerMode;
    authMessage.classList.add('hidden');
    authMessage.classList.remove('success');
    authMessage.textContent = '';

    if (isRegisterMode) {
      tabRegister.classList.add('active');
      tabRegister.setAttribute('aria-selected', 'true');
      tabSignIn.classList.remove('active');
      tabSignIn.setAttribute('aria-selected', 'false');
      authSubmitBtn.textContent = 'CREATE ACCOUNT';
      passwordInput.minLength = 8;
      passwordInput.setAttribute('autocomplete', 'new-password');
    } else {
      tabSignIn.classList.add('active');
      tabSignIn.setAttribute('aria-selected', 'true');
      tabRegister.classList.remove('active');
      tabRegister.setAttribute('aria-selected', 'false');
      authSubmitBtn.textContent = 'SIGN IN';
      passwordInput.minLength = 8;
      passwordInput.setAttribute('autocomplete', 'current-password');
    }
  }

  tabSignIn.addEventListener('click', () => setAuthMode(false));
  tabRegister.addEventListener('click', () => setAuthMode(true));

  authForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    authMessage.classList.add('hidden');
    authMessage.classList.remove('success');

    if (isRegisterMode) {
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
        authMessage.textContent = 'Username must be 3–20 characters using letters, numbers, or underscores.';
        authMessage.classList.remove('hidden');
        return;
      }
      if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password)) {
        authMessage.textContent = 'Password must be at least 8 characters with 1 letter and 1 number.';
        authMessage.classList.remove('hidden');
        return;
      }
    }

    authSubmitBtn.disabled = true;
    authSubmitBtn.textContent = 'PLEASE WAIT...';

    const endpoint = isRegisterMode ? '/api/v1/auth/register' : '/api/v1/auth/login';

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Too many login attempts. Please try again later.');
        }
        const detailMsg = Array.isArray(data.detail)
          ? (data.detail[0]?.msg || 'Invalid input.')
          : data.detail;
        throw new Error(detailMsg || 'Incorrect username or password.');
      }

      if (isRegisterMode) {
        setAuthMode(false);
        passwordInput.value = '';
        authMessage.textContent = 'Account created. Sign in to continue.';
        authMessage.classList.add('success');
        authMessage.classList.remove('hidden');
      } else {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
        window.location.href = 'index.html';
      }
    } catch (error) {
      authMessage.textContent = error.message;
      authMessage.classList.remove('hidden');
      authSubmitBtn.textContent = isRegisterMode ? 'CREATE ACCOUNT' : 'SIGN IN';
    } finally {
      authSubmitBtn.disabled = false;
    }
  });
}

/* Main calculator workspace */
function initDashboardPage() {
  const watchSearch = document.getElementById('watch-search');
  if (!watchSearch) return;

  const navFavoritesBtn = document.getElementById('nav-favorites-btn');
  const navGoalsBtn = document.getElementById('nav-goals-btn');
  const favoritesCount = document.getElementById('favorites-count');
  const goalsCount = document.getElementById('goals-count');
  const navUserBadge = document.getElementById('nav-user-badge');
  const navAuthBtn = document.getElementById('nav-auth-btn');

  const searchBtn = document.getElementById('search-btn');
  const searchDropdown = document.getElementById('search-dropdown');

  const watchBrandYear = document.getElementById('watch-brand-year');
  const favoriteToggleBtn = document.getElementById('favorite-toggle-btn');
  const watchImg = document.getElementById('watch-img');
  const imagePlaceholder = document.getElementById('image-placeholder');
  const watchPrice = document.getElementById('watch-price');
  const watchModel = document.getElementById('watch-model');
  const watchNickname = document.getElementById('watch-nickname');
  const specCase = document.getElementById('spec-case');
  const specMovement = document.getElementById('spec-movement');
  const specCategory = document.getElementById('spec-category');
  const specOrigin = document.getElementById('spec-origin');
  const specRef = document.getElementById('spec-ref');
  const specReserve = document.getElementById('spec-reserve');

  const salaryInput = document.getElementById('monthly-salary');
  const savingsSlider = document.getElementById('savings-rate');
  const savingsDisplay = document.getElementById('savings-display');
  const verdictBadge = document.getElementById('verdict-badge');
  const affordableBtn = document.getElementById('affordable-btn');
  const pinGoalBtn = document.getElementById('pin-goal-btn');
  const outYears = document.getElementById('out-years');
  const outCutoffs = document.getElementById('out-cutoffs');
  const outHours = document.getElementById('out-hours');

  const eqChicken = document.getElementById('eq-chicken');
  const eqCoffee = document.getElementById('eq-coffee');
  const eqIphones = document.getElementById('eq-iphones');
  const eqRent = document.getElementById('eq-rent');
  const humorQuote = document.getElementById('humor-quote');

  const ledgerBackdrop = document.getElementById('ledger-backdrop');
  const ledgerCloseBtn = document.getElementById('ledger-close-btn');
  const drawerFavCount = document.getElementById('drawer-fav-count');
  const drawerFavoritesSection = document.getElementById('drawer-favorites-section');
  const drawerGoalsSection = document.getElementById('drawer-goals-section');
  const favoritesList = document.getElementById('favorites-list');
  const goalsStatusMsg = document.getElementById('goals-status-msg');
  const goalsList = document.getElementById('goals-list');

  const affordableBackdrop = document.getElementById('affordable-backdrop');
  const affordableCloseBtn = document.getElementById('affordable-close-btn');
  const affordableSummary = document.getElementById('affordable-summary');
  const affordableList = document.getElementById('affordable-list');

  let currentUser = null;
  let selectedWatch = null;
  let allWatchesCache = [];
  let userFavorites = [];
  let userGoals = [];

  /* Validate salary bounds */
  function getValidSalary(rawInputValue = salaryInput.value) {
    const raw = parseFloat(rawInputValue);
    if (!Number.isFinite(raw) || raw < MIN_SALARY_PHP) {
      return null;
    }
    if (raw > MAX_SALARY_PHP) {
      return MAX_SALARY_PHP;
    }
    return raw;
  }

  /* Sync user session */
  async function syncUserSession() {
    currentUser = loadSavedUser();

    if (currentUser) {
      navFavoritesBtn.classList.remove('hidden');
      navGoalsBtn.classList.remove('hidden');
      navUserBadge.textContent = `@${currentUser.username}`;
      navUserBadge.classList.remove('hidden');
      navAuthBtn.textContent = 'Sign Out';
      await Promise.all([fetchUserFavorites(), fetchUserGoals()]);
    } else {
      userFavorites = [];
      userGoals = [];
      navFavoritesBtn.classList.add('hidden');
      navGoalsBtn.classList.add('hidden');
      navUserBadge.textContent = '';
      navUserBadge.classList.add('hidden');
      navAuthBtn.textContent = 'Sign In';
      ledgerBackdrop.classList.add('hidden');
    }

    updateFavoriteButtonState();
    updatePinButtonState();
  }

  function openLedgerDrawer(focusSection) {
    if (!currentUser || !currentUser.id) {
      window.location.href = 'login.html';
      return;
    }
    ledgerBackdrop.classList.remove('hidden');
    const target = focusSection === 'goals' ? drawerGoalsSection : drawerFavoritesSection;
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function closeLedgerDrawer() {
    ledgerBackdrop.classList.add('hidden');
  }

  /* User favorites */
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
      drawerFavCount.textContent = userFavorites.length;
      renderFavoritesLedger();
      updateFavoriteButtonState();
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
    }
  }

  function renderFavoritesLedger() {
    favoritesList.innerHTML = '';

    if (userFavorites.length === 0) {
      const emptyMsg = document.createElement('p');
      emptyMsg.className = 'drawer-helper-text';
      emptyMsg.style.padding = '12px 0';
      emptyMsg.textContent = 'No favorite watches saved yet.';
      favoritesList.appendChild(emptyMsg);
      return;
    }

    userFavorites.forEach((watch) => {
      const row = document.createElement('div');
      row.className = 'fav-ledger-row';
      row.innerHTML = `
        <div class="fav-ledger-info">
          <span class="fav-ledger-title">${watch.brand} ${watch.model}</span>
          <span class="fav-ledger-price">${formatCurrency(watch.price_php || 0)}</span>
        </div>
        <div class="fav-ledger-btns">
          <button type="button" class="mini-brutal-btn fav-load-btn">Load</button>
          <button type="button" class="mini-remove-btn fav-del-btn" aria-label="Remove favorite">×</button>
        </div>
      `;

      row.querySelector('.fav-load-btn').addEventListener('click', () => {
        displayWatch(watch);
        closeLedgerDrawer();
      });

      row.querySelector('.fav-del-btn').addEventListener('click', async () => {
        await removeFavoriteById(watch.id);
      });

      favoritesList.appendChild(row);
    });
  }

  async function removeFavoriteById(watchId) {
    if (!currentUser || !currentUser.id) return;
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/favorites/${currentUser.id}/${watchId}`,
        {
          method: 'DELETE',
          headers: getApiHeaders()
        }
      );
      if (!response.ok) throw new Error('Failed to remove favorite.');
      await fetchUserFavorites();
    } catch (error) {
      console.error('Remove favorite error:', error);
    }
  }

  function updateFavoriteButtonState() {
    if (!selectedWatch || !selectedWatch.id) {
      favoriteToggleBtn.textContent = '+ Favorite';
      favoriteToggleBtn.classList.remove('is-saved');
      return;
    }

    const isSaved = userFavorites.some((item) => item.id === selectedWatch.id);
    if (isSaved) {
      favoriteToggleBtn.textContent = 'In Favorites ★';
      favoriteToggleBtn.classList.add('is-saved');
    } else {
      favoriteToggleBtn.textContent = '+ Favorite';
      favoriteToggleBtn.classList.remove('is-saved');
    }
  }

  function updatePinButtonState() {
    if (!selectedWatch || !selectedWatch.id || !currentUser) {
      pinGoalBtn.textContent = '+ Pin Goal';
      return;
    }

    const alreadyPinned = userGoals.some((g) => g.watch_id === selectedWatch.id);
    pinGoalBtn.textContent = alreadyPinned ? 'Pinned ✓' : '+ Pin Goal';
  }

  async function toggleSelectedWatchFavorite() {
    if (!selectedWatch || !selectedWatch.id) return;

    if (!currentUser || !currentUser.id) {
      window.location.href = 'login.html';
      return;
    }

    const isSaved = userFavorites.some((item) => item.id === selectedWatch.id);
    favoriteToggleBtn.disabled = true;

    try {
      if (isSaved) {
        await removeFavoriteById(selectedWatch.id);
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
        await fetchUserFavorites();
      }
    } catch (error) {
      console.error('Favorite toggle error:', error);
    } finally {
      favoriteToggleBtn.disabled = false;
    }
  }

  /* Grail goals */
  async function fetchUserGoals() {
    if (!currentUser || !currentUser.id) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/broke-oclock/users/${currentUser.id}/goals`, {
        method: 'GET',
        headers: getApiHeaders()
      });
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
      const data = await response.json();
      userGoals = (data.goals || []).map((goal) => {
        const override = getGoalPlanOverride(goal.id);
        return override
          ? {
              ...goal,
              monthly_salary: override.monthly_salary,
              savings_rate: override.savings_rate,
              verdict: override.verdict
            }
          : goal;
      });
      goalsCount.textContent = userGoals.length;
      renderGoalsLedger();
      updatePinButtonState();
    } catch (error) {
      console.error('Failed to fetch goals:', error);
    }
  }

  function getEstimatedTargetDate(monthsRemaining) {
    if (monthsRemaining <= 0) return 'Goal Reached';
    const target = new Date();
    target.setMonth(target.getMonth() + Math.ceil(monthsRemaining));
    return target.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  /* Save updated goal salary and savings cut */
  async function updateGoalPlan(goal, newSalary, newRate) {
    const price = parseFloat(goal.price_php || 0);
    const monthlyAlloc = newSalary * (newRate / 100);
    const monthsNeeded = monthlyAlloc > 0 ? price / monthlyAlloc : 0;
    const updatedVerdict = computeVerdictLabel(monthsNeeded);

    saveGoalPlanOverride(goal.id, {
      monthly_salary: newSalary,
      savings_rate: newRate,
      verdict: updatedVerdict
    });

    try {
      await fetch(`${API_BASE_URL}/api/v1/broke-oclock/goals/${goal.id}`, {
        method: 'PATCH',
        headers: getApiHeaders(),
        body: JSON.stringify({
          user_id: currentUser.id,
          monthly_salary: newSalary,
          savings_rate: newRate,
          verdict: updatedVerdict
        })
      });
    } catch (error) {
      console.error('Goal plan sync fallback used:', error);
    }

    await fetchUserGoals();
  }

  function renderGoalsLedger() {
    goalsList.innerHTML = '';

    if (userGoals.length === 0) {
      goalsStatusMsg.textContent = 'No pinned grail goals yet. Enter your salary on the dashboard and click "+ Pin Goal".';
      return;
    }

    goalsStatusMsg.textContent = 'Log every 15/30 sahod cutoff deposit or edit your salary plan anytime.';

    userGoals.forEach((goal) => {
      const price = parseFloat(goal.price_php || 0);
      const saved = parseFloat(goal.amount_saved || 0);
      const salary = parseFloat(goal.monthly_salary || 0);
      const rate = parseInt(goal.savings_rate || 20, 10);
      const monthlyAlloc = salary * (rate / 100);
      const cutoffAmt = monthlyAlloc / 2;
      const isCompleted = price > 0 && saved >= price;
      const clampedSaved = isCompleted ? price : saved;
      const remaining = Math.max(0, price - clampedSaved);
      const monthsLeft = monthlyAlloc > 0 ? remaining / monthlyAlloc : 0;
      const pct = price > 0 ? Math.min(100, (clampedSaved / price) * 100) : 0;

      const card = document.createElement('div');
      card.className = 'goal-brutal-card';
      card.innerHTML = `
        <div class="goal-card-top">
          <span class="goal-card-title">${goal.brand} ${goal.model}</span>
          <span class="goal-verdict-tag">${isCompleted ? 'GOAL REACHED' : (goal.verdict || 'GOAL')}</span>
        </div>

        <div class="goal-metrics-row">
          <div class="goal-metric-item">
            <span class="goal-metric-lbl">SALARY</span>
            <span class="goal-metric-val">${formatCurrency(salary)}</span>
          </div>
          <div class="goal-metric-item">
            <span class="goal-metric-lbl">SAVINGS CUT</span>
            <span class="goal-metric-val">${rate}% • ${formatCurrency(cutoffAmt)}/cutoff</span>
          </div>
          <div class="goal-metric-item">
            <span class="goal-metric-lbl">EST. WRIST DATE</span>
            <span class="goal-metric-val">${getEstimatedTargetDate(monthsLeft)}</span>
          </div>
        </div>

        <div class="goal-edit-panel hidden">
          <div class="goal-edit-inputs">
            <div class="goal-edit-field">
              <label>NEW MONTHLY SALARY (PHP)</label>
              <input type="number" class="edit-salary-input" value="${salary}" min="1000" max="100000000" />
            </div>
            <div class="goal-edit-field">
              <label>SAVINGS CUT (5%–100%)</label>
              <input type="number" class="edit-rate-input" value="${rate}" min="5" max="100" step="5" />
            </div>
          </div>
          <div class="goal-edit-btns">
            <button type="button" class="mini-brutal-btn cancel-edit-btn">Cancel</button>
            <button type="button" class="action-solid-btn save-edit-btn" style="padding: 5px 12px; font-size: 11px;">Save Plan</button>
          </div>
        </div>

        <div class="goal-progress-block">
          <div class="goal-progress-text">
            <span>${formatCurrency(clampedSaved)} / ${formatCurrency(price)}</span>
            <span>${Math.round(pct)}%</span>
          </div>
          <div class="goal-bar-track">
            <div class="goal-bar-fill" style="width: ${pct}%"></div>
          </div>
        </div>

        <div class="goal-card-actions">
          <button type="button" class="goal-deposit-btn" ${isCompleted ? 'disabled' : ''}>
            ${isCompleted ? 'Goal Reached ✓' : `+ Log 15/30 Cutoff (${formatCurrency(cutoffAmt)})`}
          </button>
          <button type="button" class="goal-edit-btn">Edit</button>
          <button type="button" class="goal-load-btn">Load</button>
          <button type="button" class="goal-remove-btn">Remove</button>
        </div>
      `;

      const editPanel = card.querySelector('.goal-edit-panel');
      const editSalaryInput = card.querySelector('.edit-salary-input');
      const editRateInput = card.querySelector('.edit-rate-input');

      card.querySelector('.goal-edit-btn').addEventListener('click', () => {
        editPanel.classList.toggle('hidden');
        if (!editPanel.classList.contains('hidden')) {
          editSalaryInput.focus();
        }
      });

      card.querySelector('.cancel-edit-btn').addEventListener('click', () => {
        editSalaryInput.value = salary;
        editRateInput.value = rate;
        editPanel.classList.add('hidden');
      });

      card.querySelector('.save-edit-btn').addEventListener('click', async () => {
        const validNewSalary = getValidSalary(editSalaryInput.value);
        if (!validNewSalary) {
          editSalaryInput.focus();
          return;
        }
        const rawRate = parseInt(editRateInput.value, 10);
        const validNewRate = Number.isFinite(rawRate) ? Math.min(100, Math.max(5, rawRate)) : rate;
        await updateGoalPlan(goal, validNewSalary, validNewRate);
      });

      const depositBtn = card.querySelector('.goal-deposit-btn');
      if (!isCompleted) {
        depositBtn.addEventListener('click', () => {
          logCutoffDeposit(goal, cutoffAmt);
        });
      }

      card.querySelector('.goal-load-btn').addEventListener('click', () => {
        const matchedWatch = allWatchesCache.find((w) => w.id === goal.watch_id) || {
          id: goal.watch_id,
          brand: goal.brand,
          model: goal.model,
          nickname: goal.nickname,
          price_php: goal.price_php,
          image: goal.image
        };
        salaryInput.value = salary;
        savingsSlider.value = rate;
        displayWatch(matchedWatch);
        closeLedgerDrawer();
      });

      card.querySelector('.goal-remove-btn').addEventListener('click', () => {
        deleteGoal(goal.id);
      });

      goalsList.appendChild(card);
    });
  }

  async function pinCurrentGoal() {
    if (!selectedWatch || !selectedWatch.id) return;

    if (!currentUser || !currentUser.id) {
      window.location.href = 'login.html';
      return;
    }

    const existingGoal = userGoals.find((g) => g.watch_id === selectedWatch.id);
    if (existingGoal) {
      openLedgerDrawer('goals');
      return;
    }

    const salary = getValidSalary();
    const savingsPct = parseInt(savingsSlider.value, 10);

    if (!salary) {
      salaryInput.focus();
      verdictBadge.textContent = 'MIN SALARY ₱1,000';
      return;
    }

    if (parseFloat(salaryInput.value) > MAX_SALARY_PHP) {
      salaryInput.value = MAX_SALARY_PHP;
    }

    pinGoalBtn.disabled = true;
    pinGoalBtn.textContent = 'Pinning...';

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/broke-oclock/goals`, {
        method: 'POST',
        headers: getApiHeaders(),
        body: JSON.stringify({
          user_id: currentUser.id,
          watch_id: selectedWatch.id,
          monthly_salary: salary,
          savings_rate: savingsPct,
          verdict: verdictBadge.textContent
        })
      });

      if (!response.ok) throw new Error('Failed to pin goal.');
      await fetchUserGoals();
      pinGoalBtn.textContent = 'Pinned ✓';
    } catch (error) {
      console.error('Pin goal error:', error);
      pinGoalBtn.textContent = '+ Pin Goal';
    } finally {
      pinGoalBtn.disabled = false;
    }
  }

  async function logCutoffDeposit(goal, cutoffAmt) {
    if (!currentUser || !currentUser.id) return;

    const price = parseFloat(goal.price_php || 0);
    const saved = parseFloat(goal.amount_saved || 0);
    if (price > 0 && saved >= price) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/broke-oclock/goals/${goal.id}/deposit`, {
        method: 'PATCH',
        headers: getApiHeaders(),
        body: JSON.stringify({
          user_id: currentUser.id,
          deposit_amount: cutoffAmt
        })
      });

      if (!response.ok) throw new Error('Failed to log deposit.');
      await fetchUserGoals();
    } catch (error) {
      console.error('Deposit error:', error);
    }
  }

  async function deleteGoal(goalId) {
    if (!currentUser || !currentUser.id) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/broke-oclock/goals/${goalId}?user_id=${currentUser.id}`,
        {
          method: 'DELETE',
          headers: getApiHeaders()
        }
      );

      if (!response.ok) throw new Error('Failed to remove goal.');
      removeGoalPlanOverride(goalId);
      await fetchUserGoals();
    } catch (error) {
      console.error('Delete goal error:', error);
    }
  }

  /* Budget-matched top 5 closest watches */
  async function openClosestWatchesModal() {
    const salary = getValidSalary();
    if (!salary) {
      salaryInput.focus();
      verdictBadge.textContent = 'MIN SALARY ₱1,000';
      return;
    }

    if (parseFloat(salaryInput.value) > MAX_SALARY_PHP) {
      salaryInput.value = MAX_SALARY_PHP;
    }

    affordableBackdrop.classList.remove('hidden');
    affordableList.innerHTML = '';

    const savingsPct = parseInt(savingsSlider.value, 10);
    const monthlyAlloc = salary * (savingsPct / 100);
    const annualTargetBudget = monthlyAlloc * 12;

    if (allWatchesCache.length === 0) {
      affordableSummary.textContent = 'Loading watch catalog...';
      await fetchAllWatches();
    }

    if (allWatchesCache.length === 0) {
      affordableSummary.textContent = 'No watches available right now.';
      return;
    }

    const sortedByPrice = [...allWatchesCache].sort(
      (a, b) => parseFloat(a.price_php || 0) - parseFloat(b.price_php || 0)
    );

    const withinBudget = sortedByPrice
      .filter((w) => parseFloat(w.price_php || 0) <= annualTargetBudget)
      .reverse();

    const aboveBudget = sortedByPrice.filter(
      (w) => parseFloat(w.price_php || 0) > annualTargetBudget
    );

    const topFive = [...withinBudget, ...aboveBudget].slice(0, 5);

    affordableSummary.textContent = `1-Yr Target Budget: ${formatCurrency(annualTargetBudget)} (${formatCurrency(monthlyAlloc)}/mo at ${savingsPct}%)`;

    topFive.forEach((watch, index) => {
      const price = parseFloat(watch.price_php || 0);
      const monthsNeeded = price / monthlyAlloc;
      const yearsNeeded = (monthsNeeded / 12).toFixed(1);
      const paydaysNeeded = Math.ceil(monthsNeeded * 2);

      const row = document.createElement('div');
      row.className = 'closest-row';
      row.innerHTML = `
        <div class="closest-left">
          <span class="rank-square ${index === 0 ? 'rank-first' : ''}">#${index + 1}</span>
          <div class="closest-watch-info">
            <span class="closest-watch-title">${watch.brand} ${watch.model}</span>
            <span class="closest-watch-sub">${formatCurrency(price)} • ${paydaysNeeded.toLocaleString()} paydays • ${monthsNeeded.toFixed(1)} months</span>
          </div>
        </div>
        <div class="closest-right">
          <span class="years-badge">${yearsNeeded} yrs</span>
          <button type="button" class="closest-load-btn">Load in Calculator</button>
        </div>
      `;

      row.querySelector('.closest-load-btn').addEventListener('click', () => {
        displayWatch(watch);
        affordableBackdrop.classList.add('hidden');
      });

      affordableList.appendChild(row);
    });
  }

  /* Load catalog via version cache, snapshot, API, or local fallback */
  async function fetchAllWatches() {
    let localCache = null;
    try {
      const rawCache = localStorage.getItem(CATALOG_CACHE_KEY);
      if (rawCache) {
        const parsed = JSON.parse(rawCache);
        if (parsed && Array.isArray(parsed.watches)) {
          localCache = parsed;
        }
      }
    } catch (error) {
      localCache = null;
    }

    try {
      const versionRes = await fetch(`${API_BASE_URL}/api/v1/watches/version`);
      if (versionRes.ok) {
        const versionData = await versionRes.json();
        if (localCache && localCache.version === versionData.version && localCache.watches.length > 0) {
          allWatchesCache = localCache.watches;
          return allWatchesCache;
        }
      }

      const snapshotRes = await fetch(`${API_BASE_URL}/api/v1/watches/snapshot`);
      if (snapshotRes.ok) {
        const snapshotData = await snapshotRes.json();
        if (Array.isArray(snapshotData.watches) && snapshotData.watches.length > 0) {
          allWatchesCache = snapshotData.watches;
          try {
            localStorage.setItem(
              CATALOG_CACHE_KEY,
              JSON.stringify({ version: snapshotData.version, watches: allWatchesCache })
            );
          } catch (error) {
            console.error('Failed to store catalog cache:', error);
          }
          return allWatchesCache;
        }
      }
    } catch (error) {
      console.error('Catalog snapshot check failed:', error);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/watches`, {
        method: 'GET',
        headers: getApiHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.watches) && data.watches.length > 0) {
          allWatchesCache = data.watches;
          return allWatchesCache;
        }
      }
    } catch (error) {
      console.error('API catalog fallback failed:', error);
    }

    if (localCache && localCache.watches.length > 0) {
      allWatchesCache = localCache.watches;
      return allWatchesCache;
    }

    try {
      const staticRes = await fetch('watches.json');
      if (staticRes.ok) {
        const staticData = await staticRes.json();
        allWatchesCache = Array.isArray(staticData) ? staticData : (staticData.watches || []);
        return allWatchesCache;
      }
    } catch (error) {
      console.error('Static watches.json fallback failed:', error);
    }

    return [];
  }

  /* Search cached catalog first, then API */
  async function searchWatches(query) {
    const q = query.toLowerCase();
    if (allWatchesCache.length > 0) {
      return allWatchesCache.filter((w) => {
        const brand = (w.brand || '').toLowerCase();
        const model = (w.model || '').toLowerCase();
        const nick = (w.nickname || '').toLowerCase();
        const ref = (w.reference_number || w.reference || '').toLowerCase();
        return brand.includes(q) || model.includes(q) || nick.includes(q) || ref.includes(q);
      });
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/watches/search?q=${encodeURIComponent(query)}`,
        {
          method: 'GET',
          headers: getApiHeaders()
        }
      );
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Search error:', error);
      return [];
    }
  }

  function showSearchDropdown(items) {
    searchDropdown.innerHTML = '';

    if (!items || items.length === 0) {
      const emptyRow = document.createElement('div');
      emptyRow.className = 'search-result-row';
      emptyRow.textContent = 'No watches found';
      searchDropdown.appendChild(emptyRow);
      searchDropdown.classList.remove('hidden');
      return;
    }

    items.forEach((item) => {
      const row = document.createElement('div');
      row.className = 'search-result-row';
      row.innerHTML = `
        <span><strong>${item.brand}</strong> • ${item.model}</span>
        <span class="search-result-price">${formatCurrency(item.price_php || 0)}</span>
      `;

      row.addEventListener('click', () => {
        displayWatch(item);
        searchDropdown.classList.add('hidden');
        watchSearch.value = '';
      });

      searchDropdown.appendChild(row);
    });

    searchDropdown.classList.remove('hidden');
  }

  /* Display selected watch */
  function displayWatch(watch) {
    selectedWatch = watch;

    const brandLabel = watch.brand ? watch.brand.toUpperCase() : 'WATCH BRAND';
    const yearLabel = watch.year || watch.release_year || '----';
    watchBrandYear.textContent = `${brandLabel} • ${yearLabel}`;

    watchModel.textContent = watch.model || 'Select a watch';
    watchNickname.textContent = watch.nickname ? `"${watch.nickname}"` : '';

    const priceVal = watch.price_php || watch.price || 0;
    watchPrice.textContent = formatCurrency(priceVal);

    const caseDiameter = watch.case_size_mm || watch.case_diameter_mm || watch.case_size;
    specCase.textContent = caseDiameter ? `${caseDiameter} mm` : '-- mm';
    specMovement.textContent = watch.movement || watch.calibre || '--';
    specCategory.textContent = watch.category || '--';
    specOrigin.textContent = watch.origin || '--';
    specRef.textContent = watch.reference_number || watch.reference || '--';

    const powerReserve = watch.power_reserve_hours || watch.power_reserve;
    specReserve.textContent = powerReserve
      ? (typeof powerReserve === 'number' ? `${powerReserve} hrs` : powerReserve)
      : '70 hrs';

    const rawImagePath = watch.image || watch.image_url || '';
    if (rawImagePath && typeof rawImagePath === 'string' && rawImagePath.trim() !== '') {
      const fileName = rawImagePath.split('/').pop().trim();
      const localSrc = `images/${fileName}`;

      watchImg.onload = () => {
        watchImg.classList.remove('hidden');
        imagePlaceholder.classList.add('hidden');
      };

      watchImg.onerror = () => {
        watchImg.classList.add('hidden');
        imagePlaceholder.classList.remove('hidden');
      };

      watchImg.src = localSrc;
    } else {
      watchImg.classList.add('hidden');
      imagePlaceholder.classList.remove('hidden');
    }

    updateFavoriteButtonState();
    updatePinButtonState();
    calculateReality();
  }

  /* Reality check calculation */
  function calculateReality() {
    const salary = getValidSalary();
    const savingsPct = parseInt(savingsSlider.value, 10);
    savingsDisplay.textContent = `${savingsPct}%`;

    if (parseFloat(salaryInput.value) > MAX_SALARY_PHP) {
      salaryInput.value = MAX_SALARY_PHP;
    }

    if (!selectedWatch || !salary) {
      outYears.textContent = '--';
      outCutoffs.textContent = '--';
      outHours.textContent = '--';
      verdictBadge.textContent = salaryInput.value.trim() !== '' ? 'MIN SALARY ₱1,000' : 'AWAITING INPUT';
      verdictBadge.classList.remove('verdict-alert');
      eqChicken.textContent = '--';
      eqCoffee.textContent = '--';
      eqIphones.textContent = '--';
      eqRent.textContent = '--';
      humorQuote.textContent = '"Enter a monthly salary of at least ₱1,000 to calculate your reality."';
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

    verdictBadge.textContent = computeVerdictLabel(monthsNeeded);
    if (monthsNeeded > 24) {
      verdictBadge.classList.add('verdict-alert');
    } else {
      verdictBadge.classList.remove('verdict-alert');
    }

    eqChicken.textContent = Math.floor(price / 180).toLocaleString();
    eqCoffee.textContent = Math.floor(price / 190).toLocaleString();
    eqIphones.textContent = (price / 85000).toFixed(1);
    eqRent.textContent = Math.floor(price / 15000).toLocaleString();

    if (monthsNeeded <= 12) {
      humorQuote.textContent = '"A year of discipline. Entirely doable if you cut unli-samgyup."';
    } else if (monthsNeeded <= 60) {
      humorQuote.textContent = '"Your wrist will look brilliant while your savings account weeps softly."';
    } else if (monthsNeeded <= 120) {
      humorQuote.textContent = '"That’s not a watch. That’s a mortgage with a bezel."';
    } else {
      humorQuote.textContent = '"Leave this page open as your desktop wallpaper for character development."';
    }
  }

  /* Event listeners */
  navAuthBtn.addEventListener('click', () => {
    if (currentUser) {
      localStorage.removeItem(USER_STORAGE_KEY);
      syncUserSession();
    } else {
      window.location.href = 'login.html';
    }
  });

  navFavoritesBtn.addEventListener('click', () => openLedgerDrawer('favorites'));
  navGoalsBtn.addEventListener('click', () => openLedgerDrawer('goals'));
  ledgerCloseBtn.addEventListener('click', closeLedgerDrawer);
  ledgerBackdrop.addEventListener('click', (e) => {
    if (e.target === ledgerBackdrop) closeLedgerDrawer();
  });

  favoriteToggleBtn.addEventListener('click', toggleSelectedWatchFavorite);
  pinGoalBtn.addEventListener('click', pinCurrentGoal);

  affordableBtn.addEventListener('click', openClosestWatchesModal);
  affordableCloseBtn.addEventListener('click', () => affordableBackdrop.classList.add('hidden'));
  affordableBackdrop.addEventListener('click', (e) => {
    if (e.target === affordableBackdrop) affordableBackdrop.classList.add('hidden');
  });

  watchSearch.addEventListener('input', async (e) => {
    const query = e.target.value.trim();
    if (query.length < 2) {
      searchDropdown.classList.add('hidden');
      return;
    }
    const results = await searchWatches(query);
    showSearchDropdown(results);
  });

  searchBtn.addEventListener('click', async () => {
    const query = watchSearch.value.trim();
    if (!query) return;
    const results = await searchWatches(query);
    showSearchDropdown(results);
  });

  watchSearch.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      const query = watchSearch.value.trim();
      if (!query) return;
      const results = await searchWatches(query);
      showSearchDropdown(results);
    }
  });

  salaryInput.addEventListener('input', calculateReality);
  savingsSlider.addEventListener('input', calculateReality);

  document.addEventListener('click', (e) => {
    if (!searchDropdown.contains(e.target) && e.target !== watchSearch && e.target !== searchBtn) {
      searchDropdown.classList.add('hidden');
    }
  });

  /* Initial load */
  (async () => {
    await syncUserSession();
    const watches = await fetchAllWatches();
    if (watches.length > 0) {
      displayWatch(watches[0]);
    }
  })();
}

/* Boot active page */
window.addEventListener('DOMContentLoaded', () => {
  initLoginPage();
  initDashboardPage();
});