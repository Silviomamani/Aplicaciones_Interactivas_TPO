import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api from '../api/client.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('tm_token')
    if (!token) {
      setLoading(false)
      return
    }
    ;(async () => {
      try {
        const res = await api.get('/auth/perfil')
        setUser(res.data?.data?.usuario)
      } catch (_) {
        localStorage.removeItem('tm_token')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const token = res.data?.data?.token
    if (token) localStorage.setItem('tm_token', token)
    const me = await api.get('/auth/perfil')
    setUser(me.data?.data?.usuario)
  }

  const register = async (payload) => {
    const res = await api.post('/auth/registro', payload)
    const token = res.data?.data?.token
    if (token) localStorage.setItem('tm_token', token)
    const me = await api.get('/auth/perfil')
    setUser(me.data?.data?.usuario)
  }

  const logout = () => {
    localStorage.removeItem('tm_token')
    setUser(null)
    window.location.href = '/login'
  }

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

