# Configuración de Semantic Release

Esta configuración automatiza el versionado y releases del proyecto usando Conventional Commits.

---

## 📦 Instalación

```bash
# En la raíz del proyecto
npm install

# Configurar husky (hooks de git)
npm install -D husky @commitlint/cli @commitlint/config-conventional
npx husky init
chmod +x .husky/commit-msg
```

---

## 🔧 Archivos generados

```
proyecto/
├── .releaserc.json           # Config de semantic-release
├── .github/
│   └── workflows/
│       └── release.yml       # GitHub Action para releases
├── commitlint.config.js      # Validación de commits
├── .husky/
│   └── commit-msg            # Hook para validar commits
├── package.json              # Dependencies + scripts
└── CHANGELOG.md              # Generado automáticamente
```

---

## 🚀 Workflow

### 1. Crear feature branch

```bash
git checkout main
git pull
git checkout -b feat/add-ssl-wildcard
```

### 2. Hacer commits convencionales

```bash
# Nueva funcionalidad
git commit -m "feat(ssl): add wildcard certificate support"

# Bugfix
git commit -m "fix(websocket): handle reconnection after token expiry"

# Documentación
git commit -m "docs: update SSL setup instructions"

# Breaking change (MAJOR version)
git commit -m "feat(api)!: change endpoint structure

BREAKING CHANGE: All /api/sites endpoints moved to /api/nginx/sites"
```

**El hook de husky validará automáticamente** que el mensaje siga el formato correcto.

### 3. Push y crear PR

```bash
git push origin feat/add-ssl-wildcard
```

Crear Pull Request en GitHub → revisar → aprobar → merge a `main`

### 4. Release automático

Cuando haces merge a `main`, GitHub Actions ejecuta `semantic-release` que:

1. ✅ Analiza commits desde el último release
2. ✅ Decide el nuevo número de versión:
   - `fix:` → PATCH (1.0.0 → 1.0.1)
   - `feat:` → MINOR (1.0.0 → 1.1.0)
   - `BREAKING CHANGE:` → MAJOR (1.0.0 → 2.0.0)
3. ✅ Genera `CHANGELOG.md`
4. ✅ Crea tag (v1.1.0)
5. ✅ Crea GitHub Release con notas
6. ✅ Commitea el CHANGELOG a main

---

## 📝 Formato de commits

```
<type>(<scope>): <subject>

[body]

[footer]
```

### Types permitidos

| Type | Descripción | Bump |
|------|-------------|------|
| `feat` | Nueva funcionalidad | MINOR |
| `fix` | Bugfix | PATCH |
| `docs` | Solo documentación | - |
| `style` | Formato (no lógica) | - |
| `refactor` | Refactorización | - |
| `perf` | Performance | PATCH |
| `test` | Tests | - |
| `chore` | Deps, build, etc | - |
| `ci` | CI/CD changes | - |

### Scopes definidos

- `auth` — Autenticación
- `nginx` — Gestión Nginx
- `docker` — Gestión Docker
- `ssl` — Certificados SSL
- `subdomain` — Subdominios
- `websocket` — WebSockets
- `system` — Monitor sistema
- `ui` — Frontend
- `api` — Backend
- `deps` — Dependencias

### Ejemplos válidos

```bash
✅ feat(docker): add container stats dashboard
✅ fix(auth): handle expired JWT tokens
✅ docs: update installation guide
✅ chore(deps): upgrade nuxt to 3.15.0
✅ feat(ssl)!: change certbot integration

BREAKING CHANGE: Manual SSL config no longer supported
```

### Ejemplos inválidos

```bash
❌ Add new feature              # No type
❌ feat add feature              # Falta :
❌ feature(docker): add stats   # Type incorrecto
❌ feat(random): add thing      # Scope no definido
```

---

## 🏷️ Versionado Semántico

```
MAJOR.MINOR.PATCH
  2  .  1  .  3

2 → Breaking changes (incompatible)
1 → Nuevas features (compatible)
3 → Bugfixes (compatible)
```

### Historia de ejemplo

```
v1.0.0  → feat: initial release
v1.0.1  → fix: corrección en login
v1.1.0  → feat: añadir dashboard Docker
v1.1.1  → fix: bug en WebSocket reconnect
v1.2.0  → feat: añadir subdominios
v2.0.0  → feat!: cambiar estructura de API (BREAKING)
```

---

## 🔍 Ver releases

```bash
# Tags locales
git tag

# Ver info de un tag
git show v1.2.0

# Releases en GitHub
https://github.com/tuusuario/nginx-admin/releases
```

---

## 🛠️ Comandos útiles

```bash
# Validar commit message manualmente
echo "feat(docker): add stats" | npx commitlint

# Ver qué versión generaría (dry-run)
npx semantic-release --dry-run

# Generar CHANGELOG local (sin release)
npx conventional-changelog-cli -p angular -i CHANGELOG.md -s

# Forzar versión específica (emergencias)
git tag v1.5.0
git push origin v1.5.0
```

---

## ⚠️ Troubleshooting

### "No release published"

Significa que no hubo commits de `feat` o `fix` desde el último release. Solo `docs`, `chore`, etc no generan versiones.

### Hook de husky no funciona

```bash
chmod +x .husky/commit-msg
```

### Quiero saltarme la validación (emergencia)

```bash
git commit -m "emergency fix" --no-verify
```

### El Action falla con permisos

Verifica en GitHub:
- Settings → Actions → General → Workflow permissions
- Marcar "Read and write permissions"

---

## 📚 Referencias

- [Semantic Release](https://semantic-release.gitbook.io/)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Commitlint](https://commitlint.js.org/)
- [SemVer](https://semver.org/)