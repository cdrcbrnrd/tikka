export type ThemeId = 'foret' | 'nuit' | 'braise' | 'lcd'

export type Theme = {
  id: ThemeId
  name: string
  // the run screen draws a watch dial instead of the progress ring
  dial?: boolean
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
    id: 'lcd',
    name: 'F-91W',
    swatch: ['#0f1012', '#deefed', '#c9b673'],
    dial: true,
  },
  {
    id: 'braise',
    name: 'Braise',
    swatch: ['#1c1714', '#f4ece3', '#2bd9a0'],
  },
]

export const DEFAULT_THEME: ThemeId = 'foret'

export function hasDial(theme: ThemeId): boolean {
  return THEMES.find((item) => item.id === theme)?.dial === true
}
