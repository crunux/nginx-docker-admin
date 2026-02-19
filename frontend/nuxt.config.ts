// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	modules: [
		'@nuxt/eslint',
		'@nuxt/ui',
		'@nuxt/test-utils',
		'@pinia/nuxt'
	],

	ssr: false,

	devtools: {
		enabled: true
	},

	css: ['~/assets/css/main.css'],

	runtimeConfig: {
		public: {
			apiUrl: import.meta.env.NUXT_PUBLIC_API_URL || 'http://localhost:4000',
			wsUrl: import.meta.env.NUXT_PUBLIC_WS_URL || 'ws://localhost:4001'
		}
	},

	routeRules: {
		'/': { prerender: true }
	},

	compatibilityDate: '2025-01-15',

	eslint: {
		config: {
			stylistic: {
				commaDangle: 'never',
				braceStyle: '1tbs'
			}
		}
	}
})
