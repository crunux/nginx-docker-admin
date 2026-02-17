<script setup lang="ts">
	import type { Subdomain } from '~/types/subdomain'

	const { get, post, put, delete: del } = useApi()
	const toast = useToast()

	// ── State ──────────────────────────────────────
	const subdomains = ref<Subdomain[]>([])
	const selectedSub = ref<Subdomain | null>(null)
	const saving = ref(false)
	const deleting = ref(false)
	const issuingSSL = ref(false)
	const sslEmail = ref('')
	const sslOutput = ref('')
	const editPort = ref(3000)

	const modals = reactive({
		create: false,
		edit: false,
		ssl: false,
		config: false,
		delete: false,
	})

	const form = reactive({
		name: '',
		subdomain: '',
		domain: '',
		port: 3000,
	})

	// ── Cargar ─────────────────────────────────────
	async function loadSubdomains() {
		subdomains.value = await get<Subdomain[]>('/api/subdomains')
	}

	// ── Abrir modales ──────────────────────────────
	function openCreate() {
		Object.assign(form, { name: '', subdomain: '', domain: '', port: 3000 })
		modals.create = true
	}

	function openEdit(sub: Subdomain) {
		selectedSub.value = sub
		editPort.value = sub.port
		modals.edit = true
	}

	function openSslModal(sub: Subdomain) {
		selectedSub.value = sub
		sslOutput.value = ''
		modals.ssl = true
	}

	function openConfig(sub: Subdomain) {
		selectedSub.value = sub
		modals.config = true
	}

	function confirmDelete(sub: Subdomain) {
		selectedSub.value = sub
		modals.delete = true
	}

	// ── CRUD ───────────────────────────────────────
	async function saveSubdomain() {
		saving.value = true
		try {
			await post('/api/subdomains', form)
			toast.add({ title: '✅ Subdominio creado', color: 'success' })
			modals.create = false
			await loadSubdomains()
		} finally {
			saving.value = false
		}
	}

	async function updateSubdomain() {
		if (!selectedSub.value) return
		saving.value = true
		try {
			await put(`/api/subdomains/${selectedSub.value.name}`, { port: editPort.value })
			toast.add({ title: '✅ Puerto actualizado', color: 'success' })
			modals.edit = false
			await loadSubdomains()
		} finally {
			saving.value = false
		}
	}

	async function toggleSubdomain(sub: Subdomain) {
		const action = sub.enabled ? 'disable' : 'enable'
		await post(`/api/subdomains/${sub.name}/${action}`, {})
		await loadSubdomains()
	}

	async function deleteSubdomain() {
		if (!selectedSub.value) return
		deleting.value = true
		try {
			await del(`/api/subdomains/${selectedSub.value.name}`)
			toast.add({ title: '🗑️ Subdominio eliminado', color: 'warning' })
			modals.delete = false
			await loadSubdomains()
		} finally {
			deleting.value = false
		}
	}

	async function issueSSL() {
		if (!selectedSub.value) return
		issuingSSL.value = true
		try {
			const res = await post<{ result: string }>(
				`/api/subdomains/${selectedSub.value.name}/ssl`,
				{ email: sslEmail.value }
			)
			sslOutput.value = res.result
			toast.add({ title: '🔒 SSL emitido correctamente', color: 'success' })
			await loadSubdomains()
		} finally {
			issuingSSL.value = false
		}
	}

	onMounted(loadSubdomains)
</script>
<template>
	<div class="p-6 space-y-6">

		<!-- Header -->
		<div class="flex items-center justify-between">
			<div>
				<h2 class="text-2xl font-bold">Subdominios</h2>
				<p class="text-sm text-gray-500 mt-1">
					{{ subdomains.length }} subdominio{{ subdomains.length !== 1 ? 's' : '' }} configurado{{ subdomains.length !==
						1 ? 's' : '' }}
				</p>
			</div>
			<UButton icon="i-heroicons-plus"
				@click="openCreate()">
				Nuevo subdominio
			</UButton>
		</div>

		<!-- Empty state -->
		<div v-if="!subdomains.length"
			class="text-center py-20 text-gray-400 border border-dashed rounded-xl">
			<UIcon name="i-heroicons-globe-alt"
				class="text-5xl mb-3" />
			<p class="text-lg font-medium">Sin subdominios</p>
			<p class="text-sm mt-1">Crea tu primer subdominio para empezar</p>
			<UButton class="mt-4 my-2"
				@click="openCreate()">Crear subdominio</UButton>
		</div>

		<!-- Grid de subdominios -->
		<div v-else
			class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
			<UCard v-for="sub in subdomains"
				:key="sub.name"
				class="relative"
				:class="!sub.enabled && 'opacity-60'">
				<!-- Status badge -->
				<div class="absolute top-3 right-3 flex gap-2">
					<UBadge :color="sub.hasSSL ? 'success' : 'warning'"
						variant="subtle"
						size="xs">
						<UIcon :name="sub.hasSSL ? 'i-heroicons-lock-closed' : 'i-heroicons-lock-open'"
							class="mr-1" />
						{{ sub.hasSSL ? 'SSL' : 'HTTP' }}
					</UBadge>
					<UBadge :color="sub.enabled ? 'success' : 'neutral'"
						variant="subtle"
						size="xs">
						{{ sub.enabled ? 'Activo' : 'Inactivo' }}
					</UBadge>
				</div>

				<!-- Info -->
				<div class="space-y-2 pr-24">
					<p class="font-mono font-semibold text-sm truncate">
						{{ sub.hasSSL ? 'https' : 'http' }}://{{ sub.fullDomain }}
					</p>
					<p class="text-xs text-gray-500">
						→ localhost:<span class="font-mono font-medium text-gray-700">{{ sub.port }}</span>
					</p>
					<p class="text-xs text-gray-400">{{ sub.name }}</p>
				</div>

				<USeparator class="my-3" />

				<!-- Acciones -->
				<div class="flex items-center justify-between">
					<UToggle :model-value="sub.enabled"
						@update:model-value="toggleSubdomain(sub)" />

					<div class="flex gap-2">
						<!-- SSL -->
						<UTooltip text="Emitir SSL">
							<UButton size="xs"
								color="success"
								variant="soft"
								icon="i-heroicons-shield-check"
								:disabled="sub.hasSSL"
								@click="openSslModal(sub)" />
						</UTooltip>

						<!-- Editar puerto -->
						<UTooltip text="Editar puerto">
							<UButton size="xs"
								color="info"
								variant="soft"
								icon="i-heroicons-pencil"
								@click="openEdit(sub)" />
						</UTooltip>

						<!-- Ver config -->
						<UTooltip text="Ver configuración">
							<UButton size="xs"
								color="neutral"
								variant="soft"
								icon="i-heroicons-code-bracket"
								@click="openConfig(sub)" />
						</UTooltip>

						<!-- Eliminar -->
						<UTooltip text="Eliminar">
							<UButton size="xs"
								color="error"
								variant="soft"
								icon="i-heroicons-trash"
								@click="confirmDelete(sub)" />
						</UTooltip>
					</div>
				</div>
			</UCard>
		</div>

		<!-- ─── Modal Crear ─── -->
		<UModal v-model:open="modals.create">
			<template #content>
				<UCard>
					<template #header>
						<h3 class="font-semibold text-lg">Nuevo subdominio</h3>
					</template>

					<div class="space-y-4">
						<UFormField label="Nombre del sitio (identificador)"
							required>
							<UInput v-model="form.name"
								placeholder="App Name"
								icon="i-heroicons-tag" />
						</UFormField>

						<div class="flex gap-2 items-end">
							<UFormField label="Subdominio"
								class="flex-1"
								required>
								<UInput v-model="form.subdomain"
									placeholder="App"
									icon="i-heroicons-globe-alt" />
							</UFormField>
							<span class="mb-2 text-gray-400 font-mono">.</span>
							<UFormField label="Dominio"
								class="flex-1"
								required>
								<UInput v-model="form.domain"
									placeholder="Domain.com" />
							</UFormField>
						</div>

						<!-- Preview del dominio completo -->
						<p v-if="form.subdomain && form.domain"
							class="text-sm text-gray-500 font-mono bg-gray-50 rounded px-3 py-2">
							→ {{ form.subdomain }}.{{ form.domain }}
						</p>

						<UFormField label="Puerto de la aplicación"
							required>
							<UInput v-model.number="form.port"
								type="number"
								placeholder="3000"
								icon="i-heroicons-cpu-chip" />
						</UFormField>
					</div>

					<template #footer>
						<div class="flex justify-end gap-2">
							<UButton color="neutral"
								variant="ghost"
								@click="modals.create = false">
								Cancelar
							</UButton>
							<UButton :loading="saving"
								@click="saveSubdomain">
								Crear subdominio
							</UButton>
						</div>
					</template>
				</UCard>

			</template>
		</UModal>

		<!-- ─── Modal Editar Puerto ─── -->
		<UModal v-model:open="modals.edit">
			<template #content>

				<UCard>
					<template #header>
						<h3 class="font-semibold text-lg">
							Editar — <span class="font-mono text-primary">{{ selectedSub?.fullDomain }}</span>
						</h3>
					</template>

					<UFormField label="Puerto de la aplicación">
						<UInput v-model.number="editPort"
							type="number"
							icon="i-heroicons-cpu-chip" />
					</UFormField>

					<template #footer>
						<div class="flex justify-end gap-2">
							<UButton color="neutral"
								variant="ghost"
								@click="modals.edit = false">
								Cancelar
							</UButton>
							<UButton :loading="saving"
								@click="updateSubdomain">
								Guardar
							</UButton>
						</div>
					</template>
				</UCard>
			</template>
		</UModal>

		<!-- ─── Modal SSL ─── -->
		<UModal v-model:open="modals.ssl">
			<template #content>

				<UCard>
					<template #header>
						<h3 class="font-semibold text-lg">
							Emitir SSL — <span class="font-mono text-green-600">{{ selectedSub?.fullDomain }}</span>
						</h3>
					</template>

					<div class="space-y-4">
						<UAlert color="warning"
							icon="i-heroicons-exclamation-triangle"
							title="Requisitos"
							description="El subdominio debe apuntar a este servidor (DNS configurado) y el sitio debe estar activo en el puerto 80." />
						<UFormField label="Email para Let's Encrypt"
							required>
							<UInput v-model="sslEmail"
								type="email"
								placeholder="admin@tudominio.com"
								icon="i-heroicons-envelope" />
						</UFormField>
					</div>

					<!-- Output del certbot -->
					<div v-if="sslOutput"
						class="mt-4 bg-gray-950 text-green-300 font-mono text-xs rounded p-3 max-h-40 overflow-y-auto">
						<pre>{{ sslOutput }}</pre>
					</div>

					<template #footer>
						<div class="flex justify-end gap-2">
							<UButton color="neutral"
								variant="ghost"
								@click="modals.ssl = false">
								Cerrar
							</UButton>
							<UButton color="success"
								:loading="issuingSSL"
								@click="issueSSL">
								Emitir certificado
							</UButton>
						</div>
					</template>
				</UCard>
			</template>
		</UModal>

		<!-- ─── Modal Config ─── -->
		<UModal v-model:open="modals.config"
			fullscreen>
			<template #content>

				<UCard class="h-full flex flex-col">
					<template #header>
						<h3 class="font-semibold">
							Configuración — <span class="font-mono text-primary">{{ selectedSub?.name }}</span>
						</h3>
					</template>

					<pre class="flex-1 bg-gray-950 text-green-300 font-mono text-sm rounded p-4 overflow-auto">{{ selectedSub?.config }}
	</pre>

					<template #footer>
						<UButton color="neutral"
							@click="modals.config = false">Cerrar</UButton>
					</template>
				</UCard>
			</template>
		</UModal>

		<!-- ─── Modal Confirmar Delete ─── -->
		<UModal v-model="modals.delete">
			<template #content>
				<UCard>
					<template #header>
						<h3 class="font-semibold text-red-600">Eliminar subdominio</h3>
					</template>

					<p class="text-sm text-gray-600">
						¿Estás seguro de eliminar
						<strong class="font-mono">{{ selectedSub?.fullDomain }}</strong>?
						Esta acción no se puede deshacer.
					</p>

					<template #footer>
						<div class="flex justify-end gap-2">
							<UButton color="neutral"
								variant="ghost"
								@click="modals.delete = false">
								Cancelar
							</UButton>
							<UButton color="error"
								:loading="deleting"
								@click="deleteSubdomain">
								Eliminar
							</UButton>
						</div>
					</template>
				</UCard>
			</template>
		</UModal>
	</div>
</template>
