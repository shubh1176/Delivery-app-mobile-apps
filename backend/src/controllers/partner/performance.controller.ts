import { Response } from 'express';
import { Partner } from '../../models/Partner.model';
import { CourierOrder, ICourierOrder } from '../../models/CourierOrder.model';
import { PickupDropOrder, IPickupDropOrder } from '../../models/PickupDropOrder.model';
import { PartnerAuthenticatedRequest } from '../../types/auth.types';

type OrderType = ICourierOrder | IPickupDropOrder;

export const getPerformanceMetrics = async (req: PartnerAuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized'
      });
    }

    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate as string) : new Date();
    const end = endDate ? new Date(endDate as string) : new Date();
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const partner = await Partner.findById(req.user.userId);
    if (!partner) {
      return res.status(404).json({
        status: 'error',
        message: 'Partner not found'
      });
    }

    // Get all orders within date range
    const [courierOrders, pickupDropOrders] = await Promise.all([
      CourierOrder.find({
        partnerId: req.user.userId,
        createdAt: { $gte: start, $lte: end }
      }).lean(),
      PickupDropOrder.find({
        partnerId: req.user.userId,
        createdAt: { $gte: start, $lte: end }
      }).lean()
    ]);

    const orders = [...courierOrders, ...pickupDropOrders];

    // Calculate metrics
    const totalOrders = orders.length;
    const completedOrders = orders.filter(order => order.status === 'delivered').length;
    const cancelledOrders = orders.filter(order => order.status === 'cancelled').length;
    const onTimeDeliveries = orders.filter(order => {
      if (order.status !== 'delivered') return false;
      const deliveryTime = order.tracking.history.find(t => t.status === 'delivered')?.timestamp;
      const scheduledTime = order.drops[0]?.scheduledTime;
      return deliveryTime && scheduledTime && deliveryTime <= scheduledTime;
    }).length;

    // Calculate ratings
    const ratings = orders
      .filter(order => order.ratings?.user?.rating !== undefined)
      .map(order => order.ratings?.user?.rating || 0);
    const averageRating = ratings.length > 0
      ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
      : 0;

    // Calculate acceptance rate
    const acceptanceRate = partner.metrics?.totalAssigned > 0
      ? ((partner.metrics?.totalAccepted || 0) / partner.metrics.totalAssigned) * 100
      : 0;

    // Calculate completion rate
    const completionRate = totalOrders > 0
      ? (completedOrders / totalOrders) * 100
      : 0;

    // Calculate on-time delivery rate
    const onTimeRate = completedOrders > 0
      ? (onTimeDeliveries / completedOrders) * 100
      : 0;

    return res.json({
      status: 'success',
      data: {
        metrics: {
          totalOrders,
          completedOrders,
          cancelledOrders,
          onTimeDeliveries,
          averageRating,
          acceptanceRate,
          completionRate,
          onTimeRate
        },
        summary: {
          rating: partner.metrics?.rating || 0,
          totalOrders: partner.metrics?.totalOrders || 0,
          completionRate: partner.metrics?.completionRate || 0,
          cancelRate: partner.metrics?.cancelRate || 0,
          avgResponseTime: partner.metrics?.avgResponseTime || 0,
          totalAssigned: partner.metrics?.totalAssigned || 0,
          totalAccepted: partner.metrics?.totalAccepted || 0,
          totalCompleted: partner.metrics?.totalCompleted || 0,
          totalCancelled: partner.metrics?.totalCancelled || 0
        }
      }
    });
  } catch (error) {
    console.error('Get performance metrics error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get performance metrics'
    });
  }
};

export const getRatings = async (req: PartnerAuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized'
      });
    }

    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const partner = await Partner.findById(req.user.userId);
    if (!partner) {
      return res.status(404).json({
        status: 'error',
        message: 'Partner not found'
      });
    }

    // Get orders with ratings
    const [courierOrders, pickupDropOrders] = await Promise.all([
      CourierOrder.find({
        partnerId: req.user.userId,
        'ratings.user.rating': { $exists: true }
      })
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 })
        .lean(),
      PickupDropOrder.find({
        partnerId: req.user.userId,
        'ratings.user.rating': { $exists: true }
      })
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 })
        .lean()
    ]);

    const orders = [...courierOrders, ...pickupDropOrders];
    orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    orders.splice(Number(limit));

    // Format ratings
    const ratings = orders.map(order => ({
      orderId: order._id.toString(),
      rating: order.ratings?.user?.rating || 0,
      review: order.ratings?.user?.review || '',
      createdAt: order.ratings?.user?.timestamp || order.createdAt
    }));

    return res.json({
      status: 'success',
      data: {
        ratings,
        summary: {
          rating: partner.metrics?.rating || 0,
          totalRatings: partner.metrics?.totalOrders || 0
        }
      }
    });
  } catch (error) {
    console.error('Get ratings error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get ratings'
    });
  }
}; 