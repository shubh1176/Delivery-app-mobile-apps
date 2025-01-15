import { Response } from 'express';
import { Partner } from '../../models/Partner.model';
import { CourierOrder } from '../../models/CourierOrder.model';
import { PickupDropOrder } from '../../models/PickupDropOrder.model';
import { PartnerAuthenticatedRequest } from '../../types/auth.types';

export const getEarningsSummary = async (req: PartnerAuthenticatedRequest, res: Response) => {
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

    // Get completed orders within date range
    const [courierOrders, pickupDropOrders] = await Promise.all([
      CourierOrder.find({
        partnerId: req.user.userId,
        status: 'delivered',
        createdAt: { $gte: start, $lte: end }
      }),
      PickupDropOrder.find({
        partnerId: req.user.userId,
        status: 'delivered',
        createdAt: { $gte: start, $lte: end }
      })
    ]);

    // Calculate earnings
    const orders = [...courierOrders, ...pickupDropOrders];
    const totalEarnings = orders.reduce((sum, order) => sum + (order.partnerEarnings || 0), 0);
    const incentives = (partner.earnings?.incentives || []).filter(
      incentive => incentive.timestamp >= start && incentive.timestamp <= end
    );
    const totalIncentives = incentives.reduce((sum, incentive) => sum + incentive.amount, 0);

    return res.json({
      status: 'success',
      data: {
        totalEarnings,
        totalIncentives,
        grandTotal: totalEarnings + totalIncentives,
        orderCount: orders.length,
        incentives
      }
    });
  } catch (error) {
    console.error('Get earnings summary error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get earnings summary'
    });
  }
};

export const getTransactionHistory = async (req: PartnerAuthenticatedRequest, res: Response) => {
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

    // Get transactions sorted by date
    const transactions = (partner.earnings?.transactions || [])
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(skip, skip + Number(limit));

    const total = partner.earnings?.transactions?.length || 0;

    return res.json({
      status: 'success',
      data: {
        transactions,
        pagination: {
          total,
          page: Number(page),
          pages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get transaction history error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get transaction history'
    });
  }
};

export const requestWithdrawal = async (req: PartnerAuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized'
      });
    }

    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid amount is required'
      });
    }

    const partner = await Partner.findById(req.user.userId);
    if (!partner) {
      return res.status(404).json({
        status: 'error',
        message: 'Partner not found'
      });
    }

    // Check if bank details are verified
    if (!partner.bankDetails?.verified) {
      return res.status(403).json({
        status: 'error',
        message: 'Bank details must be verified before withdrawal'
      });
    }

    // Check if sufficient balance
    const availableBalance = partner.earnings?.balance || 0;
    if (amount > availableBalance) {
      return res.status(400).json({
        status: 'error',
        message: 'Insufficient balance'
      });
    }

    // Create withdrawal transaction
    const transaction = {
      type: 'withdrawal' as const,
      amount: -amount,
      timestamp: new Date(),
      status: 'pending' as const,
      description: 'Withdrawal request'
    };

    if (!partner.earnings) {
      partner.earnings = { balance: 0, incentives: [], transactions: [] };
    }

    partner.earnings.transactions.push(transaction);
    partner.earnings.balance -= amount;
    await partner.save();

    return res.json({
      status: 'success',
      message: 'Withdrawal request submitted successfully',
      data: { transaction }
    });
  } catch (error) {
    console.error('Request withdrawal error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to process withdrawal request'
    });
  }
};

export const getIncentives = async (req: PartnerAuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized'
      });
    }

    const partner = await Partner.findById(req.user.userId);
    if (!partner) {
      return res.status(404).json({
        status: 'error',
        message: 'Partner not found'
      });
    }

    // Get active incentives
    const activeIncentives = (partner.earnings?.incentives || []).filter(
      incentive => incentive.timestamp >= new Date()
    );

    return res.json({
      status: 'success',
      data: { incentives: activeIncentives }
    });
  } catch (error) {
    console.error('Get incentives error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get incentives'
    });
  }
}; 