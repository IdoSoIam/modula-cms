export const useTheme = () => {
  const theme = useState('theme', () => 'light')

  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    if (theme.value === 'light') {
      localStorage.removeItem('theme')
    } else {
      localStorage.setItem('theme', theme.value)
    }
    document.documentElement.setAttribute('data-theme', theme.value)
  }

  return {
    theme,
    toggleTheme
  }
}
