import { Response } from 'express';
import { Partner, IPartner } from '../../models/Partner.model';
import { PartnerAuthenticatedRequest } from '../../types/auth.types';

export const getProfile = async (req: PartnerAuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized'
      });
    }

    const partner = await Partner.findById(req.user.userId).select('-password');
    if (!partner) {
      return res.status(404).json({
        status: 'error',
        message: 'Partner not found'
      });
    }

    return res.json({
      status: 'success',
      data: { partner }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to get profile'
    });
  }
};

export const updateProfile = async (req: PartnerAuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized'
      });
    }

    const { name, email } = req.body;
    
    const partner = await Partner.findById(req.user.userId);
    if (!partner) {
      return res.status(404).json({
        status: 'error',
        message: 'Partner not found'
      });
    }

    // Update fields if provided
    if (name) partner.name = name;
    if (email) partner.email = email;

    await partner.save();

    return res.json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        partner: {
          id: partner._id,
          name: partner.name,
          email: partner.email,
          phone: partner.phone
        }
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update profile'
    });
  }
};

export const updateVehicle = async (req: PartnerAuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized'
      });
    }

    const { type, number } = req.body;
    if (!type || !number) {
      return res.status(400).json({
        status: 'error',
        message: 'Vehicle type and number are required'
      });
    }

    // Validate vehicle type
    const validVehicleTypes: IPartner['vehicle']['type'][] = ['bike', 'scooter', 'cycle'];
    if (!validVehicleTypes.includes(type as IPartner['vehicle']['type'])) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid vehicle type. Must be one of: bike, scooter, cycle'
      });
    }

    const partner = await Partner.findById(req.user.userId);
    if (!partner) {
      return res.status(404).json({
        status: 'error',
        message: 'Partner not found'
      });
    }

    if (!partner.vehicle) {
      partner.vehicle = {
        type: type as IPartner['vehicle']['type'],
        number: '',
        documents: {}
      };
    }
    partner.vehicle.type = type as IPartner['vehicle']['type'];
    partner.vehicle.number = number;
    await partner.save();

    return res.json({
      status: 'success',
      message: 'Vehicle details updated successfully',
      data: { vehicle: partner.vehicle }
    });
  } catch (error) {
    console.error('Update vehicle error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update vehicle details'
    });
  }
};

export const updateDocuments = async (req: PartnerAuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized'
      });
    }

    const { documentType, documentUrl } = req.body;
    if (!documentType || !documentUrl) {
      return res.status(400).json({
        status: 'error',
        message: 'Document type and URL are required'
      });
    }

    const partner = await Partner.findById(req.user.userId);
    if (!partner) {
      return res.status(404).json({
        status: 'error',
        message: 'Partner not found'
      });
    }

    // Initialize documents objects if they don't exist
    if (!partner.documents) {
      partner.documents = {
        verification: {
          phone: false,
          email: false,
          identity: false,
          address: false,
          vehicle: false
        }
      };
    }
    if (!partner.vehicle) {
      partner.vehicle = {
        type: 'bike',
        number: '',
        documents: {}
      };
    }
    if (!partner.vehicle.documents) {
      partner.vehicle.documents = {};
    }

    // Update document based on type
    switch (documentType) {
      case 'idProof':
        partner.documents.idProof = documentUrl;
        partner.documents.verification.identity = true;
        break;
      case 'addressProof':
        partner.documents.addressProof = documentUrl;
        partner.documents.verification.address = true;
        break;
      case 'drivingLicense':
        partner.documents.drivingLicense = documentUrl;
        break;
      case 'rc':
        partner.vehicle.documents.rc = documentUrl;
        partner.documents.verification.vehicle = true;
        break;
      case 'insurance':
        partner.vehicle.documents.insurance = documentUrl;
        break;
      case 'permit':
        partner.vehicle.documents.permit = documentUrl;
        break;
      default:
        return res.status(400).json({
          status: 'error',
          message: 'Invalid document type'
        });
    }

    await partner.save();

    return res.json({
      status: 'success',
      message: 'Document updated successfully',
      data: {
        documents: partner.documents,
        vehicleDocuments: partner.vehicle.documents
      }
    });
  } catch (error) {
    console.error('Update documents error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update documents'
    });
  }
};

export const updateBankDetails = async (req: PartnerAuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized'
      });
    }

    const { accountNumber, ifsc, holderName } = req.body;
    if (!accountNumber || !ifsc || !holderName) {
      return res.status(400).json({
        status: 'error',
        message: 'All bank details are required'
      });
    }

    const partner = await Partner.findById(req.user.userId);
    if (!partner) {
      return res.status(404).json({
        status: 'error',
        message: 'Partner not found'
      });
    }

    partner.bankDetails = {
      accountNumber,
      ifsc,
      holderName,
      verified: false
    };
    await partner.save();

    return res.json({
      status: 'success',
      message: 'Bank details updated successfully',
      data: { bankDetails: partner.bankDetails }
    });
  } catch (error) {
    console.error('Update bank details error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update bank details'
    });
  }
};

export const updateServiceArea = async (req: PartnerAuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized'
      });
    }

    const { city, boundaries, preferredLocations } = req.body;
    if (!city) {
      return res.status(400).json({
        status: 'error',
        message: 'City is required'
      });
    }

    const partner = await Partner.findById(req.user.userId);
    if (!partner) {
      return res.status(404).json({
        status: 'error',
        message: 'Partner not found'
      });
    }

    if (!partner.serviceArea) {
      partner.serviceArea = { city: '', boundaries: [], preferredLocations: [] };
    }

    partner.serviceArea = {
      city,
      boundaries: boundaries || partner.serviceArea.boundaries,
      preferredLocations: preferredLocations || partner.serviceArea.preferredLocations
    };
    await partner.save();

    return res.json({
      status: 'success',
      message: 'Service area updated successfully',
      data: { serviceArea: partner.serviceArea }
    });
  } catch (error) {
    console.error('Update service area error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update service area'
    });
  }
}; 