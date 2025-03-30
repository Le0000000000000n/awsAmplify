const API_URL = 'https://e5lpxos917.execute-api.us-east-1.amazonaws.com';

export async function addAssetToPortfolio(userId, asset) {
    const res = await fetch(`${API_URL}/portfolio/assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, assets: [asset] })
    });
    return await res.json();
}
