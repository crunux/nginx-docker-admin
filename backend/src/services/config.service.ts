import fs from 'fs/promises'

const CONFIG_PATH = process.env.CONFIG_PATH || '/etc/nginx-admin/config.json'

export interface AppConfig {
  nginx: {
    sitesAvailable: string
    sitesEnabled:   string
    configDir:      string
    logDir:         string
  }
  stats: {
    source:   'host' | 'container'
    interval: number
  }
  ui: {
    language: 'es' | 'en'
    theme:    'light' | 'dark' | 'system'
  }
}

const DEFAULT_CONFIG: AppConfig = {
  nginx: {
    sitesAvailable: '/etc/nginx/sites-available',
    sitesEnabled:   '/etc/nginx/sites-enabled',
    configDir:      '/etc/nginx',
    logDir:         '/var/log/nginx',
  },
  stats: {
    source:   'host',
    interval: 2000,
  },
  ui: {
    language: 'es',
    theme:    'system',
  },
}

export const configService = {
  async get(): Promise<AppConfig> {
    try {
      const raw = await Bun.file(CONFIG_PATH).text()
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
    } catch {
      return DEFAULT_CONFIG
    }
  },

  async update(partial: Partial<AppConfig>): Promise<AppConfig> {
    const current = await this.get()
    const updated = {
      ...current,
      ...partial,
      nginx:  { ...current.nginx,  ...partial.nginx  },
      stats:  { ...current.stats,  ...partial.stats  },
      ui:     { ...current.ui,     ...partial.ui     },
    }

    await fs.mkdir('/etc/nginx-admin', { recursive: true })
    await Bun.write(CONFIG_PATH, JSON.stringify(updated, null, 2))
    return updated
  },

  async reset(): Promise<AppConfig> {
    await Bun.write(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG, null, 2))
    return DEFAULT_CONFIG
  },
}