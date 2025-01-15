import { Response } from 'express';
import { Partner } from '../../models/Partner.model';
import { PartnerAuthenticatedRequest } from '../../types/auth.types';

export const updateLocation = async (req: PartnerAuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
        return res.status(401).json({
          status: 'error',
          message: 'Unauthorized'
        });
      }
    const { coordinates, accuracy, heading, speed } = req.body;
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid coordinates are required'
      });
    }

    // Type assertion for coordinates after validation
    const validatedCoordinates: [number, number] = [coordinates[0], coordinates[1]];

    const partner = await Partner.findById(req.user.userId);
    if (!partner) {
      return res.status(404).json({
        status: 'error',
        message: 'Partner not found'
      });
    }

    // Update location
    partner.currentLocation = {
      coordinates: validatedCoordinates,
      accuracy: accuracy || partner.currentLocation?.accuracy,
      heading: heading || partner.currentLocation?.heading,
      speed: speed || partner.currentLocation?.speed,
      lastUpdated: new Date()
    };

    await partner.save();

    return res.json({
      status: 'success',
      message: 'Location updated successfully'
    });
  } catch (error) {
    console.error('Update location error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update location'
    });
  }
};

export const updateStatus = async (req: PartnerAuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
        return res.status(401).json({
          status: 'error',
          message: 'Unauthorized'
        });
      }
    const { status } = req.body;
    if (!status || !['active', 'offline'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid status (active/offline) is required'
      });
    }

    const partner = await Partner.findById(req.user.userId);
    if (!partner) {
      return res.status(404).json({
        status: 'error',
        message: 'Partner not found'
      });
    }

    // Don't allow status change if partner is blocked or deleted
    if (partner.status === 'blocked' || partner.status === 'deleted') {
      return res.status(403).json({
        status: 'error',
        message: 'Cannot update status: Account is not active'
      });
    }

    partner.status = status;
    await partner.save();

    return res.json({
      status: 'success',
      message: 'Status updated successfully',
      data: { status: partner.status }
    });
  } catch (error) {
    console.error('Update status error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update status'
    });
  }
};

export const getActivePartners = async (req: PartnerAuthenticatedRequest, res: Response) => {
  try {
    const { coordinates, radius = 5000 } = req.body; // radius in meters
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid coordinates are required'
      });
    }

    // Type assertion for coordinates after validation
    const validatedCoordinates: [number, number] = [coordinates[0], coordinates[1]];

    // Find active partners within radius
    const partners = await Partner.find({
      status: 'active',
      'currentLocation.coordinates': {
        $nearSphere: {
          $geometry: {
            type: 'Point',
            coordinates: validatedCoordinates
          },
          $maxDistance: radius
        }
      }
    }).select('name currentLocation vehicle metrics');

    return res.json({
      status: 'success',
      data: { partners }
    });
  } catch (error) {
    console.error('Get active partners error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get active partners'
    });
  }
}; 