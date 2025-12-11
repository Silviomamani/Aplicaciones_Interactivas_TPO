import { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Input from '../components/Input.jsx'
import Button from '../components/Button.jsx'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const newErrors = {}
    if (!email.trim()) {
      newErrors.email = 'El email es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'El email no es válido'
    }
    if (!password) {
      newErrors.password = 'La contraseña es requerida'
    } else if (password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    
    setErrors({})
    setLoading(true)
    try {
      await login(email, password)
      const dest = location.state?.from?.pathname || '/dashboard'
      navigate(dest, { replace: true })
    } catch (err) {
      setErrors({ general: err.response?.data?.message || 'Credenciales inválidas' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-logo">
          <h1 className="auth-title">Gestor de Tareas</h1>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <Input 
            label="Email" 
            type="email" 
            value={email} 
            onChange={(e) => {
              setEmail(e.target.value)
              if (errors.email) setErrors({ ...errors, email: '' })
            }}
            error={errors.email}
            required 
            autoComplete="email"
          />
          <div className="field">
            <div className="field-label">Contraseña</div>
            <div className="password-input-wrapper">
              <input 
                className={`field-input${errors.password ? ' has-error' : ''}`}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (errors.password) setErrors({ ...errors, password: '' })
                }}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            {errors.password && <div className="field-error">{errors.password}</div>}
          </div>
          {errors.general && <div className="field-error" style={{ marginTop: 8 }}>{errors.general}</div>}
          <Button type="submit" disabled={loading} className="btn-full-width">
            {loading ? 'Ingresando...' : 'Ingresar'}
          </Button>
        </form>
        <div className="auth-alt">¿No tenés cuenta? <Link to="/register">Registrate</Link></div>
      </div>
    </div>
  )
}


