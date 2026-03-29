import UserCard from './UserCard.jsx'

export default function UserList({ users, loading, onDelete, onDownload }) {
  if (loading) {
    return (
      <div className="px-6 py-12 text-center text-gray-500">
        <svg className="animate-spin w-8 h-8 mx-auto mb-3 text-green-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        Cargando usuarios...
      </div>
    )
  }

  if (!users || users.length === 0) {
    return (
      <div className="px-6 py-12 text-center text-gray-500">
        <div className="text-4xl mb-3">👤</div>
        <p>No hay usuarios VPN registrados.</p>
        <p className="text-sm mt-1 text-gray-600">Crea el primero usando el formulario de arriba.</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-800">
      {/* Header row - desktop */}
      <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
        <span>Usuario</span>
        <span className="text-center">Estado</span>
        <span className="text-center">Conexión</span>
        <span className="text-center">Expiración</span>
        <span className="text-center">Acciones</span>
      </div>
      {users.map((user) => (
        <UserCard
          key={user.name}
          user={user}
          onDelete={onDelete}
          onDownload={onDownload}
        />
      ))}
    </div>
  )
}
