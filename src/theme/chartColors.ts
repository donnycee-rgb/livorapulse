// Chart colours: each has a light-mode and a dark-mode step of the same hue.
// The sets used together were checked with the dataviz palette validator
// (lightness band, chroma, colour-blind separation, contrast) against the
// light card (#FFFFFF) and the dark card (#0E1A2B):
//   Home:      steps · focus · screen       light 22C55E 8B5CF6 0EA5E9 | dark 16A34A 7C3AED 0284C7
//   Digital:   social · work · fun          light F43F5E 0EA5E9 8B5CF6 | dark E11D48 0284C7 8B5CF6
//   Transport: walking · cycling · driving  light 22C55E 0EA5E9 F97316 | dark 16A34A 0284C7 EA580C
// Light-mode greens and blues sit under 3:1 against white, so every chart
// keeps a legend and labelled tooltips (the validator's "relief required").

export type Duo = { light: string; dark: string }

export const pick = (c: Duo, dark: boolean) => (dark ? c.dark : c.light)

export const CHART = {
  green: { light: '#22C55E', dark: '#16A34A' },
  violet: { light: '#8B5CF6', dark: '#7C3AED' },
  violetSoft: { light: '#8B5CF6', dark: '#8B5CF6' },
  sky: { light: '#0EA5E9', dark: '#0284C7' },
  rose: { light: '#F43F5E', dark: '#E11D48' },
  orange: { light: '#F97316', dark: '#EA580C' },
  teal: { light: '#10B981', dark: '#059669' },
  pink: { light: '#EC4899', dark: '#DB2777' },
  indigo: { light: '#6366F1', dark: '#6366F1' },
} as const satisfies Record<string, Duo>
