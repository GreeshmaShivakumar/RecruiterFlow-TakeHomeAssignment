import { expect, test } from '@playwright/test';

const apiKey = process.env.REQRES_API_KEY;

test.skip(
  !apiKey,
  'REQRES_API_KEY is missing; create .env from .env.example to run ReqRes API tests.',
);

function getApiHeaders(): { 'x-api-key': string } {
  if (!apiKey) {
    throw new Error('REQRES_API_KEY is missing. Create a .env file from .env.example.');
  }

  return { 'x-api-key': apiKey };
}

test('GET user 2 returns a user email', async ({ request }) => {
  const response = await request.get('https://reqres.in/api/users/2', {
    headers: getApiHeaders(),
  });
  const responseBody = await response.json();

  expect(response.status()).toBe(200);
  expect(responseBody.data.email).toBeTruthy();
});

test('POST users creates Morpheus', async ({ request }) => {
  const response = await request.post('https://reqres.in/api/users', {
    headers: getApiHeaders(),
    data: {
      name: 'morpheus',
      job: 'leader',
    },
  });
  const responseBody = await response.json();

  expect(response.status()).toBe(201);
  expect(responseBody.name).toBe('morpheus');
});

test('GET user 23 returns not found', async ({ request }) => {
  const response = await request.get('https://reqres.in/api/users/23', {
    headers: getApiHeaders(),
  });

  expect(response.status()).toBe(404);
});
