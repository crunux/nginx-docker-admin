export default defineNuxtRouteMiddleware((to) => {
	const token = useCookie('admin_token')
	if (!token.value && to.path !== '/login') {
		return navigateTo('/login')
	}
})
