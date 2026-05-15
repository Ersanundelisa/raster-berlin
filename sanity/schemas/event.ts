import { defineType, defineField } from 'sanity'

export const event = defineType({
  name: 'event',
  title: 'Event',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: r => r.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' }, validation: r => r.required() }),
    defineField({ name: 'venue', title: 'Venue', type: 'reference', to: [{ type: 'gallery' }], validation: r => r.required() }),
    defineField({
      name: 'eventType',
      title: 'Event Type',
      type: 'string',
      options: { list: ['opening', 'finissage', 'talk', 'guided tour', 'performance', 'other'] },
      validation: r => r.required(),
    }),
    defineField({ name: 'date', title: 'Date', type: 'datetime', validation: r => r.required() }),
    defineField({ name: 'description', title: 'Description', type: 'text' }),
    defineField({ name: 'isFree', title: 'Free admission', type: 'boolean', initialValue: true }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'venue.name' },
  },
})
