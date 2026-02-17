
export const useAuthStore = defineStore('auth', () => {
  const token = useCookie('admin_token')
  const { post } = useApi()

  const isLoggedIn = computed(() => !!token.value)

  async function login(username: string, password: string) {
    const res = await post<{ token: string }>('/api/auth/login', { username, password })
    token.value = res.token
    await navigateTo('/dashboard')
  }

  function logout() {
    token.value = null
    navigateTo('/login')
  }

  return { isLoggedIn, login, logout }
})
