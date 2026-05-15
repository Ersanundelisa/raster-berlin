import { SchemaTypeDefinition } from 'sanity'
import { gallery } from './gallery'
import { exhibition } from './exhibition'
import { event } from './event'
import { newsArticle } from './newsArticle'
import { artist } from './artist'

export const schemaTypes: SchemaTypeDefinition[] = [
  gallery,
  exhibition,
  event,
  newsArticle,
  artist,
]
