import type { AppConfig } from '~/types/config'

const _config = ref<AppConfig | null>(null)

export const useConfig = () => {
	const { get, put, post } = useApi()

	async function load() {
		_config.value = await get<AppConfig>('/api/config')
	}

	async function save(partial: Partial<AppConfig>) {
		_config.value = await put<AppConfig>('/api/config', partial)
	}

	async function reset() {
		_config.value = await post<AppConfig>('/api/config/reset', {})
	}

	return { config: _config, load, save, reset }
}
