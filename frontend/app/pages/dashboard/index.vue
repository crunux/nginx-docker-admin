<script setup lang="ts">
	import type { Dependencies } from '~/types/config'
	const { systemStats, connected, tokenExpired, connect, disconnect, subscribeStats } = useLogStream()

	const dependencies = ref<Dependencies | null>(null)
	const installing = ref<string | null>(null)
	const loadingDeps = ref(false)

	const { get, post } = useApi()
	const toast = useToast()

	const TOOLS = [
		{ name: 'nginx', label: 'Nginx', icon: 'i-heroicons-server' },
		{ name: 'certbot', label: 'Certbot / SSL', icon: 'i-heroicons-shield-check' },
		{ name: 'docker', label: 'Docker', icon: 'i-heroicons-cube' },
		{ name: 'dockerCompose', label: 'Docker Compose', icon: 'i-heroicons-cube-transparent' },
	]


	const cards = [
		{
			title: 'Memory',
			// description: 'Monitorea el uso de memoria del sistema en tiempo real.',
			icon: 'i-lucide-memory-stick',
			orientation: 'horizontal' as const,
			color: 'info' as const,
			// highlightColor: "info",
			// highlight: true,
		},
		{
			title: 'CPU',
			// description: 'Monitorea el uso de CPU del sistema en tiempo real.',
			icon: 'i-lucide-cpu',
			orientation: 'horizontal' as const,
			color: 'success' as const,
			// highlightColor: "success",
			// highlight: true
		},
		{
			title: 'Disk',
			// description: 'Monitorea el uso del disco del sistema en tiempo real.',
			icon: 'i-lucide-hard-drive',
			orientation: 'horizontal' as const,
			color: 'warning' as const,
			// highlightColor: "warning",
			// highlight: true
		},
		{
			title: 'Network',
			// description: 'Monitorea el uso de red del sistema en tiempo real.',
			icon: 'i-lucide-network',
			orientation: 'horizontal' as const,
			color: 'error' as const,
			// highlightColor: "error",
			// highlight: true
		}
	]

	async function loadDependencies() {
		loadingDeps.value = true
		try {
			dependencies.value = await get<Dependencies>('/api/config/dependencies')
		} finally {
			loadingDeps.value = false
		}
	}


	async function installTool(name: string) {
		installing.value = name
		try {
			const res = await post<{ message: string }>(`/api/install/${name}`, {})
			toast.add({
				title: `✅ ${res.message}`,
				color: 'success',
				// timeout: 5000,
			})
			await loadDependencies()
		} catch {
			toast.add({
				title: `❌ Error instalando ${name}`,
				color: 'error',
				// timeout: 5000,
			})
		} finally {
			installing.value = null
		}
	}

	// watch(systemStats, (newStats) => {
	// 	console.log('[index-dashboard] systemStats actualizado:', newStats)
	// })

	onMounted(async () => {
		await connect()
		subscribeStats(2000)

		await loadDependencies()
	})
	onUnmounted(disconnect)
</script>
<template>
	<UDashboardPanel resizable>
		<template #header>
			<div class="flex justify-start items-center px-4 py-2">
				<div class="flex items-center gap-2">
					<span class="flex items-center gap-2 text-sm">
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
		</template>
		<template #body>
			<UPageGrid>
				<UPageCard v-for="(card, index) in cards"
					:key="`${index}-${card.title}`"
					v-bind="card">
					<template #footer>
						<div v-if="card.title === 'Memory'"
							class="w-full text-2xl font-bold">
							<UProgress :modelValue="systemStats?.ram ? parseFloat(`${systemStats.ram.percent}`) : 0"
								size="lg"
								:color="parseFloat(`${systemStats?.ram.percent || '0'}`) < 50 ? 'success' : parseFloat(`${systemStats?.ram.percent || '0'}`) < 80 ? 'warning' : 'error'" />
							{{ systemStats?.ram ? formatStat('ram', systemStats) : '' }}
						</div>
						<div v-else-if="card.title === 'CPU'"
							class="w-full text-2xl font-bold">
							<UProgress :modelValue="systemStats?.cpu ? parseFloat(`${systemStats.cpu.usage}`) : 0"
								size="lg"
								:color="parseFloat(`${systemStats?.cpu?.usage || '0'}`) < 50 ? 'success' : parseFloat(`${systemStats?.cpu?.usage || '0'}`) < 80 ? 'warning' : 'error'" />
							{{ systemStats?.cpu ? formatStat('cpu', systemStats) : '' }}
						</div>
						<div v-else-if="card.title === 'Disk'"
							class="w-full text-2xl font-bold">
							<UProgress class="w-full"
								:modelValue="systemStats?.disk ? parseFloat(`${systemStats.disk[0]?.percent}`) : 0"
								size="lg"
								:color="parseFloat(`${systemStats?.disk[0]?.percent || '0'}`) < 50 ? 'success' : parseFloat(`${systemStats?.disk[0]?.percent || '0'}`) < 80 ? 'warning' : 'error'" />
							{{ systemStats?.disk ? formatStat('disk', systemStats) : '' }}
						</div>
						<div v-else-if="card.title === 'Network'"
							class="w-full text-2xl font-bold">
							{{ systemStats?.network ? formatStat('network', systemStats) : '' }}
						</div>
					</template>
				</UPageCard>
			</UPageGrid>
			<UCard class="mt-6">
				<div class="flex items-center justify-between mb-4">
					<UButton size="xs"
						color="neutral"
						variant="ghost"
						icon="i-heroicons-arrow-path"
						:loading="loadingDeps"
						@click="loadDependencies">
						Verificar
					</UButton>
				</div>

				<UPageGrid :ui="{ root: 'grid-cols-2 md:grid-cols-4 gap-4' }">
					<DependencyCard v-for="tool in TOOLS"
						:key="tool.name"
						:name="tool.name"
						:label="tool.label"
						:icon="tool.icon"
						:dependency="dependencies?.[tool.name as keyof typeof dependencies] ?? null"
						:loading="installing === tool.name"
						@install="installTool" />
				</UPageGrid>
			</UCard>
		</template>
	</UDashboardPanel>
	<!-- <UDialog v-model="tokenExpired"
		title="Sesión Expirada"
		description="Tu sesión ha expirado. Por favor, inicia sesión nuevamente para continuar."
		:closable="false"
		:footer="[
			{
				label: 'Ir a Login',
				to: '/login',
				color: 'primary',
				size: 'md'
			}
		]" /> -->
</template>
<style scoped></style>
