import { defineType, defineField } from 'sanity'

export const gallery = defineType({
  name: 'gallery',
  title: 'Gallery / Museum',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', validation: r => r.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'name' }, validation: r => r.required() }),
    defineField({
      name: 'venueType',
      title: 'Type',
      type: 'string',
      options: { list: ['gallery', 'museum'], layout: 'radio' },
      validation: r => r.required(),
    }),
    defineField({
      name: 'neighborhood',
      title: 'Neighborhood',
      type: 'string',
      options: {
        list: ['Mitte', 'Prenzlauer Berg', 'Kreuzberg', 'Friedrichshain', 'Charlottenburg', 'Schöneberg', 'Neukölln', 'Wedding', 'Tiergarten', 'Other'],
      },
    }),
    defineField({ name: 'address', title: 'Address', type: 'string', validation: r => r.required() }),
    defineField({
      name: 'coordinates',
      title: 'Coordinates (auto-filled by webhook)',
      type: 'object',
      fields: [
        defineField({ name: 'lat', title: 'Latitude', type: 'number' }),
        defineField({ name: 'lng', title: 'Longitude', type: 'number' }),
      ],
    }),
    defineField({
      name: 'hours',
      title: 'Opening Hours',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'e.g. ["Tue–Sat 11:00–18:00", "Sun 12:00–17:00"]',
    }),
    defineField({ name: 'about', title: 'About', type: 'text' }),
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      of: [{ type: 'image', options: { hotspot: true } }],
    }),
    defineField({ name: 'website', title: 'Website', type: 'url' }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'venueType', media: 'images.0' },
  },
})
