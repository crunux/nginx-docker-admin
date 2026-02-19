module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // Nueva funcionalidad
        'fix',      // Bugfix
        'docs',     // Cambios en documentación
        'style',    // Formato (no afecta lógica)
        'refactor', // Refactorización
        'perf',     // Mejora de performance
        'test',     // Tests
        'chore',    // Tareas (deps, build, etc)
        'ci',       // Cambios en CI/CD
        'revert',   // Revertir commit
      ],
    ],
    'scope-enum': [
      2,
      'always',
      [
        'auth',       // Autenticación
        'nginx',      // Gestión Nginx
        'docker',     // Gestión Docker
        'ssl',        // Certificados SSL
        'subdomain',  // Subdominios
        'websocket',  // WebSockets
        'system',     // Monitor sistema
        'ui',         // Frontend general
        'api',        // Backend general
        'deps',       // Dependencias
        'build',      // Configuración de build
        'ci',         // Configuración CI/CD
        'docs',       // Documentación
        'config',     // Configuración general
        'tools',      // Herramientas de sistema server
        'release',    // Cambios relacionados con el proceso de release
      ],
    ],
    'subject-case': [0],  // No forzar case
    'header-max-length': [2, 'always', 100],
  },
};