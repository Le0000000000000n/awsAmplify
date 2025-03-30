import { setAlert } from '../api/alerts.js';
import { renderHome } from './home.js';

export function renderAlertForm() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <h2>Set Stock Price Alert</h2>
        <input type="text" id="symbol" placeholder="Stock Symbol" />
        <input type="number" id="threshold" placeholder="Price Threshold" />
        <select id="type">
            <option value="rise">Rise Above</option>
            <option value="fall">Fall Below</option>
        </select>
        <button id="set-alert-btn">Set Alert</button>
        <button id="back-btn">Back</button>
        <div id="result"></div>
    `;

    document.getElementById('set-alert-btn').addEventListener('click', async () => {
        const symbol = document.getElementById('symbol').value;
        const threshold = parseFloat(document.getElementById('threshold').value);
        const type = document.getElementById('type').value;
        const userId = localStorage.getItem('userId');

        const res = await setAlert(userId, { symbol, threshold, type });
        document.getElementById('result').innerText = res.message || res.error;
    });

    document.getElementById('back-btn').addEventListener('click', renderHome);
}  
