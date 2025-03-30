import { addAssetToPortfolio } from '../api/portfolio.js';
import { renderHome } from './home.js';

export function renderAddAssetForm() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <h2>Add Asset to Portfolio</h2>
        <input type="text" id="symbol" placeholder="Stock Symbol (e.g., AAPL)" />
        <input type="number" id="quantity" placeholder="Quantity" />
        <input type="number" step="0.01" id="price" placeholder="Buy Price" />
        <button id="add-asset-btn">Add Asset</button>
        <button id="back-btn">Back</button>
        <div id="result"></div>
    `;

    document.getElementById('add-asset-btn').addEventListener('click', async () => {
        const symbol = document.getElementById('symbol').value;
        const quantity = parseInt(document.getElementById('quantity').value);
        const price = parseFloat(document.getElementById('price').value);
        const userId = localStorage.getItem('userId');

        const res = await addAssetToPortfolio(userId, { symbol, quantity, price });
        document.getElementById('result').innerText = res.message || res.error;
    });

    document.getElementById('back-btn').addEventListener('click', renderHome);
}  
