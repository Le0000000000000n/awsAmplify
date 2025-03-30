import { login } from '../api/auth.js';
import { renderRegisterForm } from './registerForm.js';
import { renderHome } from './home.js';
import { showError } from './utils.js';

export function renderLoginForm() {
    const app = document.getElementById('app');
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

    document.getElementById('login-btn').addEventListener('click', async () => {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const data = await login(email, password);

        if (data.error) {
            showError(data.error);
        } else {
            localStorage.setItem('userId', data.userId);
            renderHome();
        }
    });

    document.getElementById('show-register').addEventListener('click', renderRegisterForm);
}
