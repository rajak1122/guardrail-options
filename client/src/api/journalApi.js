import axios from 'axios'

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api' })

export async function fetchJournal(idToken) {
  const response = await api.get('/journal', {
    headers: { Authorization: `Bearer ${idToken}` },
  })
  return response.data.trades
}
