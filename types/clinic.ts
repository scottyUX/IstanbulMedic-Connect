/**
 * Clinic type definitions for Istanbul Medic Connect
 * Defines the structure of data from Google Places API
 */

/**
 * Google Places API raw response from Google
 */
export interface GooglePlacesResponse {
  result: {
    name: string;
    formatted_address: string;
    address_components: AddressComponent[];
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
    formatted_phone_number?: string;
    international_phone_number?: string;
    website?: string;
    rating?: number;
    user_ratings_total?: number;
    opening_hours?: {
      open_now?: boolean;
      periods?: OpeningPeriod[];
      weekday_text?: string[];
    };
    price_level?: number;
    types?: string[];
    photos?: Photo[];
    reviews?: Review[];
    place_id: string;
  };
  status: string;
}

export interface AddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

export interface OpeningPeriod {
  open: {
    day: number;
    time: string;
  };
  close?: {
    day: number;
    time: string;
  };
}

export interface Photo {
  photo_reference: string;
  height: number;
  width: number;
  html_attributions: string[];
}

export interface Review {
  author_name: string;
  rating: number;
  text: string;
  time: number;
  relative_time_description: string;
  language?: string;
  profile_photo_url?: string;
}

/**
 * Cleaned/transformed data from our service
 * This is what YOUR code returns after processing Google's response
 */
export interface GooglePlacesData {
  place_id: string;
  title: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  country_code: string | null;
  lat: number;
  lng: number;
  phone: string | null;
  website: string | null;
  rating: number | null;
  reviews_count: number | null;
  opening_hours: Record<string, any> | null;
  price_range: string | null;
  categories: string[];
  image_url: string | null;
  raw_response: GooglePlacesResponse;
}