import { defineType, defineField } from 'sanity'
import { withAiDraft } from '../plugins/aiDraft'

export const artist = defineType({
  name: 'artist',
  title: 'Artist',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', validation: r => r.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'name' }, validation: r => r.required() }),
    withAiDraft(defineField({ name: 'bio', title: 'Bio', type: 'text' })),
    defineField({ name: 'nationality', title: 'Nationality', type: 'string' }),
    defineField({ name: 'website', title: 'Website', type: 'url' }),
    defineField({ name: 'images', title: 'Images', type: 'array', of: [{ type: 'image', options: { hotspot: true } }] }),
    defineField({
      name: 'linkedGalleries',
      title: 'Linked Galleries',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'gallery' }] }],
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'nationality', media: 'images.0' },
  },
})
