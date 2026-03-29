import { useState, useEffect, useCallback } from 'react'
import UserList from './components/UserList.jsx'
import AddUser from './components/AddUser.jsx'

export default function App() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/users')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error cargando usuarios')
      setUsers(data.users || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const showSuccess = (msg) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 4000)
  }

  const handleAdd = async (name) => {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Error creando usuario')
    }

    // Trigger download
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${name}.ovpn`
    a.click()
    URL.revokeObjectURL(url)

    showSuccess(`Usuario "${name}" creado y .ovpn descargado.`)
    fetchUsers()
  }

  const handleDelete = async (name) => {
    const res = await fetch(`/api/users/${name}`, { method: 'DELETE' })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Error revocando usuario')
    showSuccess(`Usuario "${name}" revocado correctamente.`)
    fetchUsers()
  }

  const handleDownload = async (name) => {
    const res = await fetch(`/api/users/${name}/download`)
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Error descargando fichero')
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${name}.ovpn`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-black font-bold text-sm">VPN</div>
          <h1 className="text-xl font-bold text-white">OVPN Control</h1>
          <span className="ml-auto text-sm text-gray-500">Raspberry Pi Manager</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {error && (
          <div className="bg-red-900/40 border border-red-700 text-red-300 px-4 py-3 rounded-lg flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}
        {successMsg && (
          <div className="bg-green-900/40 border border-green-700 text-green-300 px-4 py-3 rounded-lg flex items-center gap-2">
            <span>✅</span> {successMsg}
          </div>
        )}

        <AddUser onAdd={handleAdd} />

        <div className="bg-gray-900 rounded-xl border border-gray-800">
          <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="font-semibold text-white">Usuarios VPN</h2>
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              {loading ? '⟳ Cargando...' : '↻ Actualizar'}
            </button>
          </div>
          <UserList
            users={users}
            loading={loading}
            onDelete={handleDelete}
            onDownload={handleDownload}
          />
        </div>
      </main>
    </div>
  )
}
