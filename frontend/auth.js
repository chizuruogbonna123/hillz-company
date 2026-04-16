const API_BASE_URL = 'https://hillz-company.onrender.com';
const TOKEN_STORAGE_KEY = 'token';
const AUTH_USER_KEY = 'authUser';

function getInputValue(id) {
  const input = document.getElementById(id);
  return input ? input.value.trim() : '';
}

function showErr(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
}

function showOk(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
}

function clearAuthMessages() {
  ['login-err', 'reg-err', 'reg-ok'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = '';
      el.style.display = 'block';
    }
  });
}

function setAuthToken(token) {
  if (!token) return;
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

function saveAuthUser(user) {
  if (!user) return;
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

function getAuthToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

function togglePw(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
  } else {
    input.type = 'password';
    btn.textContent = '👁';
  }
}

function switchTab(tab) {
  const loginTab = document.getElementById('tab-login');
  const registerTab = document.getElementById('tab-register');
  const loginForm = document.getElementById('form-login');
  const registerForm = document.getElementById('form-register');

  if (tab === 'register') {
    loginTab.classList.remove('active');
    registerTab.classList.add('active');
    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
  } else {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
  }
  clearAuthMessages();
}

async function postJson(url, payload) {
  console.log('POST', url, payload);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  const result = await response.json();
  console.log('Response', response.status, result);

  if (!response.ok) {
    const errorMessage = result?.message || result?.error || response.statusText || 'Request failed';
    throw new Error(errorMessage);
  }
  return result;
}

async function doLogin() {
  clearAuthMessages();
  const email = getInputValue('l-user').toLowerCase();
  const password = getInputValue('l-pass');

  if (!email || !password) {
    showErr('login-err', 'Please enter both email and password.');
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showErr('login-err', 'Please enter a valid email address.');
    return;
  }

  try {
    const result = await postJson(`${API_BASE_URL}/login`, { email, password });

    if (result?.success) {
      if (result.token) {
        setAuthToken(result.token);
      }
      if (result.user) {
        saveAuthUser(result.user);
      }
      window.location.href = 'dashboard.html';
      return;
    }

    throw new Error(result?.message || 'Login failed.');
  } catch (error) {
    console.error('Login failed:', error);
    showErr('login-err', error.message || 'Login failed.');
    const passInput = document.getElementById('l-pass');
    if (passInput) passInput.value = '';
  }
}

async function doRegister() {
  clearAuthMessages();
  const name = getInputValue('r-name');
  const email = getInputValue('r-user').toLowerCase();
  const password = getInputValue('r-pass');
  const confirmPassword = getInputValue('r-pass2');

  if (!name || !email || !password || !confirmPassword) {
    showErr('reg-err', 'Please complete all registration fields.');
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showErr('reg-err', 'Please enter a valid email address.');
    return;
  }
  if (password.length < 6) {
    showErr('reg-err', 'Password must be at least 6 characters.');
    return;
  }
  if (password !== confirmPassword) {
    showErr('reg-err', 'Passwords do not match.');
    return;
  }

  try {
    const result = await postJson(`${API_BASE_URL}/register`, { email, password, name });
    showOk('reg-ok', result?.success ? 'Registration successful. Please sign in.' : 'Account created.');
    document.getElementById('r-name').value = '';
    document.getElementById('r-user').value = '';
    document.getElementById('r-pass').value = '';
    document.getElementById('r-pass2').value = '';
    switchTab('login');
  } catch (error) {
    console.error('Register failed:', error);
    showErr('reg-err', error.message || 'Registration failed.');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  if (getAuthToken()) {
    window.location.href = 'dashboard.html';
  }
});
