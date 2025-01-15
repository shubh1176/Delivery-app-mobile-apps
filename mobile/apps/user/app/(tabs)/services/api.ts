import api from '../../../services/api';
import type { 
  Address,
  Contact,
  Drop,
  OrderPricing,
  PackageDetails,
  Pickup,
  PickupDropOrder 
} from '../../../app/types/order';
import type { 
  APIResponse,
  Place,
  Route,
  EstimatePickupDropRequest, 
  EstimatePickupDropResponse,
  CreatePickupDropRequest
} from '../../../app/types/api';

const MAPBOX_TOKEN = 'pk.eyJ1Ijoic2h1YmhoMTE3NiIsImEiOiJjbHltcHB0czcxbGJtMmtyM2FiZm5rejRyIn0.NMnH_YW5Qbohp3PC5tEL5g';
const MAPBOX_BASE_URL = 'https://api.mapbox.com';

const makeMapboxRequest = async (url: string) => {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('[Mapbox] Error details:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
        url: url.split('?')[0], // Log URL without token
      });
      throw new Error(
        errorData?.message || `Mapbox API error: ${response.status} ${response.statusText}`
      );
    }
    return response.json();
  } catch (error) {
    console.error('[Mapbox] Request failed:', error);
    throw error;
  }
};

export const LocationAPI = {
  async searchPlaces(query: string, proximity?: { latitude: number; longitude: number }) {
    if (!query?.trim()) {
      return [];
    }

    try {
      const params = new URLSearchParams({
        access_token: MAPBOX_TOKEN,
        types: 'address,poi,place',
        limit: '8',
        language: 'en',
        country: 'in',
        autocomplete: 'true',
        fuzzyMatch: 'true',
        ...(proximity && {
          proximity: `${proximity.longitude},${proximity.latitude}`,
        }),
      });

      const url = `${MAPBOX_BASE_URL}/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params.toString()}`;
      const data = await makeMapboxRequest(url);
      
      if (!data.features?.length) {
        return [];
      }

      return data.features.map((feature: any) => {
        // Extract address components
        const contextParts = feature.context || [];
        const locality = contextParts.find((ctx: any) => ctx.id.startsWith('locality'))?.text;
        const district = contextParts.find((ctx: any) => ctx.id.startsWith('district'))?.text;
        const postcode = contextParts.find((ctx: any) => ctx.id.startsWith('postcode'))?.text;
        const state = contextParts.find((ctx: any) => ctx.id.startsWith('region'))?.text;

        // Construct a more readable address
        const addressParts = [
          feature.text,
          feature.address,
          locality,
          district,
          state,
          postcode
        ].filter(Boolean);

        return {
          id: feature.id,
          name: feature.text,
          address: feature.place_name,
          fullAddress: addressParts.join(', '),
          coordinates: {
            latitude: feature.center[1],
            longitude: feature.center[0],
          },
          type: feature.place_type[0],
          context: {
            locality,
            district,
            state,
            postcode,
          }
        };
      });
    } catch (error) {
      console.error('[LocationAPI] Search error:', error);
      throw error;
    }
  },

  async reverseGeocode(coordinates: { latitude: number; longitude: number }): Promise<Address> {
    try {
      const params = new URLSearchParams({
        access_token: MAPBOX_TOKEN,
        types: 'address',
        language: 'en',
        limit: '1',
      });

      const url = `${MAPBOX_BASE_URL}/geocoding/v5/mapbox.places/${coordinates.longitude},${coordinates.latitude}.json?${params.toString()}`;
      const data = await makeMapboxRequest(url);
      
      if (!data.features?.length) {
        throw new Error('No address found at this location');
      }

      const feature = data.features[0];
      const contextParts = feature.context || [];
      
      // Extract address components
      const locality = contextParts.find((ctx: any) => ctx.id.startsWith('locality'))?.text;
      const district = contextParts.find((ctx: any) => ctx.id.startsWith('district'))?.text;
      const postcode = contextParts.find((ctx: any) => ctx.id.startsWith('postcode'))?.text || '';
      const state = contextParts.find((ctx: any) => ctx.id.startsWith('region'))?.text;

      // Construct a more detailed address
      const addressParts = [
        feature.text,
        feature.address,
        locality,
        district,
        state,
        postcode
      ].filter(Boolean);

      return {
        full: addressParts.join(', '),
        coordinates: {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
        },
        pincode: postcode,
        landmark: locality || '',
      };
    } catch (error) {
      console.error('[LocationAPI] Reverse geocoding error:', error);
      throw error;
    }
  },

  async getRoute(params: {
    origin: { latitude: number; longitude: number };
    destination: { latitude: number; longitude: number };
    waypoints?: Array<{ latitude: number; longitude: number }>;
  }) {
    try {
      const coordinates = [
        `${params.origin.longitude},${params.origin.latitude}`,
        ...(params.waypoints?.map(wp => `${wp.longitude},${wp.latitude}`) || []),
        `${params.destination.longitude},${params.destination.latitude}`,
      ].join(';');

      const queryParams = new URLSearchParams({
        access_token: MAPBOX_TOKEN,
        geometries: 'geojson',
        overview: 'full',
      });

      const url = `${MAPBOX_BASE_URL}/directions/v5/mapbox/driving/${coordinates}?${queryParams.toString()}`;
      const data = await makeMapboxRequest(url);
      const route = data.routes[0];

      return {
        distance: route.distance / 1000, // Convert to kilometers
        duration: route.duration / 60, // Convert to minutes
        polyline: route.geometry,
        waypoints: route.legs.flatMap((leg: any) => [
          { latitude: leg.steps[0].maneuver.location[1], longitude: leg.steps[0].maneuver.location[0] },
        ]),
      };
    } catch (error) {
      console.error('[LocationAPI] Route error:', error);
      throw error;
    }
  },
};

export const OrderAPI = {
  estimatePickupDrop: async (request: EstimatePickupDropRequest): Promise<EstimatePickupDropResponse> => {
    try {
      console.log('[OrderAPI] Estimating pickup-drop with:', request);
      const response = await api.post('/orders/pickup-drop/estimate', {
        pickup: {
          address: request.pickup.address,
          package: request.pickup.package,
        },
        drops: request.drops.map(drop => ({
          address: drop.address,
          sequence: drop.sequence,
        })),
      });

      console.log('[OrderAPI] Estimate response:', response.data);

      if (response.data.status === 'success') {
        return response.data;
      }

      throw new Error('Failed to get estimate');
    } catch (error: any) {
      console.error('[OrderAPI] Estimate error:', error.response || error);
      throw error;
    }
  },

  async createPickupDrop(params: CreatePickupDropRequest) {
    try {
      console.log('[OrderAPI] Creating pickup-drop order:', params);
      const response = await api.post<APIResponse<PickupDropOrder>>('/orders/pickup-drop/create', params);
      console.log('[OrderAPI] Order created:', response.data);
      return response.data.data;
    } catch (error: any) {
      console.error('[OrderAPI] Create order error:', error.response || error);
      throw error;
    }
  },

  async getOrderDetails(orderId: string) {
    try {
      console.log('[OrderAPI] Getting order details:', orderId);
      const response = await api.get<APIResponse<PickupDropOrder>>(`/orders/pickup-drop/${orderId}`);
      console.log('[OrderAPI] Order details:', response.data);
      return response.data.data;
    } catch (error: any) {
      console.error('[OrderAPI] Get order error:', error.response || error);
      throw error;
    }
  },

  async getUserOrders(params?: { type?: string; status?: string; page?: number; limit?: number }) {
    try {
      console.log('[OrderAPI] Getting user orders:', params);
      const response = await api.get<APIResponse<{
        orders: Array<{
          id: string;
          type: string;
          status: string;
          createdAt: string;
          pickup: {
            address: string;
            contact: {
              name: string;
              phone: string;
            };
          };
          drop?: {
            address: string;
            contact: {
              name: string;
              phone: string;
            };
          };
          amount: number;
          currency: string;
        }>;
        pagination: {
          total: number;
          page: number;
          limit: number;
          pages: number;
        };
      }>>('/orders', { params });
      console.log('[OrderAPI] User orders:', response.data);
      return response.data.data;
    } catch (error: any) {
      console.error('[OrderAPI] Get user orders error:', error.response || error);
      throw error;
    }
  },

  async getOrderInvoiceDetails(orderId: string) {
    try {
      console.log('[OrderAPI] Getting order invoice details:', orderId);
      const response = await api.get<APIResponse<{
        order: {
          orderId: string;
          type: string;
          status: string;
          createdAt: string;
          pickup: {
            address: {
              full: string;
              landmark: string;
              coordinates: {
                latitude: number;
                longitude: number;
              };
              pincode: string;
            };
            contact: {
              name: string;
              phone: string;
              alternatePhone?: string;
            };
            scheduledTime: string;
            actualTime?: string;
          };
          drops: Array<{
            address: {
              full: string;
              landmark: string;
              coordinates: {
                latitude: number;
                longitude: number;
              };
              pincode: string;
            };
            contact: {
              name: string;
              phone: string;
              alternatePhone?: string;
            };
            status: string;
            scheduledTime: string;
            actualTime?: string;
            sequence: number;
            proofOfDelivery?: {
              photos: string[];
              signature?: string;
              otp?: string;
              receiverName?: string;
              receiverRelation?: string;
            };
          }>;
          package?: {
            category: string;
            type: string;
            size: string;
            weight: number;
            dimensions?: string;
            value: number;
            photos?: string[];
            isFragile: boolean;
            requiresRefrigeration: boolean;
            description?: string;
            specialInstructions?: string[];
            items?: string[];
            insurance?: {
              provider: string;
              policyNumber: string;
              coverageAmount: number;
              validUntil: string;
            };
            requiresSignature?: boolean;
            handlingInstructions?: string[];
          };
          pricing: {
            base: number;
            distance: number;
            surge?: number;
            tax: number;
            total: number;
            currency: string;
            breakdown: Record<string, number>;
            discounts?: Array<{
              code: string;
              amount: number;
            }>;
          };
          payment: {
            method: string;
            status: string;
            transactionId?: string;
            paidAmount: number;
            refundAmount?: number;
            refundReason?: string;
          };
          partner?: {
            name: string;
            phone: string;
            vehicleType: string;
            vehicleNumber: string;
          };
          tracking: {
            liveTracking: {
              isEnabled: boolean;
              currentLocation?: {
                latitude: number;
                longitude: number;
              };
              route?: {
                plannedPath: Array<[number, number]>;
                actualPath?: Array<[number, number]>;
                eta: string;
                distance: {
                  planned: number;
                  actual?: number;
                };
              };
            };
            history: Array<{
              status: string;
              timestamp: string;
              location?: {
                latitude: number;
                longitude: number;
              };
              description?: string;
            }>;
          };
        };
      }>>(`/orders/${orderId}/invoice-details`);
      console.log('[OrderAPI] Order invoice details:', response.data);
      return response.data.data.order;
    } catch (error: any) {
      console.error('[OrderAPI] Get order invoice details error:', error.response || error);
      throw error;
    }
  },
}; 