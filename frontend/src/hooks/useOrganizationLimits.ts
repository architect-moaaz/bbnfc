import { useState, useEffect } from 'react';
import { organizationsAPI } from '../services/api';

interface OrganizationLimits {
  users: number;
  profiles: number;
  cards: number;
  storage: number;
}

interface OrganizationUsage {
  users: number;
  profiles: number;
  cards: number;
  storage: number;
}

interface UseOrganizationLimitsReturn {
  limits: OrganizationLimits | null;
  usage: OrganizationUsage | null;
  loading: boolean;
  error: string | null;
  canAddProfile: () => boolean;
  canAddCard: () => boolean;
  canAddUser: () => boolean;
  getProfilesRemaining: () => number;
  getCardsRemaining: () => number;
  getUsersRemaining: () => number;
  isNearProfileLimit: () => boolean;
  isNearCardLimit: () => boolean;
  isNearUserLimit: () => boolean;
  refresh: () => Promise<void>;
}

export const useOrganizationLimits = (): UseOrganizationLimitsReturn => {
  const [limits, setLimits] = useState<OrganizationLimits | null>(null);
  const [usage, setUsage] = useState<OrganizationUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLimits = async () => {
    try {
      setLoading(true);
      const response = await organizationsAPI.getCurrentOrganization();

      if (response.success && response.data) {
        setLimits({
          users: response.data.limits?.users || 0,
          profiles: response.data.limits?.profiles || 0,
          cards: response.data.limits?.cards || 0,
          storage: response.data.limits?.storage || 0,
        });

        setUsage({
          users: response.data.usage?.users || 0,
          profiles: response.data.usage?.profiles || 0,
          cards: response.data.usage?.cards || 0,
          storage: response.data.usage?.storage || 0,
        });

        setError(null);
      }
    } catch (err: any) {
      console.error('Failed to fetch organization limits:', err);
      setError('Failed to load organization limits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLimits();
  }, []);

  const canAddProfile = (): boolean => {
    if (!limits || !usage) return true;
    if (limits.profiles === -1) return true; // Unlimited
    return usage.profiles < limits.profiles;
  };

  const canAddCard = (): boolean => {
    if (!limits || !usage) return true;
    if (limits.cards === -1) return true; // Unlimited
    return usage.cards < limits.cards;
  };

  const canAddUser = (): boolean => {
    if (!limits || !usage) return true;
    if (limits.users === -1) return true; // Unlimited
    return usage.users < limits.users;
  };

  const getProfilesRemaining = (): number => {
    if (!limits || !usage) return 0;
    if (limits.profiles === -1) return Infinity;
    return Math.max(0, limits.profiles - usage.profiles);
  };

  const getCardsRemaining = (): number => {
    if (!limits || !usage) return 0;
    if (limits.cards === -1) return Infinity;
    return Math.max(0, limits.cards - usage.cards);
  };

  const getUsersRemaining = (): number => {
    if (!limits || !usage) return 0;
    if (limits.users === -1) return Infinity;
    return Math.max(0, limits.users - usage.users);
  };

  const isNearProfileLimit = (): boolean => {
    if (!limits || !usage) return false;
    if (limits.profiles === -1) return false;
    return (usage.profiles / limits.profiles) >= 0.75;
  };

  const isNearCardLimit = (): boolean => {
    if (!limits || !usage) return false;
    if (limits.cards === -1) return false;
    return (usage.cards / limits.cards) >= 0.75;
  };

  const isNearUserLimit = (): boolean => {
    if (!limits || !usage) return false;
    if (limits.users === -1) return false;
    return (usage.users / limits.users) >= 0.75;
  };

  return {
    limits,
    usage,
    loading,
    error,
    canAddProfile,
    canAddCard,
    canAddUser,
    getProfilesRemaining,
    getCardsRemaining,
    getUsersRemaining,
    isNearProfileLimit,
    isNearCardLimit,
    isNearUserLimit,
    refresh: fetchLimits,
  };
};
