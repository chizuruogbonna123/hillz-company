const API_BASE_URL = 'http://localhost:5000';

function getInputValue(id) {
  const input = document.getElementById(id);
  return input ? input.value.trim() : '';
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const errorMessage = data?.error || data?.message || response.statusText || 'Request failed';
    throw new Error(errorMessage);
  }

  return data;
}

async function doRegister() {
  const name = getInputValue('r-name');
  const username = getInputValue('r-user');
  const password = getInputValue('r-pass');
  const password2 = getInputValue('r-pass2');

  if (!name || !username || !password || !password2) {
    alert('Please fill in all register fields.');
    return;
  }

  if (password !== password2) {
    alert('Passwords do not match.');
    return;
  }

  try {
    const result = await postJson(`${API_BASE_URL}/register`, { username, password });
    alert(`Register success: ${result.success ? 'Account created' : 'Unexpected response'}`);
    document.getElementById('r-name').value = '';
    document.getElementById('r-user').value = '';
    document.getElementById('r-pass').value = '';
    document.getElementById('r-pass2').value = '';
  } catch (error) {
    alert(`Register error: ${error.message}`);
  }
}

async function doLogin() {
  const username = getInputValue('l-user');
  const password = getInputValue('l-pass');

  if (!username || !password) {
    alert('Please enter username and password.');
    return;
  }

  try {
    const result = await postJson(`${API_BASE_URL}/login`, { username, password });
    alert(`Login success: ${result.message || 'Logged in'}`);
    document.getElementById('l-pass').value = '';
  } catch (error) {
    alert(`Login error: ${error.message}`);
  }
}

function preventButtonRefresh(buttonId) {
  const button = document.getElementById(buttonId);
  if (!button) return;
  button.addEventListener('click', event => {
    event.preventDefault();
  });
}

window.addEventListener('DOMContentLoaded', () => {
  preventButtonRefresh('login-btn');
  preventButtonRefresh('register-btn');
});
