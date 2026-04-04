const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('sk_token') : null

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  })

  const data = await res.json()

  if (!res.ok) {
    // Token expired — clear and redirect to login
    if (res.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('sk_token')
      localStorage.removeItem('sk_refresh_token')
      window.location.href = '/login'
    }
    throw new Error(data.error || 'Request failed')
  }

  return data
}

export const api = {
  get:    <T>(url: string)                => request<T>(url),
  post:   <T>(url: string, body: unknown) => request<T>(url, { method: 'POST',   body: JSON.stringify(body) }),
  patch:  <T>(url: string, body: unknown) => request<T>(url, { method: 'PATCH',  body: JSON.stringify(body) }),
  put:    <T>(url: string, body: unknown) => request<T>(url, { method: 'PUT',    body: JSON.stringify(body) }),
  delete: <T>(url: string)               => request<T>(url, { method: 'DELETE' }),
}
