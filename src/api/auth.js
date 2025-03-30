const API_URL = 'https://e5lpxos917.execute-api.us-east-1.amazonaws.com';

export async function login(email, password) {
    const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    return await res.json();
}

export async function register(email, name, password) {
    const res = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password }),
    });
    return await res.json();
}
