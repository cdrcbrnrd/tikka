export type ThemeId = 'foret' | 'nuit' | 'braise'

export type Theme = {
  id: ThemeId
  name: string
  // the three colours that carry the ambiance, shown as swatches in the picker
  swatch: [string, string, string]
}

export const THEMES: Theme[] = [
  {
    id: 'foret',
    name: 'Forêt',
    swatch: ['#16231c', '#f2eadf', '#ff2e88'],
  },
  {
    id: 'nuit',
    name: 'Nuit',
    swatch: ['#12161f', '#eef1f7', '#ff6a3d'],
  },
  {
    id: 'braise',
    name: 'Braise',
    swatch: ['#1c1714', '#f4ece3', '#2bd9a0'],
  },
]

export const DEFAULT_THEME: ThemeId = 'foret'
