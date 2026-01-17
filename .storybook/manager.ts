import { addons } from '@storybook/manager-api'
import { SET_CONFIG, SET_GLOBALS, GLOBALS_UPDATED } from '@storybook/core-events'
import { themes } from '@storybook/theming'

const applyTheme = (themeName) => {
  const theme = themeName === 'dark' ? themes.dark : themes.light
  addons.setConfig({ theme })
}

const channel = addons.getChannel()

const FORCE_THEME = 'dark'

applyTheme(FORCE_THEME)

channel.on(SET_CONFIG, (payload) => {
  const themeBase = payload?.theme?.base ?? null
  if (themeBase !== FORCE_THEME) {
    applyTheme(FORCE_THEME)
  }
})

channel.on(SET_GLOBALS, (payload) => {
  const theme = payload?.globals?.theme
  if (theme !== FORCE_THEME) {
    applyTheme(FORCE_THEME)
  }
})

channel.on(GLOBALS_UPDATED, (payload) => {
  const theme = payload?.globals?.theme
  if (theme !== FORCE_THEME) {
    applyTheme(FORCE_THEME)
  }
})
