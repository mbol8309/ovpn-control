const express = require('express');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());

const OVPN_SCRIPT = '/home/mbolivar/openvpn-install.sh';
const OVPN_DIR = '/home/mbolivar';
const STATUS_LOG = '/etc/openvpn/server/openvpn-status.log';

// Parse connected clients from openvpn-status.log
function getConnectedClients() {
  const connected = new Set();
  try {
    const output = execSync(`sudo cat ${STATUS_LOG}`, { encoding: 'utf8' });
    const lines = output.split('\n');
    let inClientSection = false;
    for (const line of lines) {
      if (line.startsWith('Common Name,') || line.startsWith('CLIENT_LIST')) {
        inClientSection = true;
        continue;
      }
      if (line.startsWith('ROUTING_TABLE') || line.startsWith('GLOBAL_STATS') || line.startsWith('END')) {
        inClientSection = false;
        continue;
      }
      if (inClientSection && line.trim()) {
        // Format: Common Name,Real Address,Bytes Received,...
        const parts = line.split(',');
        if (parts.length > 1) {
          const name = parts[0].trim();
          if (name && name !== 'Common Name') connected.add(name);
        }
        // OpenVPN 2.5+ format: CLIENT_LIST,name,addr,...
        if (line.startsWith('CLIENT_LIST,')) {
          const parts2 = line.split(',');
          if (parts2[1]) connected.add(parts2[1].trim());
        }
      }
    }
  } catch (e) {
    // log not readable or doesn't exist
  }
  return connected;
}

// List all VPN users by parsing the script output
function listUsers() {
  try {
    const output = execSync(`sudo bash ${OVPN_SCRIPT} client list`, {
      encoding: 'utf8',
      timeout: 15000
    });
    return output;
  } catch (e) {
    return (e.stdout || '') + (e.stderr || '');
  }
}

// Parse user list output into structured data
function parseUsers(rawOutput) {
  const users = [];
  const connected = getConnectedClients();
  const lines = rawOutput.split('\n');

  // Try to find lines with user info — typical formats vary by script
  // Common format: "username  VALID  2025-01-01" or just "username"
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.toLowerCase().includes('client') && trimmed.includes(':')) continue;

    // Match patterns like: "  1) username" or "username VALID 2025-..." or just "username"
    const numbered = trimmed.match(/^\d+\)\s+(.+)$/);
    const withStatus = trimmed.match(/^(\S+)\s+(VALID|REVOKED|valid|revoked)\s*(.*)$/i);
    const plain = trimmed.match(/^([a-zA-Z0-9_-]+)$/);

    let name, status, expiry;

    if (numbered) {
      name = numbered[1].trim();
      status = 'valid';
      expiry = null;
    } else if (withStatus) {
      name = withStatus[1];
      status = withStatus[2].toLowerCase();
      expiry = withStatus[3]?.trim() || null;
    } else if (plain) {
      name = plain[1];
      status = 'valid';
      expiry = null;
    } else {
      continue;
    }

    // Skip if name looks like a header/command output noise
    if (['select', 'enter', 'client', 'clients', 'option', 'exit', 'quit', 'name'].includes(name.toLowerCase())) continue;

    users.push({
      name,
      status,
      expiry: expiry || null,
      connected: connected.has(name)
    });
  }

  return users;
}

// GET /api/users
app.get('/api/users', (req, res) => {
  try {
    const raw = listUsers();
    const users = parseUsers(raw);
    res.json({ users, raw });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users — create user and return .ovpn file
app.post('/api/users', (req, res) => {
  const { name } = req.body;

  if (!name || !/^[a-zA-Z0-9_-]+$/.test(name)) {
    return res.status(400).json({ error: 'Nombre inválido. Solo letras, números, guiones y guiones bajos.' });
  }

  const ovpnPath = path.join(OVPN_DIR, `${name}.ovpn`);

  // Check if already exists
  if (fs.existsSync(ovpnPath)) {
    return res.status(409).json({ error: `El usuario "${name}" ya existe.` });
  }

  try {
    execSync(`sudo bash ${OVPN_SCRIPT} client add ${name}`, {
      encoding: 'utf8',
      timeout: 30000
    });
  } catch (err) {
    return res.status(500).json({ error: `Error creando usuario: ${err.message}` });
  }

  // Wait a moment for file to be written
  if (!fs.existsSync(ovpnPath)) {
    return res.status(500).json({ error: 'Usuario creado pero no se encontró el fichero .ovpn' });
  }

  res.setHeader('Content-Disposition', `attachment; filename="${name}.ovpn"`);
  res.setHeader('Content-Type', 'application/x-openvpn-profile');
  res.sendFile(ovpnPath);
});

// DELETE /api/users/:name — revoke user
app.delete('/api/users/:name', (req, res) => {
  const { name } = req.params;

  if (!name || !/^[a-zA-Z0-9_-]+$/.test(name)) {
    return res.status(400).json({ error: 'Nombre inválido.' });
  }

  try {
    execSync(`sudo bash ${OVPN_SCRIPT} client revoke ${name}`, {
      encoding: 'utf8',
      timeout: 30000
    });
    res.json({ ok: true, message: `Usuario "${name}" revocado.` });
  } catch (err) {
    res.status(500).json({ error: `Error revocando usuario: ${err.message}` });
  }
});

// GET /api/users/:name/download — download existing .ovpn
app.get('/api/users/:name/download', (req, res) => {
  const { name } = req.params;

  if (!name || !/^[a-zA-Z0-9_-]+$/.test(name)) {
    return res.status(400).json({ error: 'Nombre inválido.' });
  }

  const ovpnPath = path.join(OVPN_DIR, `${name}.ovpn`);

  if (!fs.existsSync(ovpnPath)) {
    return res.status(404).json({ error: `No se encontró el fichero .ovpn para "${name}".` });
  }

  res.setHeader('Content-Disposition', `attachment; filename="${name}.ovpn"`);
  res.setHeader('Content-Type', 'application/x-openvpn-profile');
  res.sendFile(ovpnPath);
});

// Serve React frontend in production
const clientDist = path.join(__dirname, 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`ovpn-control server running on http://localhost:${PORT}`);
});
