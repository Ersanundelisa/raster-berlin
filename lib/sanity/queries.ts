export const galleryListQuery = `
  *[_type == "gallery"] | order(name asc) {
    _id, name, slug, venueType, neighborhood, address, coordinates, hours, website,
    "coverImage": images[0]
  }
`

export const galleryBySlugQuery = `
  *[_type == "gallery" && slug.current == $slug][0] {
    _id, name, slug, venueType, neighborhood, address, coordinates, hours, about, website, images,
    "currentExhibitions": *[_type == "exhibition" && references(^._id) && startDate <= now() && (endDate >= now() || !defined(endDate))] {
      _id, title, slug, startDate, endDate, description, images,
      "artists": artists[]->{ name, slug }
    },
    "upcomingEvents": *[_type == "event" && references(^._id) && date >= now()] | order(date asc) {
      _id, title, slug, eventType, date, description, isFree
    }
  }
`

export const featuredExhibitionsQuery = `
  *[_type == "exhibition" && featured == true] | order(startDate desc) [0...6] {
    _id, title, slug, startDate, endDate, "images": images[0...1],
    "venue": venue->{ name, slug, neighborhood }
  }
`

export const upcomingEventsQuery = `
  *[_type == "event" && date >= now()] | order(date asc) {
    _id, title, slug, eventType, date, description, isFree,
    "venue": venue->{ name, slug, neighborhood, address }
  }
`

export const allEventsQuery = `
  *[_type == "event"] | order(date desc) {
    _id, title, slug, eventType, date, description, isFree,
    "venue": venue->{ name, slug, neighborhood, address }
  }
`

export const eventBySlugQuery = `
  *[_type == "event" && slug.current == $slug][0] {
    _id, title, slug, eventType, date, description, isFree,
    "venue": venue->{ _id, name, slug, neighborhood, address, hours }
  }
`

export const newsListQuery = `
  *[_type == "newsArticle"] | order(publishedAt desc) {
    _id, title, slug, publishedAt, tags, coverImage
  }
`

export const newsBySlugQuery = `
  *[_type == "newsArticle" && slug.current == $slug][0] {
    _id, title, slug, publishedAt, tags, coverImage, body
  }
`

export const artistListQuery = `
  *[_type == "artist"] | order(name asc) {
    _id, name, slug, nationality, "coverImage": images[0],
    "linkedGalleries": linkedGalleries[]->{ name, slug }
  }
`

export const artistBySlugQuery = `
  *[_type == "artist" && slug.current == $slug][0] {
    _id, name, slug, bio, nationality, website, images,
    "linkedGalleries": linkedGalleries[]->{ name, slug },
    "currentExhibitions": *[_type == "exhibition" && references(^._id) && startDate <= now() && (endDate >= now() || !defined(endDate))] {
      title, slug, "venue": venue->{ name, slug }
    }
  }
`

export const mapVenuesQuery = `
  *[_type == "gallery" && defined(coordinates.lat)] {
    _id, name, slug, venueType, neighborhood, coordinates, hours,
    "coverImage": images[0],
    "currentExhibition": *[_type == "exhibition" && references(^._id) && startDate <= now() && (endDate >= now() || !defined(endDate))][0] {
      title, slug
    }
  }
`
