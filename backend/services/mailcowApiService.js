const axios = require('axios');

const MAILCOW_API_URL = process.env.MAILCOW_API_URL;
const MAILCOW_API_KEY = process.env.MAILCOW_API_KEY;

if (!MAILCOW_API_URL || !MAILCOW_API_KEY) {
  // Intentionally do not throw here to avoid crashing the app if mail is not configured.
  // The controllers will surface configuration errors when these services are used.
  console.warn(
    '[mailcowApiService] MAILCOW_API_URL or MAILCOW_API_KEY is not set. Mailbox management endpoints will not work until configured.'
  );
}

const client = axios.create({
  baseURL: MAILCOW_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': MAILCOW_API_KEY || ''
  },
  timeout: 15000
});

// Add error interceptor for better error messages
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const message = error.response.data?.msg || error.response.data?.message || error.message;
      error.message = `Mailcow API Error: ${message}`;
    } else if (error.request) {
      error.message = 'Mailcow API: No response received. Check MAILCOW_API_URL configuration.';
    }
    throw error;
  }
);

async function listMailboxes() {
  const { data } = await client.get('/api/v1/get/mailbox/all');
  return data;
}

async function createMailbox({ localPart, domain, password, name, quotaMb }) {
  // See official Mailcow API docs for full payload options.
  const payload = [
    {
      active: '1',
      domain,
      local_part: localPart,
      name: name || `${localPart}@${domain}`,
      password,
      password2: password,
      quota: typeof quotaMb === 'number' ? quotaMb * 1024 : 2048, // quota in MB * 1024 → KB
      force_pw_update: '0'
    }
  ];

  const { data } = await client.post('/api/v1/add/mailbox', payload);
  return data;
}

async function deleteMailbox(emailAddress) {
  const payload = [emailAddress];
  const { data } = await client.post('/api/v1/delete/mailbox', payload);
  return data;
}

async function resetMailboxPassword(emailAddress, newPassword) {
  const payload = [
    {
      attr: {
        password: newPassword,
        password2: newPassword
      },
      items: [emailAddress]
    }
  ];

  const { data } = await client.post('/api/v1/edit/mailbox', payload);
  return data;
}

async function listDomains() {
  const { data } = await client.get('/api/v1/get/domain/all');
  return data;
}

module.exports = {
  listMailboxes,
  createMailbox,
  deleteMailbox,
  resetMailboxPassword,
  listDomains
};

