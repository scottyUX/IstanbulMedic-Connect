export class GooglePlacesService {
  private apiKey: string

  constructor() {
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY!
    if (!this.apiKey) throw new Error('GOOGLE_PLACES_API_KEY is not set')
  }

  async getPlaceDetails(placeId: string) {
    const fields = [
      'place_id', 'name', 'formatted_address', 'address_components',
      'geometry', 'rating', 'user_ratings_total', 'reviews',
      'website', 'formatted_phone_number', 'international_phone_number',
      'opening_hours', 'photos', 'types'
    ].join(',')

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${this.apiKey}`

    const res = await fetch(url)
    const data = await res.json()

    if (data.status !== 'OK') {
      throw new Error(`Google Places API error: ${data.status} for place_id ${placeId}`)
    }

    const r = data.result

    // Extract city, state, country from address components
    let city = '', state = '', country = ''
    for (const component of r.address_components || []) {
      if (component.types.includes('locality')) city = component.long_name
      if (component.types.includes('administrative_area_level_1')) state = component.long_name
      if (component.types.includes('country')) country = component.long_name
    }

    return {
      place_id: r.place_id,
      title: r.name,
      address: r.formatted_address,
      rating: r.rating,
      reviews_count: r.user_ratings_total,
      website: r.website,
      phone: r.formatted_phone_number,
      international_phone: r.international_phone_number,
      lat: r.geometry?.location?.lat,
      lng: r.geometry?.location?.lng,
      opening_hours: r.opening_hours,
      categories: r.types,
      city,
      state,
      country,
      raw_response: data as any,
    }
  }
}