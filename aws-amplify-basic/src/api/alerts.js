const API_URL = 'https://e5lpxos917.execute-api.us-east-1.amazonaws.com';

export async function setAlert(userId, alert) {
    const res = await fetch(`${API_URL}/alerts/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert)
    });
    return await res.json();
}
