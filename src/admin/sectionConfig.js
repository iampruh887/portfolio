// Field types: text | textarea | number | checkbox | date | image | tags | select
export const SECTIONS = {
  profile: {
    label: 'Profile',
    single: true,
    fields: [
      { name: 'name', type: 'text' },
      { name: 'tagline', type: 'text' },
      { name: 'bio', type: 'textarea' },
      { name: 'avatar_url', type: 'image' },
      { name: 'github_username', type: 'text' },
      { name: 'email', type: 'text' },
      { name: 'linkedin_url', type: 'text' },
      { name: 'education', type: 'textarea' },
      { name: 'resume_url', type: 'text' },
    ],
  },
  projects: {
    label: 'Projects',
    titleField: 'title',
    fields: [
      { name: 'title', type: 'text', required: true },
      { name: 'description', type: 'textarea' },
      { name: 'tech', type: 'tags' },
      { name: 'repo_url', type: 'text' },
      { name: 'live_url', type: 'text' },
      { name: 'image_url', type: 'image' },
      { name: 'date_label', type: 'text' },
      { name: 'featured', type: 'checkbox' },
    ],
  },
  blogs: {
    label: 'Blogs',
    titleField: 'title',
    fields: [
      { name: 'title', type: 'text', required: true },
      { name: 'slug', type: 'text' },
      { name: 'content', type: 'textarea' },
      { name: 'cover_image_url', type: 'image' },
      { name: 'published_at', type: 'date' },
    ],
  },
  experiences: {
    label: 'Experience',
    titleField: 'role',
    fields: [
      { name: 'role', type: 'text', required: true },
      { name: 'org', type: 'text' },
      { name: 'location', type: 'text' },
      { name: 'description', type: 'textarea' },
      { name: 'start_date', type: 'date' },
      { name: 'end_date', type: 'date' },
      { name: 'is_current', type: 'checkbox' },
      { name: 'kind', type: 'select', options: ['work', 'activity'] },
    ],
  },
  languages: {
    label: 'Languages',
    titleField: 'name',
    fields: [
      { name: 'name', type: 'text', required: true },
      { name: 'rating', type: 'number', min: 1, max: 5 },
    ],
  },
  skills: {
    label: 'Skills',
    titleField: 'name',
    fields: [
      { name: 'name', type: 'text', required: true },
      { name: 'category', type: 'select', options: ['language','framework','library','ai_tool','dev_tool','other'] },
      { name: 'icon_slug', type: 'text' },
    ],
  },
  hero_images: {
    label: 'Hero images',
    titleField: 'caption',
    fields: [
      { name: 'image_url', type: 'image', required: true },
      { name: 'caption', type: 'text' },
    ],
  },
}
