import { Response } from 'express';
import { Partner } from '../../models/Partner.model';
import { CourierOrder, ICourierOrder } from '../../models/CourierOrder.model';
import { PickupDropOrder, IPickupDropOrder } from '../../models/PickupDropOrder.model';
import { PartnerAuthenticatedRequest } from '../../types/auth.types';
import { Types } from 'mongoose';

type OrderStatus = 'pending' | 'assigned' | 'picked' | 'in-transit' | 'delivered' | 'cancelled';
type Order = ICourierOrder | IPickupDropOrder;

export const getOrders = async (req: PartnerAuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized'
      });
    }

    const { status, type, page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query: any = { partnerId: req.user.userId };
    if (status) query.status = status;
    if (type) query.type = type;

    // Get orders from both collections
    const [courierOrders, pickupDropOrders] = await Promise.all([
      CourierOrder.find(query)
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      PickupDropOrder.find(query)
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 })
    ]);

    // Combine and sort orders
    const orders = [...courierOrders, ...pickupDropOrders]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, Number(limit));

    return res.json({
      status: 'success',
      data: { orders }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get orders'
    });
  }
};

export const getOrderDetails = async (req: PartnerAuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized'
      });
    }

    const { orderId } = req.params;
    const { type } = req.query;

    let order;
    if (type === 'courier') {
      order = await CourierOrder.findOne({
        _id: new Types.ObjectId(orderId),
        partnerId: req.user.userId
      });
    } else if (type === 'pickup-drop') {
      order = await PickupDropOrder.findOne({
        _id: new Types.ObjectId(orderId),
        partnerId: req.user.userId
      });
    }

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    return res.json({
      status: 'success',
      data: { order }
    });
  } catch (error) {
    console.error('Get order details error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get order details'
    });
  }
};

export const acceptOrder = async (req: PartnerAuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized'
      });
    }

    const { orderId } = req.params;
    const { type } = req.query;

    let order;
    if (type === 'courier') {
      order = await CourierOrder.findOne({
        _id: new Types.ObjectId(orderId),
        partnerId: req.user.userId,
        status: 'pending'
      });
    } else if (type === 'pickup-drop') {
      order = await PickupDropOrder.findOne({
        _id: new Types.ObjectId(orderId),
        partnerId: req.user.userId,
        status: 'pending'
      });
    }

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found or not in pending state'
      });
    }

    order.status = 'assigned';
    await order.save();

    return res.json({
      status: 'success',
      message: 'Order accepted successfully',
      data: { order }
    });
  } catch (error) {
    console.error('Accept order error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to accept order'
    });
  }
};

export const rejectOrder = async (req: PartnerAuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized'
      });
    }

    const { orderId } = req.params;
    const { type } = req.body;

    let order;
    if (type === 'courier') {
      order = await CourierOrder.findOne({
        _id: new Types.ObjectId(orderId),
        partnerId: req.user.userId,
        status: 'assigned'
      });
    } else if (type === 'pickup-drop') {
      order = await PickupDropOrder.findOne({
        _id: new Types.ObjectId(orderId),
        partnerId: req.user.userId,
        status: 'assigned'
      });
    }

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found or not assigned to you'
      });
    }

    // Update order status
    order.status = 'pending';
    order.partnerId = undefined;
    await order.save();

    return res.json({
      status: 'success',
      message: 'Order rejected successfully'
    });
  } catch (error) {
    console.error('Reject order error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to reject order'
    });
  }
};

export const updateOrderStatus = async (req: PartnerAuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized'
      });
    }

    const { orderId } = req.params;
    const { type, status, location, notes } = req.body;
    const validStatuses: OrderStatus[] = ['picked', 'in-transit', 'delivered'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status update'
      });
    }

    let order: Order | null = null;
    if (type === 'courier') {
      order = await CourierOrder.findOne({
        _id: new Types.ObjectId(orderId),
        partnerId: req.user.userId
      });
    } else if (type === 'pickup-drop') {
      order = await PickupDropOrder.findOne({
        _id: new Types.ObjectId(orderId),
        partnerId: req.user.userId
      });
    }

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    // Update tracking
    if (!order.tracking) {
      order.tracking = {
        liveTracking: {
          isEnabled: true
        },
        history: []
      };
    }

    // Update live tracking if location provided
    if (location) {
      order.tracking.liveTracking.currentLocation = {
        coordinates: location.coordinates,
        timestamp: new Date(),
        accuracy: location.accuracy,
        speed: location.speed,
        bearing: location.bearing
      };
    }

    // Add to tracking history
    order.tracking.history.push({
      status,
      timestamp: new Date(),
      note: notes,
      updatedBy: {
        type: 'partner',
        id: new Types.ObjectId(req.user.userId)
      }
    });

    order.status = status;
    await order.save();

    return res.json({
      status: 'success',
      message: 'Order status updated successfully',
      data: { order }
    });
  } catch (error) {
    console.error('Update order status error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update order status'
    });
  }
};

/**
 * Submit proof of delivery for an order
 */
export const submitProofOfDelivery = async (req: PartnerAuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized'
      });
    }

    const { orderId } = req.params;
    const { 
      photos,
      signature,
      otp,
      receiverName,
      receiverRelation,
      notes,
      location
    } = req.body;

    // Validate input
    if (!photos || !signature || !otp || !receiverName) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required proof of delivery details'
      });
    }

    // Find order
    let order = await CourierOrder.findOne({
      _id: new Types.ObjectId(orderId),
      partnerId: req.user.userId,
      status: 'in-transit'
    });

    if (!order) {
      order = await PickupDropOrder.findOne({
        _id: new Types.ObjectId(orderId),
        partnerId: req.user.userId,
        status: 'in-transit'
      });
    }

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found or not in transit'
      });
    }

    // Update tracking
    if (!order.tracking) {
      order.tracking = {
        liveTracking: {
          isEnabled: true
        },
        history: []
      };
    }

    // Update tracking history
    order.tracking.history.push({
      status: 'delivered',
      timestamp: new Date(),
      note: notes,
      location: location ? `${location.coordinates[0]},${location.coordinates[1]}` : undefined,
      updatedBy: {
        type: 'partner',
        id: new Types.ObjectId(req.user.userId)
      }
    });

    // Update order status and proof of delivery
    if (order.type === 'courier') {
      // For courier orders, update the first drop point
      const currentDrop = order.drops[0];
      if (!currentDrop) {
        return res.status(400).json({
          status: 'error',
          message: 'No drop points found'
        });
      }

      currentDrop.proofOfDelivery = {
        photos,
        signature,
        otp,
        receiverName,
        receiverRelation
      };
      currentDrop.status = 'delivered';
      currentDrop.actualTime = new Date();
    } else {
      // For pickup-drop orders
      if (!order.drops || !Array.isArray(order.drops)) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid drops format'
        });
      }

      const currentDrop = order.drops[0];
      if (!currentDrop) {
        return res.status(400).json({
          status: 'error',
          message: 'No drop points found'
        });
      }

      currentDrop.proofOfDelivery = {
        photos,
        signature,
        otp,
        receiverName,
        receiverRelation
      };
      currentDrop.status = 'delivered';
      currentDrop.actualTime = new Date();
    }

    order.status = 'delivered';

    // Update live tracking location if provided
    if (location) {
      order.tracking.liveTracking.currentLocation = {
        coordinates: location.coordinates,
        timestamp: new Date(),
        accuracy: location.accuracy,
        speed: location.speed,
        bearing: location.bearing
      };
    }

    await order.save();

    // Process partner earnings
    const partner = await Partner.findById(order.partnerId);
    if (!partner) {
      throw new Error('Partner not found');
    }

    // Update partner metrics
    if (!partner.metrics) {
      partner.metrics = {
        rating: 0,
        totalOrders: 0,
        completionRate: 0,
        cancelRate: 0,
        avgResponseTime: 0,
        totalAssigned: 0,
        totalAccepted: 0,
        totalCompleted: 0,
        totalCancelled: 0
      };
    }

    partner.metrics.totalCompleted += 1;
    partner.metrics.totalOrders += 1;
    partner.metrics.completionRate = 
      partner.metrics.totalCompleted / partner.metrics.totalOrders;

    // Update partner earnings
    if (!partner.earnings) {
      partner.earnings = {
        balance: 0,
        incentives: [],
        transactions: []
      };
    }

    const baseEarnings = order.pricing.total * 0.8;
    partner.earnings.balance += baseEarnings;
    partner.earnings.transactions.push({
      type: 'credit',
      amount: baseEarnings,
      description: 'Order completion earnings',
      timestamp: new Date()
    });

    await partner.save();

    return res.json({
      status: 'success',
      message: 'Proof of delivery submitted successfully',
      data: { order }
    });
  } catch (error) {
    console.error('Submit proof of delivery error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to submit proof of delivery'
    });
  }
}; 