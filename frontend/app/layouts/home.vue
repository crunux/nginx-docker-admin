<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()

const menuItems = computed<NavigationMenuItem[]>(() => [
	{
		label: 'Home',
		icon: 'i-heroicons-home',
		to: '/',
		active: route.path.startsWith('/dashboard') && !route.path.startsWith('/dashboard/sites') && !route.path.startsWith('/dashboard/subdomains') && !route.path.startsWith('/dashboard/docker') && !route.path.startsWith('/dashboard/logs') && !route.path.startsWith('/dashboard/config')
	},
	{
		label: 'Login',
		icon: 'i-heroicons-user',
		to: '/login',
		active: route.path.startsWith('/login')
	}
])
</script>

<template>
	<UApp>
		<UHeader
			mode="slideover"
			class="w-full"
			title="SiteCore"
		>
			<UNavigationMenu :items="menuItems" />
			<template #right>
				<UButton
					color="neutral"
					variant="ghost"
					to="https://github.com/crunux/nginx-docker-admin"
					target="_blank"
					icon="i-simple-icons-github"
					aria-label="GitHub"
				/>
			</template>
			<template #body>
				<UNavigationMenu
					:items="menuItems"
					orientation="vertical"
					class="-mx-2.5"
				/>
			</template>
		</UHeader>
		<UMain>
			<slot />
		</UMain>
	</UApp>
</template>
