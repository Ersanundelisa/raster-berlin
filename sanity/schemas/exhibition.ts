import { defineType, defineField } from 'sanity'

export const exhibition = defineType({
  name: 'exhibition',
  title: 'Exhibition',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: r => r.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' }, validation: r => r.required() }),
    defineField({ name: 'venue', title: 'Venue', type: 'reference', to: [{ type: 'gallery' }], validation: r => r.required() }),
    defineField({ name: 'artists', title: 'Artists', type: 'array', of: [{ type: 'reference', to: [{ type: 'artist' }] }] }),
    defineField({ name: 'startDate', title: 'Start Date', type: 'date', validation: r => r.required() }),
    defineField({ name: 'endDate', title: 'End Date', type: 'date' }),
    defineField({ name: 'description', title: 'Description', type: 'array', of: [{ type: 'block' }] }),
    defineField({ name: 'images', title: 'Images', type: 'array', of: [{ type: 'image', options: { hotspot: true } }] }),
    defineField({ name: 'featured', title: 'Featured on landing page', type: 'boolean', initialValue: false }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'venue.name', media: 'images.0' },
  },
})
