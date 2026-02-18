import { $ } from "bun"

const DISTRO_COMMANDS: Record<string, (pkg: string) => string[]> = {
  ubuntu:  (pkg) => ['apt-get', 'install', '-y', pkg],
  debian:  (pkg) => ['apt-get', 'install', '-y', pkg],
  alpine:  (pkg) => ['apk', 'add', '--no-cache', pkg],
  fedora:  (pkg) => ['dnf', 'install', '-y', pkg],
  centos:  (pkg) => ['dnf', 'install', '-y', pkg],
  arch:    (pkg) => ['pacman', '-S', '--noconfirm', pkg],
  amazon:  (pkg) => ['yum', 'install', '-y', pkg],
  rhel:    (pkg) => ['dnf', 'install', '-y', pkg],
  opensuse:(pkg) => ['zypper', 'install', '-y', pkg],
}

// Parsear /etc/os-release a un objeto
const parseOsRelease = (content: string): Record<string, string> => {
  return Object.fromEntries(
    content
      .split('\n')
      .filter(Boolean)
      .map(line => line.split('=').map(s => s.replace(/"/g, '').trim()))
      .filter(parts => parts.length === 2)
  )
}

// Detectar distro desde os-release
export const detectDistro = async (): Promise<string | null> => {
  try {
    const content = await Bun.file('/etc/os-release').text()
    const info    = parseOsRelease(content)
    // ID_LIKE como fallback (ej: mint tiene ID=mint pero ID_LIKE=ubuntu)
    const id      = info['ID']?.toLowerCase() || info['ID_LIKE']?.toLowerCase()
    return id ?? null
  } catch {
    return null
  }
}

// Obtener comando según distro
export const getInstallCommand = async (pkg: string): Promise<string[] | null> => {
  const distro = await detectDistro()
  if (!distro) return null

  // Buscar coincidencia exacta o parcial (ej: "ubuntu 22.04" contiene "ubuntu")
  const match = Object.keys(DISTRO_COMMANDS).find(d => distro.includes(d))
  if (!match) return null

  return DISTRO_COMMANDS[match]!(pkg)
}

// backend/src/utils/packageManager.ts

const isBinaryInstalled = async (binary: string): Promise<boolean> => {
  // Intentar múltiples métodos de verificación
  const checks = await Promise.all([
    // 1. which — verifica si está en el PATH
    $`which ${binary}`.nothrow(),
    // 2. command -v — más portable que which
    $`command -v ${binary}`.nothrow(),
  ])

  // Al menos uno debe retornar exitCode 0 Y tener output
  return checks.some(r => r.exitCode === 0 && r.stdout.toString().trim().length > 0)
}

// Versión específica para nginx
export const isNginxInstalled = async (): Promise<{ installed: boolean; version?: string }> => {
  const result = await $`nginx -v 2>&1`.nothrow()
  const output = result.stdout.toString() + result.stderr.toString()

  // nginx -v imprime en stderr: "nginx version: nginx/1.x.x"
  const installed = output.toLowerCase().includes('nginx version')
  return {
    installed,
    version: installed ? output.trim() : undefined,
  }
}

// Versión específica para certbot
export const isCertbotInstalled = async (): Promise<{ installed: boolean; version?: string }> => {
  const result = await $`certbot --version 2>&1`.nothrow()
  const output = result.stdout.toString() + result.stderr.toString()

  if (output.toLowerCase().includes('command not found') || output.toLowerCase().includes('not found')) {
    return { installed: false, version: undefined }
  }
  const installed = output.toLowerCase().includes('certbot')
  return {
    installed,
    version: installed ? output.trim() : undefined,
  }
}

// Versión específica para docker
export const isDockerInstalled = async (): Promise<{ installed: boolean; version?: string }> => {
  const result = await $`docker --version 2>&1`.nothrow()
  const output = result.stdout.toString().trim()

  const installed = output.toLowerCase().includes('docker version')
  return {
    installed,
    version: installed ? output : undefined,
  }
}

// Versión específica para docker compose
export const isDockerComposeInstalled = async (): Promise<{ installed: boolean; version?: string }> => {
  const result = await $`docker compose version 2>&1`.nothrow()
  const output = result.stdout.toString().trim()

  const installed = output.toLowerCase().includes('docker compose version')
  return {
    installed,
    version: installed ? output : undefined,
  }
}