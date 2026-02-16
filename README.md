# 🛡️ Nginx Docker Admin

Panel de administración web **self-hosted** para gestionar servidores Nginx, Docker, System Info desde el navegador. Construido con Nuxt 3, Express, Bun, elimina la necesidad de acceder al servidor por SSH para tareas rutinarias de configuración.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Bun](https://img.shields.io/badge/bun-1.x-orange)
![Nuxt](https://img.shields.io/badge/nuxt-3.x-green)
![License](https://img.shields.io/badge/license-MIT-purple)

---

## ✨ Características

- **Sitios Nginx** — Listar, crear, editar, activar y desactivar sitios
- **Subdominios** — Gestión completa con vista previa del dominio completo
- **SSL automático** — Emisión y renovación de certificados con Let's Encrypt (Certbot)
- **Docker** — Gestión de proyectos, contenedores, imágenes y estadísticas en tiempo real
- **Logs en tiempo real** — WebSockets para seguir Nginx, Docker, SSL y sistema en vivo
- **Monitor del sistema** — CPU, RAM, disco y red actualizados en tiempo real
- **Autenticación** — Login seguro con JWT y bcrypt

---

## 🧱 Stack

| Capa      | Tecnología                        |
|-----------|-----------------------------------|
| Frontend  | Nuxt 3 + Nuxt UI + Tailwind CSS   |
| Backend   | Bun + Express                     |
| Auth      | JWT + bcrypt                      |
| Tiempo real | WebSockets (Bun nativo)         |
| Sistema   | systeminformation                 |
| SSL       | Certbot / Let's Encrypt           |
| Deploy    | Docker + Docker Compose           |

---

## 📁 Estructura

```
nginx-admin/
├── frontend/                  # Nuxt 3
│   ├── pages/
│   │   └── dashboard/
│   │       ├── index.vue      # Monitor del sistema
│   │       ├── sites.vue      # Gestión de sitios
│   │       ├── subdomains.vue # Gestión de subdominios
│   │       ├── docker.vue     # Dashboard Docker
│   │       └── logs.vue       # Logs en tiempo real
│   ├── composables/
│   │   ├── useLogStream.ts    # WebSocket singleton
│   │   └── useApi.ts          # Cliente HTTP
│   └── types/
├── backend/                   # Bun + Express
│   └── src/
│       ├── routes/            # auth, sites, ssl, subdomains, docker, system
│       ├── services/          # nginx, ssl, docker, system, auth
│       ├── websocket/         # server.ts, logServer.ts
│       ├── middleware/        # auth, errorHandler
│       └── utils/             # errors.ts
├── docker-compose.yml
└── .env
```

---

## ⚙️ Requisitos

- **Servidor:** Ubuntu / Debian con Nginx instalado
- **Nginx:** `/etc/nginx/sites-available` y `/etc/nginx/sites-enabled`
- **Certbot:** Para emisión automática de SSL
- **Docker:** Para gestión de contenedores
- **Bun 1.x:** Para el backend
- **Node 20+:** Para el frontend

---

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/crunux/nginx-docker-admin.git
cd nginx-docker-admin
```

### 2. Configurar el entorno

```bash
cp .env.example .env
```

Editar `.env`:

```bash
# Auth
ADMIN_USER=admin
ADMIN_PASSWORD="cambiaresto"   # ver paso 3
JWT_SECRET=               # ver paso 3

# Rutas
PROJECTS_DIR=/var/www

# URLs
FRONTEND_URL=http://localhost:3000
NUXT_PUBLIC_API_URL=http://localhost:4000
NUXT_PUBLIC_WS_URL=ws://localhost:4001
```

### 3. Generar credenciales

```bash

# JWT Secret seguro
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Pegar los valores generados en el `.env`.

### 4. Levantar con Docker

```bash
docker compose up -d
```

### 5. Acceder

```
http://localhost:3000
```

---

## 🐳 Docker Compose

```yaml
services:
  backend:
    build: ./backend
    ports:
      - "4000:4000"   # API HTTP
      - "4001:4001"   # WebSocket
    volumes:
      - /etc/nginx:/etc/nginx
      - /etc/letsencrypt:/etc/letsencrypt
      - /var/www:/var/www
      - /var/run/docker.sock:/var/run/docker.sock
    network_mode: host

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
```

> ⚠️ `network_mode: host` es necesario en Linux para que el backend pueda ejecutar `nginx -s reload` y `certbot` directamente sobre el sistema host.

---

## 🔌 API Endpoints

### Auth
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/auth/login` | Obtener token JWT |

### Sitios
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/sites` | Listar sitios |
| POST | `/api/sites` | Crear sitio |
| PUT | `/api/sites/:name` | Actualizar configuración |
| DELETE | `/api/sites/:name` | Eliminar sitio |
| POST | `/api/sites/:name/enable` | Activar sitio |
| POST | `/api/sites/:name/disable` | Desactivar sitio |

### Subdominios
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/subdomains` | Listar subdominios |
| POST | `/api/subdomains` | Crear subdominio |
| PUT | `/api/subdomains/:name` | Actualizar puerto |
| DELETE | `/api/subdomains/:name` | Eliminar subdominio |
| POST | `/api/subdomains/:name/enable` | Activar |
| POST | `/api/subdomains/:name/disable` | Desactivar |
| POST | `/api/subdomains/:name/ssl` | Emitir certificado SSL |

### SSL
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/ssl` | Listar certificados |
| POST | `/api/ssl/issue` | Emitir certificado |
| POST | `/api/ssl/renew` | Renovar todos |
| DELETE | `/api/ssl/:domain` | Revocar certificado |

### Docker
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/docker/containers` | Listar contenedores |
| GET | `/api/docker/projects` | Listar proyectos |
| GET | `/api/docker/stats` | Estadísticas en tiempo real |
| GET | `/api/docker/images` | Listar imágenes |
| POST | `/api/docker/projects` | Desplegar proyecto |
| POST | `/api/docker/projects/:name/start` | Iniciar proyecto |
| POST | `/api/docker/projects/:name/stop` | Detener proyecto |
| POST | `/api/docker/containers/:id/restart` | Reiniciar contenedor |

### Sistema
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/system` | Info completa del sistema |
| GET | `/api/system/cpu` | Uso de CPU |
| GET | `/api/system/ram` | Uso de RAM |
| GET | `/api/system/disk` | Uso de disco |
| GET | `/api/system/network` | Estadísticas de red |

---

## 🔁 WebSocket

Conexión: `ws://localhost:4001?token=<JWT>`

### Topics disponibles

```typescript
// Logs de Nginx
{ action: 'subscribe', topic: 'nginx' }

// Logs de un proyecto Docker
{ action: 'subscribe', topic: 'docker:nombre-proyecto' }

// Logs de Certbot
{ action: 'subscribe', topic: 'certbot' }

// Logs del sistema (journalctl)
{ action: 'subscribe', topic: 'system' }

// Estadísticas del sistema en tiempo real
{ action: 'subscribe', topic: 'system:stats', interval: 2000 }

// Desuscribirse
{ action: 'unsubscribe' }
```

### Tipos de mensajes recibidos

```typescript
{ type: 'connected',    message: string }
{ type: 'subscribed',   topic: string }
{ type: 'log',          line: string, timestamp: string }
{ type: 'error',        line: string, timestamp: string }
{ type: 'stats',        data: SystemStats }
{ type: 'ended',        message: string }
```

---

## 🔐 Seguridad

- El backend **nunca debe exponerse** al exterior — solo accesible desde localhost o VPN
- Usar un **reverse proxy** (el propio Nginx) para servir el frontend con HTTPS
- El usuario del proceso debe tener **sudo limitado** solo a `nginx` y `certbot`

```bash
# /etc/sudoers.d/nginxadmin
nginxadmin ALL=(ALL) NOPASSWD: /usr/sbin/nginx, /usr/bin/certbot
```

---

## 🛠️ Desarrollo local

```bash
# Backend
cd backend
bun install
bun --watch src/index.ts

# Frontend
cd frontend
npm install
npm run dev
```

---

## 📝 Variables de entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `ADMIN_USER` | Usuario del panel | `admin` |
| `ADMIN_PASSWORD` | Contraseña del panel | cambiaresto |
| `JWT_SECRET` | Secret para firmar tokens | — |
| `PROJECTS_DIR` | Directorio de proyectos Docker | `/var/www` |
| `FRONTEND_URL` | URL del frontend (CORS) | `http://localhost:3000` |
| `NUXT_PUBLIC_API_URL` | URL de la API HTTP | `http://localhost:4000` |
| `NUXT_PUBLIC_WS_URL` | URL del WebSocket | `ws://localhost:4001` |

---

## 📄 Licencia

MIT © 2025 [Crunux](https://crunux.me)