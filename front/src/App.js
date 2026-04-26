import ToolsPage from './pages/tools/ToolsPage.vue'

export default {
  name: 'App',
  components: {
    ToolsPage,
  },
  setup() {
    const startYear = 2026
    const currentYear = new Date().getFullYear()
    const copyrightYear = currentYear <= startYear ? String(startYear) : `${startYear}-${currentYear}`

    return {
      copyrightYear,
    }
  },
}
