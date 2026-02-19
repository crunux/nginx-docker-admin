// frontend/composables/useApi.ts
export const useApi = () => {
	const toast = useToast()
	const token = useCookie('admin_token')
	const config = useRuntimeConfig()

	const ERROR_MESSAGES: Record<string, string> = {
		NGINX_NOT_FOUND: '⚠️ Nginx no está disponible en este servidor',
		NGINX_NOT_INSTALLED: '⚠️ Nginx no está instalado',
		PERMISSION_DENIED: '🔒 Sin permisos. ¿El servidor corre como root?',
		SITE_NOT_FOUND: '❌ El sitio no existe',
		SITE_ALREADY_EXISTS: '❌ El sitio ya existe'
	}

	type Methods = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS' | 'HEAD' | 'CONNECT' | 'TRACE' | 'get' | 'post' | 'put' | 'delete' | 'patch' | 'options' | 'head' | 'connect' | 'trace' | undefined

	const request = async <T>(path: string, opts: RequestInit = {}): Promise<T> => {
		const headers: Record<string, string> = {}
		if (token.value) headers['Authorization'] = `Bearer ${token.value}`
		try {
			return await $fetch<T>(`${config.public.apiUrl}${path}`, {
				...opts,
				method: (opts.method as Methods) || 'GET',
				headers: {
					'Content-Type': 'application/json',
					...headers,
					...opts.headers
				}
			})
		} catch (err: unknown) {
			const error = err as { data?: { code?: string, error?: string } }
			const code = error?.data?.code as string | undefined
			const message = error?.data?.error as string | undefined

			toast.add({
				title: ERROR_MESSAGES[code!] || message || 'Error inesperado',
				color: 'error',
				icon: 'i-heroicons-exclamation-circle'
				// timeout:     5000,
			})

			if (message === 'Token invalido') {
				navigateTo('/login')
			}

			throw err
		}
	}

	return {
		get: <T>(path: string) => request<T>(path),
		post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
		put: <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
		delete: <T>(path: string) => request<T>(path, { method: 'DELETE' })
	}
}
