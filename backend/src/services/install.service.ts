import { $ } from 'bun'
import si from 'systeminformation'
import { getInstallCommand, isCertbotInstalled, isDockerComposeInstalled, isDockerInstalled, isNginxInstalled } from '../utils/package-manager'
import { AppError } from '../utils/errors'
import { mapSystemError } from '../utils/errors'

// Verificar si un binario está instalado
const isBinaryInstalled = async (binary: string): Promise<boolean> => {
  const result = await $`which ${binary}`.nothrow()
  return result.exitCode === 0
}

// Ejecutar comando de instalación
const runInstall = async (cmd: string[]): Promise<void> => {
  // En Linux necesita apt-get update antes de instalar
  if (cmd[0] === 'apt-get') {
    await $`apt-get update -qq`.nothrow()
  }

  const result = await Bun.spawn(cmd, {
    stdout: 'pipe',
    stderr: 'pipe',
    stdin: 'inherit',
  })

  const exitCode = await result.exited
  if (exitCode !== 0) {
    const err = await new Response(result.stderr).text()
    throw new AppError(`Error instalando: ${err}`, 500, 'INSTALL_FAILED')
  }
}

export const installService = {
  async installPackage(pkg: string): Promise<string> {
    const os = await si.osInfo()

    // Windows no soportado
    if (os.platform === 'win32') {
      throw new AppError(
        `Instalación automática no soportada en Windows. Instala ${pkg} manualmente.`,
        501,
        'UNSUPPORTED_PLATFORM'
      )
    }

    // Mac → Homebrew
    if (os.platform === 'darwin') {
      const hasBrew = await isBinaryInstalled('brew')
      if (!hasBrew) {
        throw new AppError(
          'Homebrew no está instalado. Visita https://brew.sh',
          503,
          'HOMEBREW_NOT_FOUND'
        )
      }
      await $`brew install ${pkg}`
      return `${pkg} instalado correctamente via Homebrew`
    }

    // Linux → detectar distro
    const cmd = await getInstallCommand(pkg)
    if (!cmd) {
      throw new AppError(
        `Distribución Linux no soportada. Instala ${pkg} manualmente.`,
        501,
        'UNSUPPORTED_DISTRO'
      )
    }

    await runInstall(cmd)
    return `${pkg} instalado correctamente`
  },

  async installNginx(): Promise<string> {
    try {
      // Si ya está instalado, no hacer nada
      if (await isBinaryInstalled('nginx')) {
        return 'Nginx ya está instalado'
      }

      return await this.installPackage('nginx')
    } catch (err) {
      throw mapSystemError(err, 'installNginx')
    }
  },

  async installCertbot(): Promise<string> {
    try {
      if (await isBinaryInstalled('certbot')) {
        return 'Certbot ya está instalado'
      }

      return await this.installPackage('certbot')
    } catch (err) {
      throw mapSystemError(err, 'installCertbot')
    }
  },

  async installDocker(): Promise<string> {

    try {
      if (await isBinaryInstalled('docker')) {
        // Verificar también que compose esté disponible
        const compose = await $`docker compose version`.nothrow()
        if (compose.exitCode === 0) {
          return 'Docker y Docker Compose ya están instalados'
        }
      }

      const os = await si.osInfo()

      if (os.platform === 'linux') {
        // Script oficial instala docker engine + compose plugin en un solo paso
        await $`curl -fsSL https://get.docker.com | sh`

        // Post-instalación: agregar usuario al grupo docker
        const whoami = await $`whoami`.text()
        const user   = whoami.trim()
        if (user !== 'root') {
          await $`usermod -aG docker ${user}`.nothrow()
        }

        return 'Docker y Docker Compose instalados correctamente'
      }

      if (os.platform === 'darwin') {
        // En Mac instala Docker Desktop que incluye compose
        await $`brew install --cask docker`
        return 'Docker Desktop instalado correctamente (incluye Docker Compose)'
      }

      throw new AppError(
        'Plataforma no soportada para instalación automática de Docker',
        501,
        'UNSUPPORTED_PLATFORM'
      )
    } catch (err) {
      throw mapSystemError(err, 'installDocker')
    }
  },

  // async installDocker(): Promise<string> {
  //   try {
  //     if (await isBinaryInstalled('docker')) {
  //       return 'Docker ya está instalado'
  //     }

  //     // Docker tiene script oficial de instalación
  //     const os = await si.osInfo()
  //     if (os.platform === 'linux') {
  //       await $`curl -fsSL https://get.docker.com | sh`
  //       return 'Docker instalado correctamente'
  //     }

  //     return await this.installPackage('docker')
  //   } catch (err) {
  //     throw mapSystemError(err, 'installDocker')
  //   }
  // },

  // Verificar todas las dependencias de una vez
  async checkDependencies(): Promise<{
    nginx:         { installed: boolean; version?: string }
    certbot:       { installed: boolean; version?: string }
    docker:        { installed: boolean; version?: string }
    dockerCompose: { installed: boolean; version?: string }
  }> {
    const [nginx, certbot, docker, dockerCompose] = await Promise.all([
      isNginxInstalled(),
      isCertbotInstalled(),
      isDockerInstalled(),
      isDockerComposeInstalled(),
    ])

    
    return {
      nginx:   { 
        installed: nginx.installed,   
        version:   nginx.version   
      },
      certbot: { 
        installed: certbot.installed, 
        version:   certbot.version 

      },
      docker: { 
        installed: docker.installed,  
        version:   docker.version  
      },
      // docker compose viene incluido si docker está instalado
      dockerCompose: { 
        installed: dockerCompose.installed,
        version:   dockerCompose.version
      },
    }
  },
}