const TECH_ICONS: ReadonlyArray<[string, string]> = [
  ['next', 'nextjs'],
  ['react', 'react'],
  ['typescript', 'ts'],
  ['tailwind', 'tailwind'],
  ['node', 'nodejs'],
  ['express', 'express'],
  ['prisma', 'prisma'],
  ['postgres', 'postgres'],
  ['vite', 'vite'],
]

export const getTechIcon = (technology: string) => {
  const normalized = technology.toLowerCase()
  if (normalized === 'css') return 'css'
  return TECH_ICONS.find(([needle]) => normalized.includes(needle))?.[1] ?? null
}
