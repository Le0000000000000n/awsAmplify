const API_URL = 'https://e5lpxos917.execute-api.us-east-1.amazonaws.com';

export async function getAllocation(userId) {
    const res = await fetch(`${API_URL}/portfolio/${userId}/allocation`);
    return await res.json();
}
