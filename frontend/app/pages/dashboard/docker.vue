<script setup lang="ts">
import type { ButtonProps, TableColumn } from '@nuxt/ui'
import type { DockerContainer, DockerProject, DockerStats, DockerImage } from '~/types/docker'

const { get, post } = useApi()
const toast = useToast()

const ContainerActions = resolveComponent('ContainerActions')

// ── State ──────────────────────────────────────────────
const containers = ref<DockerContainer[]>([])
const projects = ref<DockerProject[]>([])
const stats = ref<DockerStats[]>([])
const images = ref<DockerImage[]>([])
const refreshing = ref(false)
const deploying = ref(false)
const pulling = ref(false)
const deployOutput = ref('')
const logsContent = ref('')
const logsProject = ref('')
const pullImage = ref('')
const search = ref('')
const stateFilter = ref('all')
const activeTab = ref(0)
const selectedProject = ref<DockerProject | null>(null)
const logsRef = ref<HTMLElement>()

const modals = reactive({
	deploy: false,
	compose: false,
	logs: false
})

const deployForm = reactive({ name: '', compose: '' })

// ── Tabs ───────────────────────────────────────────────
const tabs = [
	{ label: 'Proyectos', slot: 'projects', icon: 'i-heroicons-cube-transparent' },
	{ label: 'Contenedores', slot: 'containers', icon: 'i-heroicons-server' },
	{ label: 'Stats', slot: 'stats', icon: 'i-heroicons-chart-bar' },
	{ label: 'Imágenes', slot: 'images', icon: 'i-heroicons-photo' }
]

const containerColumns: TableColumn<DockerContainer>[] = [
	{
		accessorKey: 'id',
		header: 'ID'
	},
	{
		accessorKey: 'name',
		header: 'Nombre'
	},
	{
		accessorKey: 'image',
		header: 'Imagen'
	},
	{
		accessorKey: 'state',
		header: 'Estado'
	},
	{
		accessorKey: 'ports',
		header: 'Puertos'
	},
	{
		id: 'actions',
		header: 'Acciones',
		cell: ({ row }) => h(ContainerActions, { ...row.original, onRefresh: loadAll })
	}
]

const imageColumns: TableColumn<DockerImage>[] = [
	{
		accessorKey: 'id',
		header: 'ID'
	},
	{
		accessorKey: 'repository',
		header: 'Imagen',
		cell: ({ row }) => {
			const repo = () => (row.getValue('repository') as string).slice(0, 30)
			return h('span', { class: 'font-mono text-sm truncate max-w-[30ch]' }, repo())
		}
	},
	{
		accessorKey: 'tag',
		header: 'Tag'
	},
	{
		accessorKey: 'size',
		header: 'Tamaño'
	},
	{
		accessorKey: 'createdAt',
		header: 'Creada',
		cell: ({ row }) => {
			const createAt = () => new Date(row.getValue('createAt') as string).toLocaleString('es-DO', {
				day: 'numeric',
				month: 'short',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
				hour12: true
			})
			return h('span', { class: 'text-sm' }, createAt())
		}
	}
]

// ── Computed ───────────────────────────────────────────
const runningCount = computed(() => containers.value.filter(c => c.state === 'running').length)

const filteredContainers = computed(() => {
	return containers.value.filter((c) => {
		const matchSearch = !search.value || c.name.includes(search.value) || c.image.includes(search.value)
		const matchState = stateFilter.value === 'all' || c.state === stateFilter.value
		return matchSearch && matchState
	})
})

// ── Helpers ────────────────────────────────────────────
const stateColor = (state: string) => ({
	running: 'bg-green-500 animate-pulse',
	exited: 'bg-gray-400',
	paused: 'bg-yellow-400',
	restarting: 'bg-blue-400 animate-pulse',
	dead: 'bg-red-500'
}[state] || 'bg-gray-400')

const stateBadgeColor = (state: string) => ({
	running: 'success',
	exited: 'neutral',
	paused: 'warning',
	restarting: 'info',
	dead: 'error'
}[state] || 'neutral')

// ── Carga de datos ─────────────────────────────────────
async function loadAll() {
	refreshing.value = true
	try {
		const [c, p, s, i] = await Promise.all([
			get<DockerContainer[]>('/api/docker/containers'),
			get<DockerProject[]>('/api/docker/projects'),
			get<DockerStats[]>('/api/docker/stats'),
			get<DockerImage[]>('/api/docker/images')
		])

		containers.value = c
		projects.value = p
		stats.value = s
		images.value = i
	} finally {
		refreshing.value = false
	}
};

// ── Acciones ───────────────────────────────────────────
async function projectAction(name: string, action: 'start' | 'stop' | 'restart') {
	await post(`/api/docker/projects/${name}/${action}`, {})
	toast.add({ title: `✅ Proyecto ${action === 'start' ? 'iniciado' : action === 'stop' ? 'detenido' : 'reiniciado'}`, color: 'success' })
	await loadAll()
};

async function doDeploy() {
	deploying.value = true
	try {
		const res = await post<{ result: string }>('/api/docker/projects', {
			projectName: deployForm.name,
			composeContent: deployForm.compose
		})
		deployOutput.value = res.result
		toast.add({ title: '🚀 Proyecto desplegado', color: 'success' })
		await loadAll()
	} finally {
		deploying.value = false
	}
};

async function doPullImage() {
	if (!pullImage.value) return
	pulling.value = true
	try {
		await post('/api/docker/images/pull', { image: pullImage.value })
		toast.add({ title: `✅ Imagen ${pullImage.value} descargada`, color: 'success' })
		await loadAll()
	} finally {
		pulling.value = false
	}
};

async function doPrune() {
	if (!confirm('¿Limpiar imágenes, contenedores y redes sin usar?')) return
	await post('/api/docker/system/prune', {})
	toast.add({ title: '🧹 Sistema limpiado', color: 'warning' })
	await loadAll()
}

async function openLogs(projectName: string) {
	logsProject.value = projectName
	const res = await get<{ logs: string }>(`/api/docker/${projectName}/logs`)
	logsContent.value = res.logs
	modals.logs = true
	await nextTick()
	if (logsRef.value) logsRef.value.scrollTop = logsRef.value.scrollHeight
}

function openCompose(proj: DockerProject) {
	selectedProject.value = proj
	modals.compose = true
};

// ── Auto-refresh stats ─────────────────────────────────
let interval: ReturnType<typeof setInterval>
onMounted(() => {
	loadAll()
	// Refrescar stats cada 10s automáticamente
	interval = setInterval(async () => {
		stats.value = await get<DockerStats[]>('/api/docker/stats')
	}, 10_000)
})

onUnmounted(() => clearInterval(interval))
</script>

<template>
	<div class="p-6 space-y-6">
		<!-- Header -->
		<div class="flex items-center justify-between">
			<div>
				<!-- <h2 class="text-2xl font-bold">
					Docker
				</h2> -->
				<p class="text-sm text-gray-500 mt-1">
					{{ runningCount }} corriendo · {{ containers.length }} total
				</p>
			</div>
			<div class="flex gap-2">
				<UButton
					color="neutral"
					variant="soft"
					icon="i-heroicons-arrow-path"
					:loading="refreshing"
					@click="loadAll"
				>
					Actualizar
				</UButton>
				<UButton
					icon="i-heroicons-plus"
					@click="modals.deploy = true"
				>
					Desplegar proyecto
				</UButton>
			</div>
		</div>

		<!-- Tabs -->
		<UTabs
			v-model="activeTab"
			:items="tabs"
		>
			<!-- ─── Tab Proyectos ─── -->
			<template #projects>
				<div class="space-y-4 mt-4">
					<div
						v-if="!projects.length"
						class="text-center py-16 text-gray-400 border border-dashed rounded-xl"
					>
						<UIcon
							name="i-heroicons-cube"
							class="text-5xl mb-3"
						/>
						<p class="font-medium">
							Sin proyectos
						</p>
						<UButton
							class="mt-4"
							@click="modals.deploy = true"
						>
							Desplegar proyecto
						</UButton>
					</div>

					<UCard
						v-for="proj in projects"
						:key="proj.name"
					>
						<!-- Header del proyecto -->
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-3">
								<UIcon
									name="i-heroicons-cube-transparent"
									class="text-2xl text-primary"
								/>
								<div>
									<p class="font-semibold">
										{{ proj.name }}
									</p>
									<p class="text-xs text-gray-400 font-mono">
										{{ proj.path }}
									</p>
								</div>
							</div>

							<div class="flex items-center gap-3">
								<UBadge
									:color="proj.running > 0 ? 'success' : 'neutral'"
									variant="subtle"
								>
									{{ proj.running }}/{{ proj.total }} corriendo
								</UBadge>
								<div class="flex gap-1">
									<UTooltip text="Iniciar">
										<UButton
											size="xs"
											color="success"
											variant="soft"
											icon="i-heroicons-play"
											@click="projectAction(proj.name, 'start')"
										/>
									</UTooltip>
									<UTooltip text="Reiniciar">
										<UButton
											size="xs"
											color="warning"
											variant="soft"
											icon="i-heroicons-arrow-path"
											@click="projectAction(proj.name, 'restart')"
										/>
									</UTooltip>
									<UTooltip text="Detener">
										<UButton
											size="xs"
											color="error"
											variant="soft"
											icon="i-heroicons-stop"
											@click="projectAction(proj.name, 'stop')"
										/>
									</UTooltip>
									<UTooltip text="Ver compose">
										<UButton
											size="xs"
											color="neutral"
											variant="soft"
											icon="i-heroicons-document-text"
											@click="openCompose(proj)"
										/>
									</UTooltip>
									<UTooltip text="Ver logs">
										<UButton
											size="xs"
											color="info"
											variant="soft"
											icon="i-heroicons-command-line"
											@click="openLogs(proj.name)"
										/>
									</UTooltip>
								</div>
							</div>
						</div>

						<!-- Contenedores del proyecto -->
						<div
							v-if="proj.containers.length"
							class="mt-4 space-y-2"
						>
							<div
								v-for="c in proj.containers"
								:key="c.id"
								class="flex items-center border border-zinc-200 justify-between rounded-lg px-3 py-2"
							>
								<div class="flex items-center gap-2">
									<span
										class="w-2 h-2 rounded-full"
										:class="stateColor(c.state)"
									/>
									<span class="text-sm font-mono font-medium">{{ c.name }}</span>
									<span class="text-xs text-gray-300">{{ c.image }}</span>
								</div>
								<div class="flex items-center gap-3">
									<span class="text-xs text-gray-300 font-mono">{{ c.ports || '—' }}</span>
									<UBadge
										:color="stateBadgeColor(c.state) as ButtonProps['color']"
										variant="subtle"
										size="sm"
									>
										{{ c.state }}
									</UBadge>
									<ContainerActions
										v-bind="c"
										@refresh="loadAll"
									/>
								</div>
							</div>
						</div>
					</UCard>
				</div>
			</template>

			<!-- ─── Tab Contenedores ─── -->
			<template #containers>
				<div class="mt-4">
					<!-- Filtro rápido -->
					<div class="flex gap-2 mb-4">
						<UInput
							v-model="search"
							placeholder="Buscar contenedor..."
							icon="i-heroicons-magnifying-glass"
							class="max-w-xs"
						/>
						<USelectMenu
							v-model="stateFilter"
							:options="['all', 'running', 'exited', 'paused']"
							class="w-36"
						/>
					</div>

					<UTable
						:data="filteredContainers"
						:columns="containerColumns"
					>
						<template #state="{ row }">
							<div class="flex items-center gap-2">
								<span
									class="w-2 h-2 rounded-full"
									:class="stateColor(row.getValue('state'))"
								/>
								<span class="text-sm">{{ row.getValue('state') }}</span>
							</div>
						</template>

						<template #name="{ row }">
							<span class="font-mono text-sm">{{ row.getValue("name") }}</span>
						</template>

						<template #image="{ row }">
							<span class="text-xs text-gray-500 font-mono">{{ row.getValue("image") }}</span>
						</template>

						<template #ports="{ row }">
							<span class="text-xs font-mono">{{ row.getValue("port") || '—' }}</span>
						</template>
					</UTable>
				</div>
			</template>

			<!-- ─── Tab Stats ─── -->
			<template #stats>
				<div class="mt-4 space-y-3">
					<div
						v-if="!stats.length"
						class="text-center py-10 text-gray-400"
					>
						No hay contenedores corriendo
					</div>

					<div
						v-for="s in stats"
						:key="s.id"
						class="border border-zinc-200 rounded-lg p-4 space-y-3"
					>
						<div class="flex justify-between items-center">
							<span class="font-mono font-semibold text-sm">{{ s.name }}</span>
							<span class="text-xs text-gray-400">{{ s.id.slice(0, 12) }}</span>
						</div>

						<!-- CPU -->
						<div>
							<div class="flex justify-between text-xs text-gray-400 mb-1">
								<span>CPU</span>
								<span class="font-mono">{{ s.cpuPercent }}</span>
							</div>
							<UProgress
								:model-value="parseFloat(s.cpuPercent)"
								:color="parseFloat(s.cpuPercent) > 80 ? 'error' : 'success'"
							/>
						</div>

						<!-- RAM -->
						<div>
							<div class="flex justify-between text-xs text-gray-400 mb-1">
								<span>Memoria</span>
								<span class="font-mono">{{ s.memUsage }} ({{ s.memPercent }})</span>
							</div>
							<UProgress
								:model-value="parseFloat(s.memPercent)"
								:color="parseFloat(s.memPercent) > 80 ? 'error' : 'success'"
							/>
						</div>

						<!-- Net/Block IO -->
						<div class="flex gap-6 text-xs text-gray-500">
							<span>🌐 Net I/O: <span class="font-mono text-gray-400">{{ s.netIO }}</span></span>
							<span>💾 Block I/O: <span class="font-mono text-gray-400">{{ s.blockIO }}</span></span>
						</div>
					</div>
				</div>
			</template>

			<!-- ─── Tab Imágenes ─── -->
			<template #images>
				<div class="mt-4 space-y-4">
					<!-- Pull imagen -->
					<div class="flex gap-2">
						<UInput
							v-model="pullImage"
							placeholder="nginx:latest"
							icon="i-heroicons-arrow-down-tray"
							class="max-w-sm"
						/>
						<UButton
							:loading="pulling"
							@click="doPullImage"
						>
							Pull
						</UButton>
						<UButton
							color="error"
							variant="soft"
							icon="i-heroicons-trash"
							@click="doPrune"
						>
							Prune system
						</UButton>
					</div>

					<UTable
						:data="images"
						:columns="imageColumns"
					>
						<template #id="{ row }">
							<span class="font-mono text-xs text-gray-400">{{ row.getValue("id") }}</span>
						</template>
						<!-- <template #repository="{ row }">
							<span class="font-mono text-sm">{{ row.getValue("repository").slice(0, 30) }}</span>
						</template> -->
						<template #tag="{ row }">
							<span class="font-mono text-xs text-gray-400">{{ row.getValue("tag") }}</span>
						</template>
						<!-- <template #createAt="{ row }">
							<span class="font-mono text-xs text-gray-400">{{ row.getValue("createAt") }}</span>
						</template> -->
					</UTable>
				</div>
			</template>
		</UTabs>

		<!-- ─── Modal Deploy ─── -->
		<UModal
			v-model:open="modals.deploy"
			:ui="{ content: 'max-w-2xl' }"
		>
			<template #content>
				<UCard>
					<template #header>
						<h3 class="font-semibold text-lg">
							Desplegar proyecto
						</h3>
					</template>

					<div class="space-y-4">
						<UFormField
							label="Nombre del proyecto"
							required
						>
							<UInput
								v-model="deployForm.name"
								placeholder="App"
							/>
						</UFormField>

						<UFormField
							label="docker-compose.yml"
							required
						>
							<UTextarea
								v-model="deployForm.compose"
								:ui="{ root: 'w-full' }"
								:rows="16"
								:column="20"
								class="font-mono text-xs"
								placeholder="services:
							app:
								image: nginx:latest
								ports:
									- '80:80'"
							/>
						</UFormField>
					</div>

					<!-- Output -->
					<div
						v-if="deployOutput"
						class="mt-4 bg-gray-950 text-green-300 font-mono text-xs rounded p-3 max-h-40 overflow-y-auto"
					>
						<pre>{{ deployOutput }}</pre>
					</div>

					<template #footer>
						<div class="flex justify-end gap-2">
							<UButton
								color="neutral"
								variant="ghost"
								@click="modals.deploy = false"
							>
								Cancelar
							</UButton>
							<UButton
								:loading="deploying"
								@click="doDeploy"
							>
								🚀 Desplegar
							</UButton>
						</div>
					</template>
				</UCard>
			</template>
		</UModal>

		<!-- ─── Modal Compose ─── -->
		<UModal
			v-model:open="modals.compose"
			:ui="{ content: 'max-w-2xl' }"
		>
			<template #content>
				<UCard>
					<template #header>
						<h3 class="font-semibold">
							docker-compose.yml — {{ selectedProject?.name }}
						</h3>
					</template>
					<pre class="bg-gray-950 text-green-300 font-mono text-xs rounded p-4 overflow-auto max-h-96">{{
					selectedProject?.compose }}</pre>
					<template #footer>
						<UButton
							color="neutral"
							@click="modals.compose = false"
						>
							Cerrar
						</UButton>
					</template>
				</UCard>
			</template>
		</UModal>

		<!-- ─── Modal Logs ─── -->
		<UModal
			v-model:open="modals.logs"
			:ui="{ content: 'max-w-3xl' }"
		>
			<template #content>
				<UCard>
					<template #header>
						<h3 class="font-semibold">
							Logs — {{ logsProject }}
						</h3>
					</template>
					<div
						ref="logsRef"
						class="bg-gray-950 text-green-300 font-mono text-xs rounded p-4 h-80 overflow-y-auto"
					>
						<pre>{{ logsContent }}</pre>
					</div>
					<template #footer>
						<UButton
							color="neutral"
							@click="modals.logs = false"
						>
							Cerrar
						</UButton>
					</template>
				</UCard>
			</template>
		</UModal>
	</div>
</template>
