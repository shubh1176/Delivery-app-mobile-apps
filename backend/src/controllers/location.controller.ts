import { Request, Response } from 'express';
import axios from 'axios';
import mongoose from 'mongoose';
import { AuthenticatedRequest } from '../types/auth.types';
import { Partner } from '../models/Partner.model';
import { PickupDropOrder, IPickupDropOrder } from '../models/PickupDropOrder.model';
import { CourierOrder, ICourierOrder } from '../models/CourierOrder.model';
import config from '../config/env';
import {
  SearchPlacesRequest,
  ReverseGeocodeRequest,
  RouteRequest,
  ETARequest,
  LocationUpdateRequest,
  Place,
  Route,
  ETAResponse,
  OrderLocation
} from '../types/location.types';

// Use configuration from env.ts
const { accessToken: MAPBOX_ACCESS_TOKEN, geocodingUrl: MAPBOX_GEOCODING_URL, directionsUrl: MAPBOX_DIRECTIONS_URL } = config.mapbox;

// Debug log for configuration
console.log('Mapbox Configuration:', {
  tokenExists: !!MAPBOX_ACCESS_TOKEN,
  tokenPrefix: MAPBOX_ACCESS_TOKEN?.substring(0, 10) + '...',
  geocodingUrl: MAPBOX_GEOCODING_URL,
  directionsUrl: MAPBOX_DIRECTIONS_URL
});

export const searchPlaces = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({
        status: 'error',
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }
      });
    }

    const { query, proximity, limit = 5 } = req.body as SearchPlacesRequest;
    
    if (!query) {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'INVALID_REQUEST',
          message: 'Search query is required'
        }
      });
    }

    const response = await axios.get(
      `${MAPBOX_GEOCODING_URL}/${encodeURIComponent(query)}.json`,
      {
        params: {
          access_token: MAPBOX_ACCESS_TOKEN,
          proximity: proximity ? `${proximity.longitude},${proximity.latitude}` : undefined,
          limit,
          country: 'IN',
          types: 'address,poi,place'
        }
      }
    );

    const places: Place[] = response.data.features.map((feature: any) => ({
      id: feature.id,
      name: feature.text,
      address: feature.place_name,
      coordinates: {
        latitude: feature.center[1],
        longitude: feature.center[0]
      },
      placeType: feature.place_type[0]
    }));

    res.json({
      status: 'success',
      data: { places }
    });
  } catch (error) {
    console.error('Search places error:', error);
    res.status(400).json({
      status: 'error',
      error: {
        code: 'GEOCODING_FAILED',
        message: error instanceof Error ? error.message : 'Failed to search places'
      }
    });
  }
};

export const reverseGeocode = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({
        status: 'error',
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }
      });
    }

    if (!MAPBOX_ACCESS_TOKEN) {
      console.error('Mapbox access token is not configured');
      return res.status(500).json({
        status: 'error',
        error: {
          code: 'CONFIGURATION_ERROR',
          message: 'Mapbox access token is not configured'
        }
      });
    }

    const { latitude, longitude } = req.body as ReverseGeocodeRequest;
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'INVALID_REQUEST',
          message: 'Latitude and longitude are required'
        }
      });
    }

    const response = await axios.get(
      `${MAPBOX_GEOCODING_URL}/${longitude},${latitude}.json`,
      {
        params: {
          access_token: MAPBOX_ACCESS_TOKEN,
          types: 'address',
          limit: 1
        },
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.data.features || response.data.features.length === 0) {
      return res.status(404).json({
        status: 'error',
        error: {
          code: 'NO_RESULTS',
          message: 'No address found for the given coordinates'
        }
      });
    }

    const place = response.data.features[0];
    
    res.json({
      status: 'success',
      data: {
        place: {
          name: place.place_name,
          address: place.place_name,
          coordinates: {
            latitude,
            longitude
          },
          context: place.context
        }
      }
    });
  } catch (error) {
    console.error('Reverse geocode error:', error);
    res.status(500).json({
      status: 'error',
      error: {
        code: 'GEOCODING_FAILED',
        message: error instanceof Error ? error.message : 'Reverse geocoding failed'
      }
    });
  }
};

export const getRoute = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({
        status: 'error',
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }
      });
    }

    const { origin, destination, waypoints, mode = 'driving', alternatives = false } = req.body as RouteRequest;

    if (!origin || !destination) {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'INVALID_REQUEST',
          message: 'Both origin and destination are required'
        }
      });
    }

    let coordinates = `${origin.longitude},${origin.latitude};${destination.longitude},${destination.longitude}`;
    if (waypoints?.length) {
      const waypointCoords = waypoints
        .map(wp => `${wp.longitude},${wp.latitude}`)
        .join(';');
      coordinates = `${origin.longitude},${origin.latitude};${waypointCoords};${destination.longitude},${destination.longitude}`;
    }

    const response = await axios.get(
      `${MAPBOX_DIRECTIONS_URL}/${mode}/${coordinates}`,
      {
        params: {
          access_token: MAPBOX_ACCESS_TOKEN,
          alternatives,
          geometries: 'geojson',
          steps: true,
          overview: 'full'
        }
      }
    );

    const routes: Route[] = response.data.routes.map((route: any) => ({
      distance: route.distance,
      duration: route.duration,
      geometry: route.geometry,
      steps: route.legs[0].steps.map((step: any) => ({
        instruction: step.maneuver.instruction,
        distance: step.distance,
        duration: step.duration,
        coordinates: {
          latitude: step.maneuver.location[1],
          longitude: step.maneuver.location[0]
        }
      }))
    }));

    res.json({
      status: 'success',
      data: { routes }
    });
  } catch (error) {
    console.error('Get route error:', error);
    res.status(400).json({
      status: 'error',
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: error instanceof Error ? error.message : 'Failed to get route'
      }
    });
  }
};

export const getETA = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({
        status: 'error',
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }
      });
    }

    const { origin, destination } = req.body as ETARequest;

    if (!origin || !destination) {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'INVALID_REQUEST',
          message: 'Both origin and destination are required'
        }
      });
    }

    const response = await axios.get(
      `${MAPBOX_DIRECTIONS_URL}/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}`,
      {
        params: {
          access_token: MAPBOX_ACCESS_TOKEN,
          overview: 'false'
        }
      }
    );

    const route = response.data.routes[0];
    if (!route) {
      throw new Error('No route found between the specified points');
    }

    const duration = route.duration;
    const distance = route.distance;
    const eta = new Date(Date.now() + duration * 1000).toISOString();

    const etaResponse: ETAResponse = {
      eta,
      duration,
      distance
    };

    res.json({
      status: 'success',
      data: etaResponse
    });
  } catch (error) {
    console.error('Get ETA error:', error);
    res.status(400).json({
      status: 'error',
      error: {
        code: 'ETA_CALCULATION_FAILED',
        message: error instanceof Error ? error.message : 'Failed to calculate ETA'
      }
    });
  }
};

export const updatePartnerLocation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({
        status: 'error',
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }
      });
    }

    const partnerId = req.user?._id;
    const { latitude, longitude, accuracy, heading, speed, timestamp } = req.body as LocationUpdateRequest;

    if (!partnerId) {
      return res.status(401).json({
        status: 'error',
        error: {
          code: 'UNAUTHORIZED',
          message: 'Partner ID not found'
        }
      });
    }

    if (!latitude || !longitude) {
      return res.status(400).json({
        status: 'error',
        error: {
          code: 'INVALID_COORDINATES',
          message: 'Both latitude and longitude are required'
        }
      });
    }

    const partner = await Partner.findByIdAndUpdate(partnerId, {
      'currentLocation.coordinates': [longitude, latitude],
      'currentLocation.accuracy': accuracy,
      'currentLocation.heading': heading,
      'currentLocation.speed': speed,
      'currentLocation.lastUpdated': timestamp || new Date()
    }, { new: true });

    if (!partner) {
      return res.status(404).json({
        status: 'error',
        error: {
          code: 'PARTNER_NOT_FOUND',
          message: 'Partner not found'
        }
      });
    }

    res.json({
      status: 'success',
      data: {
        updated: true,
        timestamp: partner.currentLocation.lastUpdated.toISOString()
      }
    });
  } catch (error) {
    console.error('Update partner location error:', error);
    res.status(400).json({
      status: 'error',
      error: {
        code: 'LOCATION_UPDATE_FAILED',
        message: error instanceof Error ? error.message : 'Failed to update location'
      }
    });
  }
};

export const getOrderLocation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({
        status: 'error',
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated'
        }
      });
    }

    const { orderId } = req.params;

    type PopulatedPartner = {
      _id: mongoose.Types.ObjectId;
      currentLocation: {
        coordinates: number[];
        lastUpdated: Date;
      };
    };

    // Try to find order in both collections
    const pickupDropOrder = await PickupDropOrder.findOne({ _id: orderId, userId })
      .populate<{ partnerId: PopulatedPartner }>('partnerId', 'currentLocation');
    
    const courierOrder = await CourierOrder.findOne({ _id: orderId, userId })
      .populate<{ partnerId: PopulatedPartner }>('partnerId', 'currentLocation');

    const order = pickupDropOrder || courierOrder;

    if (!order) {
      return res.status(404).json({
        status: 'error',
        error: {
          code: 'ORDER_NOT_FOUND',
          message: 'Order not found'
        }
      });
    }

    const baseOrderLocation: Omit<OrderLocation, 'maxDrops' | 'routeOptimized' | 'requiresSignature'> = {
      id: (order as any)._id.toString(),
      type: order.type as 'pickup-drop' | 'courier',
      status: order.status,
      partner: order.partnerId ? {
        id: order.partnerId._id.toString(),
        location: {
          latitude: order.partnerId.currentLocation.coordinates[1],
          longitude: order.partnerId.currentLocation.coordinates[0],
          lastUpdated: order.partnerId.currentLocation.lastUpdated.toISOString()
        }
      } : undefined,
      route: order.tracking?.liveTracking?.currentLocation ? {
        current: {
          latitude: order.tracking.liveTracking.currentLocation.coordinates[1],
          longitude: order.tracking.liveTracking.currentLocation.coordinates[0]
        },
        remaining: {
          distance: order.tracking.liveTracking.route?.distance.actual || 0,
          duration: order.tracking.liveTracking.route?.distance.planned || 0 // Using planned distance as duration
        }
      } : undefined
    };

    let orderLocation: OrderLocation;

    // Add type-specific fields
    if (order.type === 'pickup-drop' && pickupDropOrder) {
      orderLocation = {
        ...baseOrderLocation,
        maxDrops: pickupDropOrder.maxDrops,
        routeOptimized: pickupDropOrder.routeOptimized
      };
    } else if (order.type === 'courier' && courierOrder) {
      orderLocation = {
        ...baseOrderLocation,
        requiresSignature: courierOrder.requiresSignature
      };
    } else {
      orderLocation = baseOrderLocation;
    }

    res.json({
      status: 'success',
      data: {
        order: orderLocation
      }
    });
  } catch (error) {
    console.error('Get order location error:', error);
    res.status(400).json({
      status: 'error',
      error: {
        code: 'ORDER_LOCATION_FAILED',
        message: error instanceof Error ? error.message : 'Failed to get order location'
      }
    });
  }
}; 