# ovpn-control

App web para gestionar usuarios de OpenVPN en una Raspberry Pi. Backend en Node.js/Express + Frontend en React/Vite con TailwindCSS.

## Requisitos

- Node.js v18+
- El usuario que ejecuta la app debe tener `sudo` sin contraseña para los comandos de OpenVPN
- Script `/home/mbolivar/openvpn-install.sh` instalado y funcional

## Instalación

```bash
cd /home/mbolivar/Projects/ovpn-control

# Instalar dependencias del backend
npm install

# Construir el frontend
npm run build
```

## Arrancar en producción

```bash
npm start
# → Servidor en http://localhost:3000
```

El servidor Express servirá tanto la API como el frontend estático desde `client/dist/`.

## Desarrollo (hot reload)

```bash
# Terminal 1 — backend
npm start

# Terminal 2 — frontend (con proxy al backend)
cd client
npm install
npm run dev
# → Frontend en http://localhost:5173 (con proxy a :3000)
```

## Estructura

```
ovpn-control/
├── package.json        # Scripts raíz: start, build
├── server.js           # Express API + servir frontend
├── client/             # React app (Vite + TailwindCSS)
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       └── components/
│           ├── UserList.jsx
│           ├── AddUser.jsx
│           └── UserCard.jsx
└── README.md
```

## API

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/users` | Lista todos los usuarios con estado y conexión |
| POST | `/api/users` | Crea usuario, devuelve fichero .ovpn |
| DELETE | `/api/users/:name` | Revoca un usuario |
| GET | `/api/users/:name/download` | Descarga el .ovpn existente |

## Sudoers

El proceso node necesita ejecutar comandos con sudo sin contraseña. Añade a `/etc/sudoers` (con `visudo`):

```
mbolivar ALL=(ALL) NOPASSWD: /bin/bash /home/mbolivar/openvpn-install.sh *
mbolivar ALL=(ALL) NOPASSWD: /bin/cat /etc/openvpn/server/openvpn-status.log
```

O más permisivo (solo si confías en el entorno):
```
mbolivar ALL=(ALL) NOPASSWD: ALL
```

## Funcionalidades

- 📋 Lista de usuarios con estado (válido/revocado) y conexión en tiempo real
- ➕ Crear nuevo usuario (descarga automática del .ovpn)
- ⬇️ Descargar .ovpn de usuarios existentes
- 🗑️ Revocar usuarios (con confirmación de dos clics)
- 📱 Diseño responsive (móvil y escritorio)
- ⚡ Feedback visual con estados de carga y errores
