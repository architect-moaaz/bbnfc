const Organization = require('../models/Organization');
const { subscriptionOperations, profileOperations, cardOperations } = require('../utils/dbOperations');

/**
 * Middleware to check if user/organization can create a profile
 */
exports.checkProfileLimit = async (req, res, next) => {
  try {
    // If user has an organization, check organization limits
    if (req.user.organization) {
      const organization = await Organization.findById(req.user.organization);

      if (!organization) {
        return res.status(404).json({
          success: false,
          error: 'Organization not found'
        });
      }

      // Check if organization can add more profiles
      if (!organization.canAddProfiles(1)) {
        return res.status(403).json({
          success: false,
          error: 'Organization has reached profile limit',
          limit: organization.limits.profiles,
          current: organization.usage.profiles
        });
      }

      // Attach organization to request for later use
      req.organization = organization;
      return next();
    }

    // For individual users, check their subscription
    const subscription = await subscriptionOperations.findByUserId(req.user._id);

    if (!subscription) {
      // If no subscription exists, allow creation with default limits (e.g., 1 profile for free tier)
      // This allows new users to create their first profile
      const profiles = await profileOperations.findByUserId(req.user._id);
      const currentProfileCount = profiles.length;

      if (currentProfileCount >= 1) {
        return res.status(403).json({
          success: false,
          error: 'Please upgrade your plan to create more profiles',
          limit: 1,
          current: currentProfileCount
        });
      }

      // Allow first profile creation
      return next();
    }

    // Get current profile count
    const profiles = await profileOperations.findByUserId(req.user._id);
    const currentProfileCount = profiles.length;

    // Check if user has reached the limit
    if (currentProfileCount >= subscription.features.maxProfiles) {
      return res.status(403).json({
        success: false,
        error: 'You have reached your profile limit',
        limit: subscription.features.maxProfiles,
        current: currentProfileCount,
        plan: subscription.plan
      });
    }

    // Attach subscription to request
    req.subscription = subscription;
    next();
  } catch (error) {
    console.error('Profile limit check error:', error);
    res.status(500).json({
      success: false,
      error: 'Error checking profile limit'
    });
  }
};

/**
 * Middleware to check if user/organization can create a card
 */
exports.checkCardLimit = async (req, res, next) => {
  try {
    // If user has an organization, check organization limits
    if (req.user.organization) {
      const organization = await Organization.findById(req.user.organization);

      if (!organization) {
        return res.status(404).json({
          success: false,
          error: 'Organization not found'
        });
      }

      // Check if organization can add more cards
      if (!organization.canAddCards(1)) {
        return res.status(403).json({
          success: false,
          error: 'Organization has reached card limit',
          limit: organization.limits.cards,
          current: organization.usage.cards
        });
      }

      // Attach organization to request for later use
      req.organization = organization;
      return next();
    }

    // For individual users, check their subscription
    const subscription = await subscriptionOperations.findByUserId(req.user._id);

    if (!subscription) {
      // If no subscription exists, allow creation with default limits (e.g., 1 card for free tier)
      // This allows new users to create their first card
      const cards = await cardOperations.findByUserId(req.user._id);
      const currentCardCount = cards.length;

      if (currentCardCount >= 1) {
        return res.status(403).json({
          success: false,
          error: 'Please upgrade your plan to create more cards',
          limit: 1,
          current: currentCardCount
        });
      }

      // Allow first card creation
      return next();
    }

    // Get current card count
    const cards = await cardOperations.findByUserId(req.user._id);
    const currentCardCount = cards.length;

    // Check if user has reached the limit
    if (currentCardCount >= subscription.features.maxCardsPerProfile) {
      return res.status(403).json({
        success: false,
        error: 'You have reached your card limit',
        limit: subscription.features.maxCardsPerProfile,
        current: currentCardCount,
        plan: subscription.plan
      });
    }

    // Attach subscription to request
    req.subscription = subscription;
    next();
  } catch (error) {
    console.error('Card limit check error:', error);
    res.status(500).json({
      success: false,
      error: 'Error checking card limit'
    });
  }
};

/**
 * Middleware to check if user/organization can add more users (for invitations)
 */
exports.checkUserLimit = async (req, res, next) => {
  try {
    // This only applies to organizations
    if (!req.user.organization) {
      return res.status(403).json({
        success: false,
        error: 'You must belong to an organization to invite users'
      });
    }

    const organization = await Organization.findById(req.user.organization);

    if (!organization) {
      return res.status(404).json({
        success: false,
        error: 'Organization not found'
      });
    }

    // Check if organization can add more users
    if (!organization.canAddUsers(1)) {
      return res.status(403).json({
        success: false,
        error: 'Organization has reached user limit',
        limit: organization.limits.users,
        current: organization.usage.users
      });
    }

    // Attach organization to request
    req.organization = organization;
    next();
  } catch (error) {
    console.error('User limit check error:', error);
    res.status(500).json({
      success: false,
      error: 'Error checking user limit'
    });
  }
};

/**
 * Middleware to check storage limits
 */
exports.checkStorageLimit = (sizeInMB) => {
  return async (req, res, next) => {
    try {
      // If user has an organization, check organization storage
      if (req.user.organization) {
        const organization = await Organization.findById(req.user.organization);

        if (!organization) {
          return res.status(404).json({
            success: false,
            error: 'Organization not found'
          });
        }

        // Check storage availability
        if (!organization.hasStorageAvailable(sizeInMB)) {
          return res.status(403).json({
            success: false,
            error: 'Organization has insufficient storage',
            limit: organization.limits.storage,
            current: organization.usage.storage,
            required: sizeInMB
          });
        }

        req.organization = organization;
        return next();
      }

      // For individual users, we can add subscription storage checks here if needed
      next();
    } catch (error) {
      console.error('Storage limit check error:', error);
      res.status(500).json({
        success: false,
        error: 'Error checking storage limit'
      });
    }
  };
};

/**
 * Helper function to increment usage after successful creation
 */
exports.incrementProfileUsage = async (req, res, next) => {
  try {
    if (req.organization) {
      await req.organization.incrementUsage('profiles', 1);
    }
    next();
  } catch (error) {
    console.error('Error incrementing profile usage:', error);
    // Don't fail the request, just log the error
    next();
  }
};

exports.incrementCardUsage = async (req, res, next) => {
  try {
    if (req.organization) {
      await req.organization.incrementUsage('cards', 1);
    }
    next();
  } catch (error) {
    console.error('Error incrementing card usage:', error);
    // Don't fail the request, just log the error
    next();
  }
};

/**
 * Helper function to decrement usage after deletion
 */
exports.decrementProfileUsage = async (userId, organizationId) => {
  try {
    if (organizationId) {
      const organization = await Organization.findById(organizationId);
      if (organization) {
        await organization.decrementUsage('profiles', 1);
      }
    }
  } catch (error) {
    console.error('Error decrementing profile usage:', error);
  }
};

exports.decrementCardUsage = async (userId, organizationId) => {
  try {
    if (organizationId) {
      const organization = await Organization.findById(organizationId);
      if (organization) {
        await organization.decrementUsage('cards', 1);
      }
    }
  } catch (error) {
    console.error('Error decrementing card usage:', error);
  }
};
