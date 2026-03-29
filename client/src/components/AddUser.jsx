import { useState } from 'react'

export default function AddUser({ onAdd }) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    const trimmed = name.trim()
    if (!trimmed) return setError('El nombre no puede estar vacío.')
    if (/\s/.test(trimmed)) return setError('El nombre no puede contener espacios.')
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) return setError('Solo se permiten letras, números, guiones y guiones bajos.')

    setLoading(true)
    try {
      await onAdd(trimmed)
      setName('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 px-6 py-5">
      <h2 className="font-semibold text-white mb-4">Nuevo usuario VPN</h2>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(null) }}
          placeholder="Nombre de usuario (sin espacios)"
          disabled={loading}
          className="flex-1 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="bg-green-600 hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors whitespace-nowrap"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Creando...
            </span>
          ) : '+ Crear usuario'}
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      <p className="mt-2 text-xs text-gray-600">Al crear el usuario se descargará automáticamente el fichero .ovpn.</p>
    </div>
  )
}
