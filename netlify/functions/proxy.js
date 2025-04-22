import fetch from 'node-fetch';

export async function handler(event) {
  const path = event.path.replace('/.netlify/functions/proxy', '');
  const backendUrl = `https://e5lpxos917.execute-api.us-east-1.amazonaws.com${path}`;

  const response = await fetch(backendUrl, {
    method: event.httpMethod,
    headers: { 'Content-Type': 'application/json' },
    body: event.body,
  });

  const data = await response.text();

  return {
    statusCode: response.status,
    body: data,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  };
}
