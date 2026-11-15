import axios from 'axios'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api' })

export async function fetchAccounts(idToken) {
  const response = await api.get('/accounts', {
    headers: { Authorization: `Bearer ${idToken}` },
  })
  return response.data.accounts
}

export async function submitOrder(order, idToken) {
  const response = await api.post('/orders', order, {
    headers: { Authorization: `Bearer ${idToken}` },
  })
  return response.data
}
