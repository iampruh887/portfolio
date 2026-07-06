export const ALLOWED_TABLES = [
  'profile', 'projects', 'blogs', 'experiences', 'languages', 'skills', 'hero_images',
]

export function isAllowedTable(name) {
  return ALLOWED_TABLES.includes(name)
}
