import { useState } from 'react'

export default function UserCard({ user, onDelete, onDownload }) {
  const [deleting, setDeleting] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [deleteError, setDeleteError] = useState(null)
  const [downloadError, setDownloadError] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
      return
    }
    setDeleting(true)
    setDeleteError(null)
    try {
      await onDelete(user.name)
    } catch (err) {
      setDeleteError(err.message)
      setDeleting(false)
    }
    setConfirmDelete(false)
  }

  const handleDownload = async () => {
    setDownloading(true)
    setDownloadError(null)
    try {
      await onDownload(user.name)
    } catch (err) {
      setDownloadError(err.message)
    } finally {
      setDownloading(false)
    }
  }

  const isRevoked = user.status === 'revoked'

  return (
    <div className="px-6 py-4">
      {/* Mobile layout */}
      <div className="sm:hidden space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium text-white">{user.name}</span>
          <div className="flex items-center gap-2">
            {isRevoked ? (
              <span className="text-xs bg-red-900/50 text-red-400 border border-red-800 px-2 py-0.5 rounded-full">❌ Revocado</span>
            ) : (
              <span className="text-xs bg-green-900/50 text-green-400 border border-green-800 px-2 py-0.5 rounded-full">✅ Válido</span>
            )}
            <span className={`text-xs px-2 py-0.5 rounded-full border ${user.connected ? 'bg-emerald-900/50 text-emerald-400 border-emerald-800' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>
              {user.connected ? '🟢 Online' : '🔴 Offline'}
            </span>
          </div>
        </div>
        {user.expiry && <p className="text-xs text-gray-500">Expira: {user.expiry}</p>}
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleDownload}
            disabled={downloading || isRevoked}
            className="flex-1 text-xs bg-blue-900/40 hover:bg-blue-800/60 disabled:opacity-40 text-blue-400 border border-blue-800 px-3 py-1.5 rounded-lg transition-colors"
          >
            {downloading ? '⟳ Descargando...' : '⬇ Descargar .ovpn'}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting || isRevoked}
            className={`flex-1 text-xs px-3 py-1.5 rounded-lg transition-colors border ${
              confirmDelete
                ? 'bg-red-700 hover:bg-red-600 text-white border-red-600'
                : 'bg-red-900/40 hover:bg-red-800/60 disabled:opacity-40 text-red-400 border-red-800'
            }`}
          >
            {deleting ? '⟳ Revocando...' : confirmDelete ? '⚠ ¿Confirmar?' : '🗑 Eliminar'}
          </button>
        </div>
      </div>

      {/* Desktop layout */}
      <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center">
        <span className={`font-medium ${isRevoked ? 'text-gray-500 line-through' : 'text-white'}`}>{user.name}</span>

        <div className="text-center">
          {isRevoked ? (
            <span className="text-xs bg-red-900/50 text-red-400 border border-red-800 px-2 py-1 rounded-full">❌ Revocado</span>
          ) : (
            <span className="text-xs bg-green-900/50 text-green-400 border border-green-800 px-2 py-1 rounded-full">✅ Válido</span>
          )}
        </div>

        <div className="text-center">
          <span className={`text-xs px-2 py-1 rounded-full border ${user.connected ? 'bg-emerald-900/50 text-emerald-400 border-emerald-800' : 'bg-gray-800 text-gray-500 border-gray-700'}`}>
            {user.connected ? '🟢 Conectado' : '🔴 Desconectado'}
          </span>
        </div>

        <div className="text-center text-xs text-gray-500 min-w-[100px]">
          {user.expiry || <span className="text-gray-700">—</span>}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            disabled={downloading || isRevoked}
            title="Descargar fichero .ovpn"
            className="text-xs bg-blue-900/40 hover:bg-blue-800/60 disabled:opacity-40 text-blue-400 border border-blue-800 px-3 py-1.5 rounded-lg transition-colors"
          >
            {downloading ? '⟳' : '⬇ .ovpn'}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting || isRevoked}
            title={confirmDelete ? 'Haz clic de nuevo para confirmar' : 'Revocar usuario'}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors border ${
              confirmDelete
                ? 'bg-red-700 hover:bg-red-600 text-white border-red-600 animate-pulse'
                : 'bg-red-900/40 hover:bg-red-800/60 disabled:opacity-40 text-red-400 border-red-800'
            }`}
          >
            {deleting ? '⟳' : confirmDelete ? '¿Confirmar?' : '🗑 Eliminar'}
          </button>
        </div>
      </div>

      {(deleteError || downloadError) && (
        <p className="mt-2 text-xs text-red-400">{deleteError || downloadError}</p>
      )}
    </div>
  )
}
