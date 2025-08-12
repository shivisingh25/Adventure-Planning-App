import { PlaceSearchResult } from '@/types';
import axios from 'axios';

const GH_BASE = 'https://graphhopper.com/api/1';

export class PlaceSearchService {
  private static instance: PlaceSearchService;

  static getInstance(): PlaceSearchService {
    if (!PlaceSearchService.instance) {
      PlaceSearchService.instance = new PlaceSearchService();
    }
    return PlaceSearchService.instance;
  }

  async searchPlaces(
    query: string,
    currentLocation?: { latitude: number; longitude: number }
  ): Promise<PlaceSearchResult[]> {
    if (!query || !query.trim()) {
      console.warn("Empty query passed to searchPlaces");
      return [];
    }

    try {
      const params: any = {
        q: query,
        key: process.env.EXPO_PUBLIC_GRAPHHOPPER_API_KEY,
        limit: 10,
      };

      if (currentLocation) {
        params.point = `${currentLocation.latitude},${currentLocation.longitude}`;
      }

      console.log("GH searchPlaces params:", params);

      const { data } = await axios.get(`${GH_BASE}/geocode`, { params });

      if (!data.hits) return [];

      return this.mapResults(data.hits, currentLocation);
    } catch (error: any) {
      console.error('Error fetching places:', error.response?.data || error.message);
      return [];
    }
  }

  async searchNearbyPlaces(
    location: { latitude: number; longitude: number },
    radius: number = 5000,
    types?: string[]
  ): Promise<PlaceSearchResult[]> {
    try {
      const params: any = {
        point: `${location.latitude},${location.longitude}`,
        reverse: true, // Needed for nearby without q
        key: process.env.EXPO_PUBLIC_GRAPHHOPPER_API_KEY,
        limit: 10,
      };

      console.log("GH searchNearbyPlaces params:", params);

      const { data } = await axios.get(`${GH_BASE}/geocode`, { params });

      if (!data.hits) return [];

      const filtered = types
        ? data.hits.filter((place: any) => types.includes(place.osm_value))
        : data.hits;

      return this.mapResults(filtered, location);
    } catch (error: any) {
      console.error('Error fetching nearby places:', error.response?.data || error.message);
      return [];
    }
  }

  /** 🔹 Helper method for mapping GraphHopper hits into PlaceSearchResult[] */
  private mapResults(hits: any[], origin?: { latitude: number; longitude: number }): PlaceSearchResult[] {
    return hits.map((place: any) => ({
      id: place.osm_id?.toString() || place.name,
      name: place.name,
      address: place.street
        ? `${place.street}, ${place.city || ''}, ${place.country || ''}`
        : place.city || place.country || '',
      coordinates: {
        latitude: place.point.lat,
        longitude: place.point.lng,
      },
      rating: undefined,
      types: [place.osm_value || 'place'],
      distance: origin
        ? this.calculateDistance(
            origin.latitude,
            origin.longitude,
            place.point.lat,
            place.point.lng
          )
        : undefined,
    }));
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
