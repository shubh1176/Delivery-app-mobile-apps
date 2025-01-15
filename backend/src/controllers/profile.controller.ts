import { Response } from 'express';
import { AuthenticatedRequest } from '../types/auth.types';
import { User } from '../models/User.model';

export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    return res.json({
      status: 'success',
      data: {
        user: {
          name: user.name,
          email: user.email,
          phone: user.phone,
          isPhoneVerified: user.isPhoneVerified,
          isEmailVerified: user.isEmailVerified,
          profile: user.profile
        }
      }
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const { name, email, phone, profile } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Update basic info
    if (name) user.name = name;
    if (email && email !== user.email) {
      user.email = email;
      user.isEmailVerified = false;
      // TODO: Send verification email
    }
    if (phone && phone !== user.phone) {
      user.phone = phone;
      user.isPhoneVerified = false;
      // TODO: Send verification SMS
    }

    // Update profile settings
    if (profile) {
      if (profile.avatar) user.profile.avatar = profile.avatar;
      if (profile.language) user.profile.language = profile.language;
      if (profile.notifications) {
        user.profile.notifications = {
          ...user.profile.notifications,
          ...profile.notifications
        };
      }
    }

    await user.save();

    return res.json({
      status: 'success',
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

export const addAddress = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const { type, address, landmark, location, pincode, isDefault, label } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // If this is the first address or marked as default, update other addresses
    if (isDefault || user.addresses.length === 0) {
      user.addresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    user.addresses.push({
      type,
      address,
      landmark,
      location,
      pincode,
      isDefault: isDefault || user.addresses.length === 0,
      label
    });

    await user.save();

    return res.status(201).json({
      status: 'success',
      message: 'Address added successfully'
    });
  } catch (error) {
    console.error('Error adding address:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

export const getAddresses = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const user = await User.findById(userId).select('addresses');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    return res.json({
      status: 'success',
      data: {
        addresses: user.addresses
      }
    });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

export const updateAddress = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const { id } = req.params;
    const { type, address, landmark, location, pincode, isDefault, label } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const addressIndex = user.addresses.findIndex(addr => (addr as any)._id.toString() === id);
    if (addressIndex === -1) {
      return res.status(404).json({
        status: 'error',
        message: 'Address not found'
      });
    }

    // If setting as default, update other addresses
    if (isDefault) {
      user.addresses.forEach(addr => {
        addr.isDefault = false;
      });
    }

    // Update address
    user.addresses[addressIndex] = {
      ...user.addresses[addressIndex],
      type: type || user.addresses[addressIndex].type,
      address: address || user.addresses[addressIndex].address,
      landmark: landmark || user.addresses[addressIndex].landmark,
      location: location || user.addresses[addressIndex].location,
      pincode: pincode || user.addresses[addressIndex].pincode,
      isDefault: isDefault || user.addresses[addressIndex].isDefault,
      label: label || user.addresses[addressIndex].label
    };

    await user.save();

    return res.json({
      status: 'success',
      message: 'Address updated successfully'
    });
  } catch (error) {
    console.error('Error updating address:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

export const deleteAddress = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const { id } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const addressIndex = user.addresses.findIndex(addr => (addr as any)._id.toString() === id);
    if (addressIndex === -1) {
      return res.status(404).json({
        status: 'error',
        message: 'Address not found'
      });
    }

    // If deleting default address, make the first remaining address default
    const wasDefault = user.addresses[addressIndex].isDefault;
    user.addresses.splice(addressIndex, 1);

    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    return res.json({
      status: 'success',
      message: 'Address deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting address:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

export const addCard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const { last4, cardType, expiryMonth, expiryYear, isDefault } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // If this is the first card or marked as default, update other cards
    if (isDefault || user.savedCards.length === 0) {
      user.savedCards.forEach(card => {
        card.isDefault = false;
      });
    }

    user.savedCards.push({
      last4,
      cardType,
      expiryMonth,
      expiryYear,
      isDefault: isDefault || user.savedCards.length === 0
    });

    await user.save();

    return res.status(201).json({
      status: 'success',
      message: 'Card added successfully'
    });
  } catch (error) {
    console.error('Error adding card:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

export const getCards = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const user = await User.findById(userId).select('savedCards');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    return res.json({
      status: 'success',
      data: {
        cards: user.savedCards
      }
    });
  } catch (error) {
    console.error('Error fetching cards:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

export const deleteCard = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const { id } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    const cardIndex = user.savedCards.findIndex(card => (card as any)._id.toString() === id);
    if (cardIndex === -1) {
      return res.status(404).json({
        status: 'error',
        message: 'Card not found'
      });
    }

    // If deleting default card, make the first remaining card default
    const wasDefault = user.savedCards[cardIndex].isDefault;
    user.savedCards.splice(cardIndex, 1);

    if (wasDefault && user.savedCards.length > 0) {
      user.savedCards[0].isDefault = true;
    }

    await user.save();

    return res.json({
      status: 'success',
      message: 'Card deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting card:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
};

export const getWallet = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    const user = await User.findById(userId).select('wallet');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    return res.json({
      status: 'success',
      data: {
        balance: user.wallet.balance,
        currency: user.wallet.currency,
        transactions: user.wallet.transactions
      }
    });
  } catch (error) {
    console.error('Error fetching wallet:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
}; 