import type {
  GooglePlacesResponse,
  GooglePlacesData,
  AddressComponent,
} from '@/types/clinic';

/**
 * Service for interacting with Google Places API
 */
export class GooglePlacesService {
  private apiKey: string;
  private baseUrl = 'https://maps.googleapis.com/maps/api/place/details/json';

  constructor() {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_PLACES_API_KEY is not configured');
    }
    this.apiKey = apiKey;
  }

  /**
   * Fetch place details from Google Places API
   * @param placeId - Google Place ID
   * @returns Structured place data with up to 5 reviews
   */
  async getPlaceDetails(placeId: string): Promise<GooglePlacesData> {
    if (!placeId || typeof placeId !== 'string') {
      throw new Error('Invalid place_id provided');
    }

    // Comprehensive field list as recommended in the mapping doc
    const fields = [
      'place_id',
      'name',
      'formatted_address',
      'address_components',
      'geometry',
      'formatted_phone_number',
      'international_phone_number',
      'website',
      'rating',
      'user_ratings_total',
      'opening_hours',
      'price_level',
      'types',
      'photos',
      'reviews',
    ].join(',');

    const url = `${this.baseUrl}?place_id=${encodeURIComponent(placeId)}&fields=${fields}&key=${this.apiKey}`;

    try {
      console.log(`Fetching Google Places data for place_id: ${placeId}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Google Places API request failed: ${response.status} ${response.statusText}`);
      }

      const data: GooglePlacesResponse = await response.json();

      if (data.status !== 'OK') {
        console.error(`Google Places API returned status: ${data.status}`);
        throw new Error(`Google Places API error: ${data.status}`);
      }

      console.log(`Successfully fetched data for: ${data.result.name}`);

      // Transform and return structured data
      return this.transformPlaceData(data);
    } catch (error) {
      console.error('Error fetching Google Places data:', error);
      throw error;
    }
  }

  /**
   * Transform Google Places API response to our clinic model
   * @param response - Raw Google Places API response
   * @returns Structured clinic data
   */
  private transformPlaceData(response: GooglePlacesResponse): GooglePlacesData {
    const result = response.result;

    // Extract address components
    const addressInfo = this.extractAddressComponents(result.address_components);

    // Map price level to price range
    const priceRange = this.mapPriceLevel(result.price_level);

    // Get first photo URL if available
    const imageUrl = result.photos && result.photos.length > 0
      ? this.getPhotoUrl(result.photos[0].photo_reference)
      : null;

    return {
      place_id: result.place_id,
      title: result.name,
      address: result.formatted_address || null,
      city: addressInfo.city,
      state: addressInfo.state,
      country: addressInfo.country,
      country_code: addressInfo.country_code,
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      phone: result.formatted_phone_number || result.international_phone_number || null,
      website: result.website || null,
      rating: result.rating || null,
      reviews_count: result.user_ratings_total || null,
      opening_hours: result.opening_hours || null,
      price_range: priceRange,
      categories: result.types || [],
      image_url: imageUrl,
      raw_response: response,
    };
  }

  /**
   * Extract city, state, country from address components
   * @param components - Address components from Google Places API
   * @returns Extracted address information
   */
  private extractAddressComponents(components: AddressComponent[] = []) {
    let city: string | null = null;
    let state: string | null = null;
    let country: string | null = null;
    let country_code: string | null = null;

    for (const component of components) {
      // Extract city (locality or sublocality)
      if (component.types.includes('locality')) {
        city = component.long_name;
      } else if (!city && component.types.includes('sublocality')) {
        city = component.long_name;
      }

      // Extract state/province
      if (component.types.includes('administrative_area_level_1')) {
        state = component.long_name;
      }

      // Extract country
      if (component.types.includes('country')) {
        country = component.long_name;
        country_code = component.short_name;
      }
    }

    return { city, state, country, country_code };
  }

  /**
   * Map Google Places price_level (0-4) to our price range format
   * @param priceLevel - Price level from Google Places (0-4)
   * @returns Price range string
   */
  private mapPriceLevel(priceLevel?: number): string | null {
    if (priceLevel === undefined || priceLevel === null) {
      return null;
    }

    const priceMap: Record<number, string> = {
      0: 'Free',
      1: '$',
      2: '$$',
      3: '$$$',
      4: '$$$$',
    };

    return priceMap[priceLevel] || null;
  }

  /**
   * Generate photo URL from photo reference
   * @param photoReference - Photo reference from Google Places
   * @param maxWidth - Maximum width of the photo (default: 800)
   * @returns Photo URL
   */
  private getPhotoUrl(photoReference: string, maxWidth: number = 800): string {
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${this.apiKey}`;
  }
}