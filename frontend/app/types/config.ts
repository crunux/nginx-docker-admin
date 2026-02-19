export interface AppConfig {
	nginx: {
		sitesAvailable: string
		sitesEnabled: string
		configDir: string
		logDir: string
	}
	stats: {
		source: 'host' | 'container'
		interval: number
	}
	ui: {
		language: 'es' | 'en'
		theme: 'light' | 'dark' | 'system'
	}
}

export interface Dependency {
	installed: boolean
	version?: string
}

export interface Dependencies {
	nginx: Dependency
	certbot: Dependency
	docker: Dependency
	dockerCompose: Dependency
}
