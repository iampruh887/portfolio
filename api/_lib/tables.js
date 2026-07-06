export const ALLOWED_TABLES = Object.freeze([
  'profile', 'projects', 'blogs', 'experiences', 'languages', 'skills', 'hero_images',
])

export function isAllowedTable(name) {
  return ALLOWED_TABLES.includes(name)
}
