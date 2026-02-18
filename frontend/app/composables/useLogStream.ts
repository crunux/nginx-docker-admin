import type { SystemStats } from '~/types/systemInfo'

interface LogMessage {
	type: 'connected' | 'subscribed' | 'unsubscribed' | 'log' | 'error' | 'stats' | 'ended'
	line?: string
	message?: string
	topic?: string
	timestamp?: string
	code?: string // Para mensajes de tipo 'error'
	data?: SystemStats // Para mensajes de tipo 'stats'
}

const _ws = ref<WebSocket | null>(null)
const _logs = ref<LogMessage[]>([])
const _connected = ref(false)
const _currentTopic = ref<string | null>(null)
const _systemStats = ref<SystemStats | null>(null)
const _tokenExpired = ref(false)

export const useLogStream = () => {
	// Ahora todas las llamadas a useLogStream() comparten el mismo estado
	function connect(): Promise<void> {
		if (_ws.value?.readyState === WebSocket.OPEN) return Promise.resolve()

		if (_ws.value?.readyState === WebSocket.CONNECTING) {
			return new Promise((resolve) => {
				_ws.value!.addEventListener('open', () => resolve(), { once: true })
			})
		}

		const config = useRuntimeConfig()
		const router = useRouter()
		const token = useCookie('admin_token')

		return new Promise((resolve, reject) => {
			const ws = new WebSocket(`${config.public.wsUrl}?token=${token.value}`)
			_ws.value = ws

			ws.onopen = () => {
				_connected.value = true
				resolve()
			}

			ws.onmessage = (event) => {
				const msg: LogMessage = JSON.parse(event.data)

				if (msg.type === 'error' && msg.code === 'TOKEN_EXPIRED') {
					_tokenExpired.value = true
					token.value = null
					router.push('/login')
					return
				}

				if (msg.type === 'stats') {
					_systemStats.value = msg.data || null
					return
				}

				if (msg.type === 'log' || msg.type === 'error') {
					if (_logs.value.length >= 500) _logs.value.shift()
					_logs.value.push(msg)
				}
			}

			ws.onclose = () => {
				_connected.value = false
				_currentTopic.value = null
				setTimeout(() => connect(), 3000)
			}

			ws.onerror = (e) => {
				_connected.value = false
				reject(e)
			}
		})
	}

	function subscribeStats(intervalMs = 2000) {
		if (!_ws.value || _ws.value.readyState !== WebSocket.OPEN) return
		_currentTopic.value = 'system:stats'
		_ws.value.send(JSON.stringify({
			action: 'subscribe',
			topic: 'system:stats',
			interval: intervalMs
		}))
	}

	function subscribe(topic: string) {
		if (!_ws.value || _ws.value.readyState !== WebSocket.OPEN) return
		_logs.value = []
		_currentTopic.value = topic
		_ws.value.send(JSON.stringify({ action: 'subscribe', topic }))
	}

	function unsubscribe() {
		if (!_ws.value || _ws.value.readyState !== WebSocket.OPEN) return
		_ws.value.send(JSON.stringify({ action: 'unsubscribe' }))
		_currentTopic.value = null
	}

	function disconnect() {
		unsubscribe()
		if (_ws.value) {
			_ws.value.onclose = null
			_ws.value.close()
			_ws.value = null
		}
		_connected.value = false
	}

	return {
		systemStats: _systemStats,
		logs: _logs,
		connected: _connected,
		currentTopic: _currentTopic,
		tokenExpired: _tokenExpired,
		connect,
		subscribe,
		subscribeStats,
		unsubscribe,
		disconnect
	}
}
