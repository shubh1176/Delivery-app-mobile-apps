import { Response } from 'express';
import { AuthenticatedRequest } from '../types/auth.types';
import { CourierOrder, ICourierOrder } from '../models/CourierOrder.model';
import { PickupDropOrder, IPickupDropOrder } from '../models/PickupDropOrder.model';
import { Document } from 'mongoose';
import { Partner } from '../models/Partner.model';
import { sendOrderNotification, notifyUserNoPartners } from '../utils/notification.utils';

// Add type for combined order
type OrderType = (Document<unknown, {}, ICourierOrder> & ICourierOrder & Required<{ _id: unknown; }> & { __v: number; }) |
                (Document<unknown, {}, IPickupDropOrder> & IPickupDropOrder & Required<{ _id: unknown; }> & { __v: number; }) |
                null;

const getPackageDetails = (order: NonNullable<OrderType>) => {
  if (order.type === 'courier') {
    const courierOrder = order as ICourierOrder;
    return {
      category: courierOrder.package.category,
      type: courierOrder.package.type,
      size: courierOrder.package.size,
      weight: courierOrder.package.weight,
      dimensions: courierOrder.package.dimensions,
      value: courierOrder.package.value,
      photos: courierOrder.package.photos || [],
      isFragile: courierOrder.package.isFragile,
      requiresRefrigeration: courierOrder.package.requiresRefrigeration,
      description: courierOrder.package.description,
      specialInstructions: courierOrder.package.specialInstructions,
      items: courierOrder.package.items,
      insurance: courierOrder.insurance,
      requiresSignature: courierOrder.requiresSignature,
      handlingInstructions: courierOrder.handlingInstructions
    };
  } else {
    const pickupOrder = order as IPickupDropOrder;
    return {
      category: pickupOrder.pickup.package.category,
      type: pickupOrder.pickup.package.type,
      size: pickupOrder.pickup.package.size,
      weight: pickupOrder.pickup.package.weight,
      dimensions: pickupOrder.pickup.package.dimensions,
      value: pickupOrder.pickup.package.value,
      photos: pickupOrder.pickup.package.photos || [],
      isFragile: pickupOrder.pickup.package.isFragile,
      requiresRefrigeration: pickupOrder.pickup.package.requiresRefrigeration,
      description: pickupOrder.pickup.package.description,
      specialInstructions: pickupOrder.pickup.package.specialInstructions
    };
  }
};

export const estimatePickupDropOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { pickup, drops } = req.body;
    
    // Validate input
    if (!pickup || !drops || !Array.isArray(drops) || drops.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid request body'
      });
    }

    // Calculate base price
    const basePrice = 100; // Implement actual calculation logic
    const distance = 5; // Implement distance calculation using Mapbox
    const tax = basePrice * 0.18;
    const total = basePrice + tax;

    return res.json({
      status: 'success',
      data: {
        estimation: {
          base: basePrice,
          distance,
          tax,
          total,
          currency: 'INR',
          breakdown: {
            base: basePrice,
            tax
          }
        },
        vehicleType: 'bike',
        estimatedDuration: 30,
        availableSlots: [
          {
            id: '1',
            startTime: new Date().toISOString(),
            endTime: new Date(Date.now() + 3600000).toISOString()
          }
        ]
      }
    });
  } catch (error) {
    console.error('Error estimating pickup-drop order:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

export const createPickupDropOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { pickup, drops, payment, vehicleType, pricing } = req.body;
    const userId = req.user?._id;

    // Validate input
    if (!pickup || !drops || !payment || !vehicleType || !userId || !pricing) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid request body'
      });
    }

    // Create order
    const order = new PickupDropOrder({
      userId,
      type: 'pickup-drop',
      status: 'pending',
      pickup,
      drops,
      payment,
      vehicleType,
      pricing,
      estimatedDuration: 30, // Calculate based on distance
      routeOptimized: true
    });

    await order.save();

    return res.status(201).json({
      status: 'success',
      data: {
        order: {
          id: order._id,
          status: order.status,
          tracking: {
            liveTracking: {
              isEnabled: true,
              route: {
                plannedPath: [], // Will be populated by tracking service
                eta: new Date(Date.now() + 1800000).toISOString(),
                distance: {
                  planned: 5 // Calculate actual distance
                }
              }
            }
          },
          estimatedDuration: order.estimatedDuration
        }
      }
    });
  } catch (error) {
    console.error('Error creating pickup-drop order:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

export const estimateCourierOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { pickup, drops, package: pkg } = req.body;
    
    // Validate input
    if (!pickup || !drops || !pkg) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid request body'
      });
    }

    // Calculate prices
    const basePrice = 150; // Implement actual calculation logic
    const distance = 5; // Calculate using Mapbox
    const weight = pkg.weight * 10; // Price per kg
    const tax = (basePrice + weight) * 0.18;
    const total = basePrice + weight + tax;

    return res.json({
      status: 'success',
      data: {
        estimation: {
          base: basePrice,
          distance,
          weight,
          tax,
          total,
          currency: 'INR',
          breakdown: {
            base: basePrice,
            weight,
            tax
          }
        },
        insurance: {
          available: true,
          premium: total * 0.05,
          coverage: pkg.value
        },
        vehicleType: 'bike',
        estimatedDuration: 45
      }
    });
  } catch (error) {
    console.error('Error estimating courier order:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

const findEligiblePartners = async (order: ICourierOrder | IPickupDropOrder, radius: number = 3000) => {
  const pickupCoordinates = order.pickup.address.coordinates;
  
  const eligiblePartners = await Partner.find({
    status: 'active',
    currentOrder: null,
    'vehicle.type': order.vehicleType,
    'metrics.completionRate': { $gt: 0.8 },
    'metrics.rating': { $gt: 4.0 },
    'currentLocation.lastUpdated': { $gte: new Date(Date.now() - 30 * 60 * 1000) }, // Active in last 30 mins
    'currentLocation.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [pickupCoordinates.longitude, pickupCoordinates.latitude]
        },
        $maxDistance: radius
      }
    }
  })
  .limit(5)
  .select('_id deviceToken currentLocation metrics');

  return eligiblePartners;
};

const assignOrderToPartners = async (order: ICourierOrder | IPickupDropOrder) => {
  let radius = 3000; // Start with 3km
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    // Find eligible partners
    const eligiblePartners = await findEligiblePartners(order, radius);
    
    if (eligiblePartners.length > 0) {
      // Send notifications to all eligible partners
      const notificationPromises = eligiblePartners.map(partner => 
        sendOrderNotification(partner, order)
      );
      
      await Promise.all(notificationPromises);
      
      // Start timer for auto-rejection
      setTimeout(async () => {
        if (order.status === 'pending') {
          // If no one accepted, expand radius and try again
          radius += 1000;
          attempts++;
          if (attempts < maxAttempts) {
            await assignOrderToPartners(order);
          } else {
            // Notify user no partners available
            await notifyUserNoPartners(order);
          }
        }
      }, 30000); // 30 seconds timeout

      return true;
    }
    
    radius += 1000;
    attempts++;
  }

  return false;
};

// Modify createCourierOrder to include batch assignment
export const createCourierOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { pickup, drops, package: pkg, payment, vehicleType, insurance, requiresSignature, handlingInstructions } = req.body;
    const userId = req.user?._id;

    // Validate input
    if (!pickup || !drops || !pkg || !payment || !vehicleType || !userId) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid request body'
      });
    }

    // Create order
    const order = new CourierOrder({
      userId,
      type: 'courier',
      status: 'pending',
      pickup,
      drops,
      package: pkg,
      payment,
      vehicleType,
      insurance: insurance && {
        provider: 'Default Insurance',
        policyNumber: `POL-${Date.now()}`,
        coverageAmount: pkg.value,
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days validity
      },
      requiresSignature: requiresSignature ?? true,
      handlingInstructions: handlingInstructions || [],
      estimatedDuration: 45 // Calculate based on distance and package type
    });

    await order.save();

    // Start partner assignment process
    assignOrderToPartners(order).catch(error => {
      console.error('Partner assignment error:', error);
    });

    return res.status(201).json({
      status: 'success',
      data: {
        order: {
          id: order._id,
          status: order.status,
          createdAt: order.createdAt,
          tracking: {
            liveTracking: {
              isEnabled: true,
              route: {
                plannedPath: [],
                eta: new Date(Date.now() + 2700000).toISOString(),
                distance: {
                  planned: 5
                }
              }
            }
          },
          estimatedDuration: order.estimatedDuration
        }
      }
    });
  } catch (error) {
    console.error('Error creating courier order:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

export const getOrderDetails = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    // Try both order types
    const order = await CourierOrder.findOne({ _id: id, userId }) || 
                 await PickupDropOrder.findOne({ _id: id, userId });

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    return res.json({
      status: 'success',
      data: {
        order: {
          id: order._id,
          type: order.type,
          status: order.status,
          tracking: order.tracking
        }
      }
    });
  } catch (error) {
    console.error('Error fetching order details:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

export const cancelOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { reason, description } = req.body;
    const userId = req.user?._id;

    // Try both order types
    const order = await CourierOrder.findOne({ _id: id, userId }) || 
                 await PickupDropOrder.findOne({ _id: id, userId });

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    if (!['pending', 'assigned'].includes(order.status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Order cannot be cancelled in current status'
      });
    }

    order.status = 'cancelled';
    await order.save();

    return res.json({
      status: 'success',
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

export const rateOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { rating, review } = req.body;
    const userId = req.user?._id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid rating'
      });
    }

    // Try both order types
    const order = await CourierOrder.findOne({ _id: id, userId }) || 
                 await PickupDropOrder.findOne({ _id: id, userId });

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    if (order.status !== 'delivered') {
      return res.status(400).json({
        status: 'error',
        message: 'Order must be delivered before rating'
      });
    }

    if (!order.ratings) {
      order.ratings = {};
    }

    order.ratings.user = {
      rating,
      review,
      timestamp: new Date()
    };

    await order.save();

    return res.json({
      status: 'success',
      message: 'Rating submitted successfully'
    });
  } catch (error) {
    console.error('Error rating order:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

/**
 * Get detailed order information for invoice generation
 */
export const getOrderDetailsForInvoice = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const userId = req.user?._id;

    let order: OrderType = await CourierOrder.findOne({ _id: orderId, userId })
      .populate({
        path: 'partnerId',
        select: 'name phone vehicle.type vehicle.number currentLocation status'
      });
    
    if (!order) {
      order = await PickupDropOrder.findOne({ _id: orderId, userId })
        .populate({
          path: 'partnerId',
          select: 'name phone vehicle.type vehicle.number currentLocation status'
        });
    }

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    // Transform order data to match API response format
    const orderDetails = {
      orderId: order._id,
      type: order.type,
      status: order.status,
      createdAt: (order as any).createdAt,
      pickup: {
        address: {
          full: order.pickup.address.full,
          landmark: order.pickup.address.landmark,
          coordinates: {
            latitude: order.pickup.address.coordinates.latitude,
            longitude: order.pickup.address.coordinates.longitude
          },
          pincode: order.pickup.address.pincode
        },
        contact: {
          name: order.pickup.contact.name,
          phone: order.pickup.contact.phone,
          alternatePhone: order.pickup.contact.alternatePhone
        },
        scheduledTime: order.pickup.scheduledTime,
        actualTime: order.pickup.actualTime
      },
      drops: order.drops.map(drop => ({
        address: {
          full: drop.address.full,
          landmark: drop.address.landmark,
          coordinates: {
            latitude: drop.address.coordinates.latitude,
            longitude: drop.address.coordinates.longitude
          },
          pincode: drop.address.pincode
        },
        contact: {
          name: drop.contact.name,
          phone: drop.contact.phone,
          alternatePhone: drop.contact.alternatePhone
        },
        status: drop.status,
        scheduledTime: drop.scheduledTime,
        actualTime: drop.actualTime,
        sequence: drop.sequence,
        proofOfDelivery: drop.proofOfDelivery ? {
          photos: drop.proofOfDelivery.photos,
          signature: drop.proofOfDelivery.signature,
          otp: drop.proofOfDelivery.otp,
          receiverName: drop.proofOfDelivery.receiverName,
          receiverRelation: drop.proofOfDelivery.receiverRelation
        } : undefined
      })),
      package: order ? getPackageDetails(order) : undefined,
      pricing: {
        base: order.pricing.base,
        distance: order.pricing.distance,
        surge: order.pricing.surge,
        tax: order.pricing.tax,
        total: order.pricing.total,
        currency: order.pricing.currency,
        breakdown: order.pricing.breakdown,
        discounts: order.pricing.discounts
      },
      payment: {
        method: order.payment.method,
        status: order.payment.status,
        transactionId: order.payment.transactionId,
        paidAmount: order.payment.paidAmount,
        refundAmount: order.payment.refundAmount,
        refundReason: order.payment.refundReason
      },
      partner: order.partnerId && typeof order.partnerId === 'object' ? {
        name: (order.partnerId as any).name,
        phone: (order.partnerId as any).phone,
        vehicleType: (order.partnerId as any).vehicle?.type,
        vehicleNumber: (order.partnerId as any).vehicle?.number,
      } : undefined,
      tracking: {
        liveTracking: {
          isEnabled: order.tracking.liveTracking.isEnabled,
          currentLocation: order.tracking.liveTracking.currentLocation,
          route: order.tracking.liveTracking.route ? {
            plannedPath: order.tracking.liveTracking.route.plannedPath,
            actualPath: order.tracking.liveTracking.route.actualPath,
            eta: order.tracking.liveTracking.route.eta,
            distance: order.tracking.liveTracking.route.distance
          } : undefined
        },
        history: order.tracking.history
      }
    };

    return res.json({
      status: 'success',
      data: {
        order: orderDetails
      }
    });
  } catch (error) {
    console.error('Error fetching order details for invoice:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Error fetching order details'
    });
  }
};

export const getUserOrders = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const { type, status, page = 1, limit = 10 } = req.query;

    // Build query conditions
    const conditions: any = { userId };
    if (type) conditions.type = type;
    if (status) conditions.status = status;

    // Fetch orders from both collections
    const skip = (Number(page) - 1) * Number(limit);
    
    const [courierOrders, pickupDropOrders] = await Promise.all([
      CourierOrder.find(conditions)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      PickupDropOrder.find(conditions)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
    ]);

    // Combine and sort orders
    const orders = [...courierOrders, ...pickupDropOrders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, Number(limit));

    // Transform orders to consistent format
    const transformedOrders = orders.map(order => ({
      id: order._id,
      type: order.type,
      status: order.status,
      createdAt: order.createdAt,
      pickup: {
        address: order.pickup.address.full,
        contact: {
          name: order.pickup.contact.name,
          phone: order.pickup.contact.phone
        }
      },
      drop: order.drops[0] ? {
        address: order.drops[0].address.full,
        contact: {
          name: order.drops[0].contact.name,
          phone: order.drops[0].contact.phone
        }
      } : undefined,
      amount: order.pricing.total,
      currency: order.pricing.currency || 'INR'
    }));

    // Get total count for pagination
    const [totalCourierOrders, totalPickupDropOrders] = await Promise.all([
      CourierOrder.countDocuments(conditions),
      PickupDropOrder.countDocuments(conditions)
    ]);

    const total = totalCourierOrders + totalPickupDropOrders;

    return res.json({
      status: 'success',
      data: {
        orders: transformedOrders,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
}; 