<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'

const { get, post, put, delete: del } = useApi()

type Sites = {
	name: string
	config: string
	enabled: boolean
}

const sites = ref<Sites[]>([])
const openCreate = ref(false)
const openSsl = ref(false)
const editMode = ref(false)
const saving = ref(false)
const issuing = ref(false)
const sslDomain = ref('')
const sslEmail = ref('')
const siteForm = reactive({ name: '', domain: '', port: 3000, config: '' })

const columns: TableColumn<Sites>[] = [
	{ accessorKey: 'name', header: 'Nombre' },
	{ accessorKey: 'enabled', header: 'Activo' },
	{ id: 'actions', header: 'Acciones' }
]

async function loadSites() {
	sites.value = await get<Sites[]>('/api/sites')
}

async function toggleSite(site: Sites) {
	if (site.enabled) await post(`/api/sites/${site.name}/disable`, {})
	else await post(`/api/sites/${site.name}/enable`, {})
	await loadSites()
}

function editSite(site: Sites) {
	Object.assign(siteForm, { name: site.name, config: site.config })
	editMode.value = true
	openCreate.value = true
}

async function saveSite() {
	saving.value = true
	try {
		if (editMode.value) {
			await put(`/api/sites/${siteForm.name}`, { config: siteForm.config })
		} else {
			await post('/api/sites', siteForm)
		}
		openCreate.value = false
		await loadSites()
	} finally {
		saving.value = false
	}
}

async function deleteSite(name: string) {
	if (!confirm(`¿Eliminar ${name}?`)) return
	await del(`/api/sites/${name}`)
	await loadSites()
}

async function issueSsl() {
	issuing.value = true
	try {
		const res = await post<{ result: string }>('/api/ssl/issue', {
			domain: sslDomain.value,
			email: sslEmail.value
		})
		alert(res.result)
		openSsl.value = false
	} finally {
		issuing.value = false
	}
}

onMounted(loadSites)
</script>

<template>
	<div class="p-6 space-y-6">
		<div class="flex justify-between items-center">
			<h2 class="text-2xl font-bold">
				Sitios Nginx
			</h2>
			<div class="flex justify-center items-center gap-1">
				<UButton
					icon="i-heroicons-plus"
					@click="openCreate = true"
				>
					Nuevo sitio
				</UButton>
			</div>
		</div>

		<UTable
			:rows="sites"
			:columns="columns"
			i
		>
			<template #enabled-data="{ row }">
				<UToggle
					:model-value="row.getValue('enabled')"
					@update:model-value="toggleSite(row as unknown as Sites)"
				/>
			</template>
			<template #actions-data="{ row }">
				<div class="flex gap-2">
					<UButton
						size="xs"
						icon="i-heroicons-pencil"
						@click="editSite(row as unknown as Sites)"
					/>
					<UButton
						size="xs"
						icon="i-heroicons-shield-check"
						color="success"
						@click="sslDomain = row.getValue('name'); openSsl = true"
					/>
					<UButton
						size="xs"
						icon="i-heroicons-trash"
						color="error"
						@click="deleteSite(row.getValue('name'))"
					/>
				</div>
			</template>
		</UTable>

		<!-- Modal crear/editar -->
		<UModal v-model:open="openCreate">
			<template #content>
				<UCard>
					<template #header>
						{{ editMode ? 'Editar' : 'Nuevo' }} sitio
					</template>
					<div class="space-y-4 flex flex-col gap-2">
						<UFormField label="Dominio">
							<UInput
								v-model="siteForm.domain"
								:ui="{ root: 'w-full' }"
								placeholder="ejemplo.com"
							/>
						</UFormField>
						<div class="w-full flex flex-col md:flex-row gap-4">
							<UFormField label="Nombre">
								<UInput
									v-model="siteForm.name"
									:ui="{ root: 'w-full' }"
									:disabled="editMode"
								/>
							</UFormField>
							<UFormField label="Puerto app">
								<UInput
									v-model.number="siteForm.port"
									:ui="{ root: 'w-full' }"
									type="number"
									placeholder="3000"
								/>
							</UFormField>
						</div>
						<UFormField label="Config manual (opcional)">
							<UTextarea
								v-model="siteForm.config"
								:ui="{ root: 'w-full' }"
								:rows="10"
								class="font-mono text-sm"
							/>
						</UFormField>
					</div>
					<template #footer>
						<UButton
							:loading="saving"
							@click="saveSite"
						>
							Guardar
						</UButton>
					</template>
				</UCard>
			</template>
		</UModal>

		<!-- Modal SSL -->
		<UModal v-model:open="openSsl">
			<template #content>
				<UCard>
					<template #header>
						Emitir SSL — {{ sslDomain }}
					</template>
					<UFormField label="Email para Let's Encrypt">
						<UInput
							v-model="sslEmail"
							type="email"
						/>
					</UFormField>
					<template #footer>
						<UButton
							:loading="issuing"
							color="success"
							@click="issueSsl"
						>
							Emitir certificado
						</UButton>
					</template>
				</UCard>
			</template>
		</UModal>
	</div>
</template>
