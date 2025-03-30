const API_URL = 'https://e5lpxos917.execute-api.us-east-1.amazonaws.com';
const app = document.getElementById('app');

document.addEventListener('DOMContentLoaded', renderLoginForm);

function renderLoginForm() {
    app.innerHTML = `
        <div class="form-container">
        <h2>Login</h2>
        <input type="email" id="login-email" placeholder="Email" />
        <input type="password" id="login-password" placeholder="Password" />
        <button id="login-btn">Login</button>
        <p>Don't have an account? <a href="#" id="show-register">Register</a></p>
        <div id="error-message" class="error-message"></div>
        </div>
    `;

    document.getElementById('login-btn').addEventListener('click', login);
    document.getElementById('show-register').addEventListener('click', renderRegisterForm);
}

function renderRegisterForm() {
    app.innerHTML = `
        <div class="form-container">
        <h2>Register</h2>
        <input type="email" id="register-email" placeholder="Email" />
        <input type="text" id="register-name" placeholder="Name" />
        <input type="password" id="register-password" placeholder="Password" />
        <button id="register-btn">Register</button>
        <p>Already have an account? <a href="#" id="show-login">Login</a></p>
        <div id="error-message" class="error-message"></div>
        </div>
    `;

    document.getElementById('register-btn').addEventListener('click', register);
    document.getElementById('show-login').addEventListener('click', renderLoginForm);
}

async function login() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (data.error) {
        showError(data.error);
    } else {
        localStorage.setItem('userId', data.userId);
        alert('Login successful');
        renderHome();
    }
}

async function register() {
    const email = document.getElementById('register-email').value;
    const name = document.getElementById('register-name').value;
    const password = document.getElementById('register-password').value;

    const res = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password })
    });

    const data = await res.json();
    if (data.error) {
        showError(data.error);
    } else {
        alert('Signup successful! Please log in.');
        renderLoginForm();
    }
}

function showError(msg) {
    const errBox = document.getElementById('error-message');
    if (errBox) errBox.innerText = msg;
}

function renderHome() {
    const userId = localStorage.getItem('userId');
    app.innerHTML = `
        <h2>Welcome!</h2>
        <p>Your User ID: <strong>${userId}</strong></p>
        <button id="logout-btn">Logout</button>
        <button id="view-allocation">View Allocation</button>
        <div id="result"></div>
    `;

    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.clear();
        renderLoginForm();
});

document.getElementById('view-allocation').addEventListener('click', async () => {
    const res = await fetch(`${API_URL}/portfolio/${userId}/allocation`);
    const data = await res.json();
    document.getElementById('result').innerText = JSON.stringify(data, null, 2);
});
}
