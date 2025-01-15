import React, { createContext, useContext, useState } from 'react';
import type { Location } from '../app/types/location';
import type {
  Contact,
  PackageDetails,
  Drop,
  Pickup,
  OrderPricing,
  OrderPayment,
  VehicleType,
} from '../app/types/order';

interface OrderCreationState {
  pickup: Partial<Pickup> | null;
  drops: Partial<Drop>[];
  packageDetails: Partial<PackageDetails> | null;
  pricing: Partial<OrderPricing> | null;
  payment: Partial<OrderPayment> | null;
  vehicleType: VehicleType | null;
  estimatedDuration: number | null;
}

interface OrderCreationContextType {
  state: OrderCreationState;
  setPickup: (pickup: Partial<Pickup>) => void;
  setDrops: (drops: Partial<Drop>[]) => void;
  addDrop: (drop: Partial<Drop>) => void;
  removeDrop: (index: number) => void;
  setPackageDetails: (details: Partial<PackageDetails>) => void;
  setPricing: (pricing: Partial<OrderPricing>) => void;
  setPayment: (payment: Partial<OrderPayment>) => void;
  setVehicleType: (type: VehicleType) => void;
  setEstimatedDuration: (duration: number) => void;
  reset: () => void;
}

const initialState: OrderCreationState = {
  pickup: null,
  drops: [],
  packageDetails: null,
  pricing: null,
  payment: null,
  vehicleType: null,
  estimatedDuration: null,
};

const OrderCreationContext = createContext<OrderCreationContextType | null>(null);

export function OrderCreationProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<OrderCreationState>(initialState);

  const setPickup = (pickup: Partial<Pickup>) => {
    console.log('[OrderCreation] Setting pickup:', pickup);
    setState((prev) => ({ ...prev, pickup }));
  };

  const setDrops = (drops: Partial<Drop>[]) => {
    console.log('[OrderCreation] Setting drops:', drops);
    setState((prev) => ({ ...prev, drops }));
  };

  const addDrop = (drop: Partial<Drop>) => {
    console.log('[OrderCreation] Adding drop:', drop);
    setState((prev) => ({
      ...prev,
      drops: [...prev.drops, drop],
    }));
  };

  const removeDrop = (index: number) => {
    console.log('[OrderCreation] Removing drop at index:', index);
    setState((prev) => ({
      ...prev,
      drops: prev.drops.filter((_, i) => i !== index),
    }));
  };

  const setPackageDetails = (packageDetails: Partial<PackageDetails>) => {
    console.log('[OrderCreation] Setting package details:', packageDetails);
    setState((prev) => ({ ...prev, packageDetails }));
  };

  const setPricing = (pricing: Partial<OrderPricing>) => {
    console.log('[OrderCreation] Setting pricing:', pricing);
    setState((prev) => ({ ...prev, pricing }));
  };

  const setPayment = (payment: Partial<OrderPayment>) => {
    console.log('[OrderCreation] Setting payment:', payment);
    setState((prev) => ({ ...prev, payment }));
  };

  const setVehicleType = (vehicleType: VehicleType) => {
    console.log('[OrderCreation] Setting vehicle type:', vehicleType);
    setState((prev) => ({ ...prev, vehicleType }));
  };

  const setEstimatedDuration = (estimatedDuration: number) => {
    console.log('[OrderCreation] Setting estimated duration:', estimatedDuration);
    setState((prev) => ({ ...prev, estimatedDuration }));
  };

  const reset = () => {
    console.log('[OrderCreation] Resetting state');
    setState(initialState);
  };

  return (
    <OrderCreationContext.Provider
      value={{
        state,
        setPickup,
        setDrops,
        addDrop,
        removeDrop,
        setPackageDetails,
        setPricing,
        setPayment,
        setVehicleType,
        setEstimatedDuration,
        reset,
      }}
    >
      {children}
    </OrderCreationContext.Provider>
  );
}

export function useOrderCreation() {
  const context = useContext(OrderCreationContext);
  if (!context) {
    throw new Error('useOrderCreation must be used within an OrderCreationProvider');
  }
  return context;
} 