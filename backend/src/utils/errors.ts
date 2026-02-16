
export class AppError extends Error {
  constructor(
    public override message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class NginxNotFoundError extends AppError {
  constructor(path: string) {
    super(`Nginx no encontrado: "${path}" no existe en este sistema`, 503, 'NGINX_NOT_FOUND')
  }
}

export class NginxNotInstalledError extends AppError {
  constructor() {
    super('Nginx no está instalado en este servidor', 503, 'NGINX_NOT_INSTALLED')
  }
}

export class SiteNotFoundError extends AppError {
  constructor(name: string) {
    super(`El sitio "${name}" no existe`, 404, 'SITE_NOT_FOUND')
  }
}

export class SiteAlreadyExistsError extends AppError {
  constructor(name: string) {
    super(`El sitio "${name}" ya existe`, 409, 'SITE_ALREADY_EXISTS')
  }
}

export class DockerNotFoundError extends AppError {
  constructor(name: string){
    super(`Docker no esta trabajando o instalado!`)
  }
}

// Mapea errores de sistema (ENOENT, EACCES, etc) a AppErrors
export const mapSystemError = (err: unknown, context?: string): AppError => {
  if (err instanceof AppError) return err

  const e = err as NodeJS.ErrnoException

  switch (e.code) {
    case 'ENOENT':
      return new NginxNotFoundError(e.path || context || 'ruta desconocida')

    case 'EACCES':
    case 'EPERM':
      return new AppError(
        `Sin permisos para acceder a "${e.path || context}". ¿Está corriendo como root?`,
        403,
        'PERMISSION_DENIED'
      )

    case 'EEXIST':
      return new AppError(
        `El archivo "${e.path || context}" ya existe`,
        409,
        'ALREADY_EXISTS'
      )

    default:
      return new AppError(
        e.message || 'Error desconocido del sistema',
        500,
        e.code || 'SYSTEM_ERROR'
      )
  }
}