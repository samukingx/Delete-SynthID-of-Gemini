import { useState, useEffect } from 'react'
import type { User } from '../types'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: Verificar token y cargar usuario
    const token = localStorage.getItem('token')
    if (token) {
      // Cargar usuario desde el token
    }
    setLoading(false)
  }, [])

  const login = async (_email: string, _password: string) => {
    // TODO: Implementar login
    return { success: false }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  return {
    user,
    loading,
    login,
    logout,
  }
}

