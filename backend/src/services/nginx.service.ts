// backend/src/services/nginx.service.ts
import { $ } from 'bun'
import fs from 'fs/promises'
import path from 'path'
import {
  mapSystemError,
  SiteNotFoundError,
  SiteAlreadyExistsError,
  NginxNotInstalledError,
} from '../utils/errors'
import { OSPlatform } from '../config/os'

const SITES_AVAILABLE = '/etc/nginx/sites-available'
const SITES_ENABLED   = '/etc/nginx/sites-enabled'

export const nginxService = {
  async listSites() {
    try {
      const files = await fs.readdir(SITES_AVAILABLE)
      return Promise.all(
        files.map(async (name) => ({
          name,
          config:  await Bun.file(path.join(SITES_AVAILABLE, name)).text(),
          enabled: await Bun.file(path.join(SITES_ENABLED, name)).exists(),
        }))
      )
    } catch (err) {
      throw mapSystemError(err, SITES_AVAILABLE)
    }
  },

  async createSite(name: string, domain: string, port = 3000) {
    try {
      // Verificar que no exista
      const exists = await Bun.file(path.join(SITES_AVAILABLE, name)).exists()
      if (exists) throw new SiteAlreadyExistsError(name)

      await Bun.write(path.join(SITES_AVAILABLE, name), generateConfig(domain, port))
    } catch (err) {
      throw mapSystemError(err, SITES_AVAILABLE)
    }
  },

  async updateSite(name: string, config: string) {
    try {
      const exists = await Bun.file(path.join(SITES_AVAILABLE, name)).exists()
      if (!exists) throw new SiteNotFoundError(name)

      await Bun.write(path.join(SITES_AVAILABLE, name), config)
      await this.reload()
    } catch (err) {
      throw mapSystemError(err, name)
    }
  },

  async deleteSite(name: string) {
    try {
      const exists = await Bun.file(path.join(SITES_AVAILABLE, name)).exists()
      if (!exists) throw new SiteNotFoundError(name)

      await this.disableSite(name)
      await fs.unlink(path.join(SITES_AVAILABLE, name))
      await this.reload()
    } catch (err) {
      throw mapSystemError(err, name)
    }
  },

  async enableSite(name: string) {
    try {
      const exists = await Bun.file(path.join(SITES_AVAILABLE, name)).exists()
      if (!exists) throw new SiteNotFoundError(name)

      await $`ln -sf ${SITES_AVAILABLE}/${name} ${SITES_ENABLED}/${name}`
      await this.reload()
    } catch (err) {
      throw mapSystemError(err, name)
    }
  },

  async disableSite(name: string) {
    try {
      await fs.unlink(path.join(SITES_ENABLED, name)).catch(() => {})
      await this.reload()
    } catch (err) {
      throw mapSystemError(err, name)
    }
  },

  async reload() {
    try {
      await $`nginx -t`
      await $`nginx -s reload`
    } catch {
      throw new NginxNotInstalledError()
    }
  },

  async testConfig() {
    try {
      return await $`nginx -t 2>&1`.nothrow().text()
    } catch {
      throw new NginxNotInstalledError()
    }
  },

  async getSiteConfig(name: string) {
    try {
      const filePath = path.join(SITES_AVAILABLE, name)
      const exists = await Bun.file(filePath).exists()
      if (!exists) throw new SiteNotFoundError(name)

      return await Bun.file(filePath).text()
    } catch (err) {
      throw mapSystemError(err, name)
    }
  },
}

function generateConfig(domain: string, port: number): string {
  return `server {
    listen 80;
    server_name ${domain};

    location / {
        proxy_pass          http://localhost:${port};
        proxy_http_version  1.1;
        proxy_set_header    Upgrade $http_upgrade;
        proxy_set_header    Connection 'upgrade';
        proxy_set_header    Host $host;
        proxy_cache_bypass  $http_upgrade;
    }
}`
}