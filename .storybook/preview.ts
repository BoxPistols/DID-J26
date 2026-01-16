import { themes } from '@storybook/theming'

const preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i
      },
      sort: 'requiredFirst'
    },
    options: {
      storySort: (a, b) => {
        const toComparable = (entry) => {
          const value = Array.isArray(entry) ? entry[1] : entry
          return {
            title: value?.title ?? '',
            name: value?.name ?? ''
          }
        }
        const left = toComparable(a)
        const right = toComparable(b)
        const titleComparison = left.title.localeCompare(right.title, 'ja', { numeric: true })
        if (titleComparison !== 0) {
          return titleComparison
        }
        return left.name.localeCompare(right.name, 'ja', { numeric: true })
      }
    },
    docs: {
      toc: {
        headingSelector: 'h2, h3',
        title: 'Contents'
      },
      theme: themes.dark
    },
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0f172a' },
        { name: 'light', value: '#ffffff' }
      ]
    }
  }
}

export default preview
