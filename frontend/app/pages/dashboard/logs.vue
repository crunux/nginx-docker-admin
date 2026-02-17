<script setup lang="ts">
	import type { ButtonProps, SelectMenuItem } from '@nuxt/ui';
	import type { DockerContainer } from '~/types/docker';

	type Topics = {
		value: string;
		label: string;
		icon: string;
		color: ButtonProps["color"]
	}

	const { logs, connected, currentTopic, connect, subscribe, unsubscribe, disconnect } =
		useLogStream()

	const { get, post, delete: del } = useApi()


	const terminalRef = ref<HTMLElement>()
	const selectedProject = ref('')
	const topics: Topics[] = [
		{ value: 'nginx', label: 'Nginx', icon: 'i-heroicons-server', color: 'info' },
		{ value: 'certbot', label: 'SSL', icon: 'i-heroicons-shield-check', color: 'success' },
		{ value: 'system', label: 'Sistema', icon: 'i-heroicons-cpu-chip', color: 'warning' },
	]

	// Cargar proyectos docker disponibles
	const data = await get<DockerContainer[]>('/api/docker/containers')

	const dockerProjects = computed(() =>
		(data || []).map((c) => c.name)
	)

	console.log(dockerProjects.value);




	const formatTime = (iso?: string) => {
		if (!iso) return ''
		return new Date(iso).toLocaleTimeString('es', { hour12: false })
	}

	// Auto-scroll al fondo cuando llegan nuevos logs
	watch(
		() => logs.value.length,
		async () => {
			await nextTick()
			if (terminalRef.value) {
				terminalRef.value.scrollTop = terminalRef.value.scrollHeight
			}
		}
	)

	// Conectar automáticamente al entrar
	onMounted(connect)
	onUnmounted(disconnect)
</script>
<template>
	<div class="p-6 h-full flex flex-col gap-4">

		<!-- Header -->
		<div class="flex items-center justify-between">
			<h2 class="text-2xl font-bold">Logs en tiempo real</h2>
			<div class="flex items-center gap-2">
				<span class="flex items-center gap-1 text-sm">
					<span class="w-2 h-2 rounded-full"
						:class="connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'" />
					{{ connected ? 'Conectado' : 'Desconectado' }}
				</span>
				<UButton size="xs"
					:color="connected ? 'error' : 'success'"
					@click="connected ? disconnect() : connect()">
					{{ connected ? 'Desconectar' : 'Conectar' }}
				</UButton>
			</div>
		</div>

		<!-- Selector de topic -->
		<div class="flex flex-wrap gap-2">
			<UButton v-for="topic in topics"
				:key="topic.value"
				size="sm"
				:variant="currentTopic === topic.value ? 'solid' : 'outline'"
				:color="topic.color"
				:icon="topic.icon"
				:disabled="!connected"
				@click="subscribe(topic.value)">
				{{ topic.label }}
			</UButton>

			<!-- Docker projects -->
			<USelectMenu v-if="dockerProjects.length"
				v-model="selectedProject"
				:items="dockerProjects"
				placeholder="Docker project..."
				value-key="name"
				size="sm"
				class="w-48"
				@update:model-value="subscribe(`docker:${selectedProject}`)" />

			<UButton v-if="currentTopic"
				size="sm"
				color="neutral"
				icon="i-heroicons-stop"
				@click="unsubscribe">
				Detener
			</UButton>

			<UButton size="sm"
				color="neutral"
				icon="i-heroicons-trash"
				:disabled="!logs.length"
				@click="logs.length = 0">
				Limpiar
			</UButton>
		</div>

		<!-- Terminal -->
		<div ref="terminalRef"
			class="flex-1 bg-gray-950 rounded-lg p-4 overflow-y-auto overflow-x-auto font-mono text-xs leading-5 max-h-100 min-h-0"
			style="min-height: 400px">
			<div v-if="!logs.length"
				class="text-gray-500 text-center mt-10">
				{{ connected ? 'Selecciona un topic para ver logs...' : 'Conecta el servidor para empezar' }}
			</div>

			<div v-for="(log, i) in logs"
				:key="i"
				class="flex gap-2"
				:class="log.type === 'error' ? 'text-red-400' : 'text-green-300'">
				<span class="text-gray-600 shrink-0 select-none">
					{{ formatTime(log.timestamp) }}
				</span>
				<span class="break-all whitespace-pre-wrap">{{ log.line }}</span>
			</div>
		</div>

		<!-- Footer info -->
		<div class="flex justify-between text-xs text-gray-500">
			<span>{{ logs.length }} líneas</span>
			<span v-if="currentTopic">Escuchando: <strong>{{ currentTopic }}</strong></span>
		</div>

	</div>
</template>
