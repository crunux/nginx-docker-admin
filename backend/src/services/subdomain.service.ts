import { $ } from 'bun'
import fs from 'fs/promises'
import path from 'path'
import {
  mapSystemError,
  SiteNotFoundError,
  SiteAlreadyExistsError,
} from '../utils/errors'

const SITES_AVAILABLE = '/etc/nginx/sites-available'
const SITES_ENABLED   = '/etc/nginx/sites-enabled'

export interface Subdomain {
  name:        string
  subdomain:   string
  domain:      string
  fullDomain:  string
  port:        number
  enabled:     boolean
  hasSSL:      boolean
  config:      string
}

export const subdomainService = {
  // Detecta si un site es un subdominio (tiene más de un punto en server_name)
  isSubdomain(config: string): boolean {
    const match = config.match(/server_name\s+([^;]+);/)
    if (!match || !match[1]) return false
    const serverName = match[1].trim()
    return serverName.split('.').length > 2
  },

  parseSubdomain(config: string): { subdomain: string; domain: string } | null {
    const match = config.match(/server_name\s+([^;]+);/)
    if (!match || !match[1]) return null
    const parts = match[1].trim().split('.')
    if (parts.length < 3) return null
    return {
      subdomain: parts[0]!,
      domain:    parts.slice(1).join('.'),
    }
  },

  async listSubdomains(): Promise<Subdomain[]> {
    try {
      const files = await fs.readdir(SITES_AVAILABLE)
      const results: Subdomain[] = []

      for (const name of files) {
        const config  = await Bun.file(path.join(SITES_AVAILABLE, name)).text()
        const parsed  = this.parseSubdomain(config)
        if (!parsed) continue

        const enabled = await Bun.file(path.join(SITES_ENABLED, name)).exists()
        const hasSSL  = config.includes('ssl_certificate')

        results.push({
          name,
          subdomain:  parsed.subdomain,
          domain:     parsed.domain,
          fullDomain: `${parsed.subdomain}.${parsed.domain}`,
          port:       parseInt(config.match(/proxy_pass\s+http:\/\/localhost:(\d+)/)?.[1] || '3000'),
          enabled,
          hasSSL,
          config,
        })
      }

      return results
    } catch (err) {
      throw mapSystemError(err, SITES_AVAILABLE)
    }
  },

  async createSubdomain(
    name:      string,
    subdomain: string,
    domain:    string,
    port:      number
  ): Promise<void> {
    try {
      const exists = await Bun.file(path.join(SITES_AVAILABLE, name)).exists()
      if (exists) throw new SiteAlreadyExistsError(name)

      const fullDomain = `${subdomain}.${domain}`
      await Bun.write(
        path.join(SITES_AVAILABLE, name),
        generateSubdomainConfig(fullDomain, port)
      )
    } catch (err) {
      throw mapSystemError(err, name)
    }
  },

  async updateSubdomain(name: string, port: number): Promise<void> {
    try {
      const filePath = path.join(SITES_AVAILABLE, name)
      const exists   = await Bun.file(filePath).exists()
      if (!exists) throw new SiteNotFoundError(name)

      let config = await Bun.file(filePath).text()
      // Actualizar solo el puerto
      config = config.replace(
        /proxy_pass\s+http:\/\/localhost:\d+/,
        `proxy_pass http://localhost:${port}`
      )
      await Bun.write(filePath, config)
      await $`nginx -s reload`
    } catch (err) {
      throw mapSystemError(err, name)
    }
  },

  async enableSubdomain(name: string): Promise<void> {
    try {
      const exists = await Bun.file(path.join(SITES_AVAILABLE, name)).exists()
      if (!exists) throw new SiteNotFoundError(name)

      await $`ln -sf ${SITES_AVAILABLE}/${name} ${SITES_ENABLED}/${name}`
      await $`nginx -s reload`
    } catch (err) {
      throw mapSystemError(err, name)
    }
  },

  async disableSubdomain(name: string): Promise<void> {
    try {
      await fs.unlink(path.join(SITES_ENABLED, name)).catch(() => {})
      await $`nginx -s reload`
    } catch (err) {
      throw mapSystemError(err, name)
    }
  },

  async deleteSubdomain(name: string): Promise<void> {
    try {
      await this.disableSubdomain(name)
      await fs.unlink(path.join(SITES_AVAILABLE, name))
    } catch (err) {
      throw mapSystemError(err, name)
    }
  },
}

function generateSubdomainConfig(fullDomain: string, port: number): string {
  return `server {
    listen 80;
    server_name ${fullDomain};

    location / {
        proxy_pass          http://localhost:${port};
        proxy_http_version  1.1;
        proxy_set_header    Upgrade $http_upgrade;
        proxy_set_header    Connection 'upgrade';
        proxy_set_header    Host $host;
        proxy_set_header    X-Real-IP $remote_addr;
        proxy_set_header    X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header    X-Forwarded-Proto $scheme;
        proxy_cache_bypass  $http_upgrade;
    }
}`
}