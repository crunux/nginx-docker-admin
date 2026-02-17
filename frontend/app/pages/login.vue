<script setup lang="ts">
	definePageMeta({ layout: false })

	const auth = useAuthStore()
	const loading = ref(false)
	const form = reactive({ username: '', password: '' })

	async function handleLogin() {
		loading.value = true
		try {
			await auth.login(form.username, form.password)
		} finally {
			loading.value = false
		}
	}
</script>
<template>
	<div class="min-h-screen flex items-center justify-center bg-gray-100">
		<UCard class="w-full max-w-sm">
			<template #header>
				<h1 class="text-xl font-bold text-center">
					Nginx Admin
				</h1>
			</template>

			<UForm :state="form"
				class="space-y-4"
				@submit="handleLogin">
				<UFormField label="Usuario">
					<UInput v-model="form.username" />
				</UFormField>
				<UFormField label="Contraseña">
					<UInput v-model="form.password"
						type="password" />
				</UFormField>
				<UButton type="submit"
					block
					:loading="loading">
					Entrar
				</UButton>
			</UForm>
		</UCard>
	</div>
</template>
