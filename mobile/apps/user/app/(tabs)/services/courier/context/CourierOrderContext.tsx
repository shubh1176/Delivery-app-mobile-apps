import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { CourierPackage, CourierAddress, CourierContact } from '../api';

interface CourierOrderState {
  loading: boolean;
  packageDetails: Partial<CourierPackage>;
  pickupDetails: {
    address: Partial<CourierAddress>;
    contact: Partial<CourierContact>;
  };
  dropDetails: {
    address: Partial<CourierAddress>;
    contact: Partial<CourierContact>;
  };
  insurance: {
    type: 'basic' | 'standard' | 'premium';
    handling: {
      fragile: boolean;
      signature: boolean;
      refrigerated: boolean;
    };
  };
  payment: {
    method: 'cash' | 'online' | 'wallet' | null;
    estimation: {
      base: number;
      weight: number;
      insurance: number;
      tax: number;
      total: number;
    } | null;
  };
}

type ActionType =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_PACKAGE_DETAILS'; payload: Partial<CourierPackage> }
  | { type: 'SET_PICKUP_ADDRESS'; payload: Partial<CourierAddress> }
  | { type: 'SET_PICKUP_CONTACT'; payload: Partial<CourierContact> }
  | { type: 'SET_DROP_ADDRESS'; payload: Partial<CourierAddress> }
  | { type: 'SET_DROP_CONTACT'; payload: Partial<CourierContact> }
  | { type: 'SET_INSURANCE'; payload: { type: 'basic' | 'standard' | 'premium' } }
  | { type: 'SET_HANDLING'; payload: { key: keyof CourierOrderState['insurance']['handling']; value: boolean } }
  | { type: 'SET_PAYMENT_METHOD'; payload: CourierOrderState['payment']['method'] }
  | { type: 'SET_PRICE_ESTIMATION'; payload: CourierOrderState['payment']['estimation'] }
  | { type: 'RESET_ORDER' };

const initialState: CourierOrderState = {
  loading: false,
  packageDetails: {
    category: undefined,
    size: undefined,
    weight: 0,
    dimensions: {
      length: 0,
      width: 0,
      height: 0
    },
    value: 0,
    photos: [],
    isFragile: false,
    requiresRefrigeration: false,
    description: '',
    items: []
  },
  pickupDetails: {
    address: {},
    contact: {}
  },
  dropDetails: {
    address: {},
    contact: {}
  },
  insurance: {
    type: 'basic',
    handling: {
      fragile: false,
      signature: true,
      refrigerated: false
    }
  },
  payment: {
    method: null,
    estimation: null
  }
};

function courierOrderReducer(state: CourierOrderState, action: ActionType): CourierOrderState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_PACKAGE_DETAILS':
      return { ...state, packageDetails: { ...state.packageDetails, ...action.payload } };
    
    case 'SET_PICKUP_ADDRESS':
      return {
        ...state,
        pickupDetails: { ...state.pickupDetails, address: { ...state.pickupDetails.address, ...action.payload } }
      };
    
    case 'SET_PICKUP_CONTACT':
      return {
        ...state,
        pickupDetails: { ...state.pickupDetails, contact: { ...state.pickupDetails.contact, ...action.payload } }
      };
    
    case 'SET_DROP_ADDRESS':
      return {
        ...state,
        dropDetails: { ...state.dropDetails, address: { ...state.dropDetails.address, ...action.payload } }
      };
    
    case 'SET_DROP_CONTACT':
      return {
        ...state,
        dropDetails: { ...state.dropDetails, contact: { ...state.dropDetails.contact, ...action.payload } }
      };
    
    case 'SET_INSURANCE':
      return {
        ...state,
        insurance: { ...state.insurance, type: action.payload.type }
      };
    
    case 'SET_HANDLING':
      return {
        ...state,
        insurance: {
          ...state.insurance,
          handling: {
            ...state.insurance.handling,
            [action.payload.key]: action.payload.value
          }
        }
      };
    
    case 'SET_PAYMENT_METHOD':
      return {
        ...state,
        payment: { ...state.payment, method: action.payload }
      };
    
    case 'SET_PRICE_ESTIMATION':
      return {
        ...state,
        payment: { ...state.payment, estimation: action.payload }
      };
    
    case 'RESET_ORDER':
      return initialState;
    
    default:
      return state;
  }
}

const CourierOrderContext = createContext<{
  state: CourierOrderState;
  dispatch: React.Dispatch<ActionType>;
} | undefined>(undefined);

export function CourierOrderProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(courierOrderReducer, initialState);

  return (
    <CourierOrderContext.Provider value={{ state, dispatch }}>
      {children}
    </CourierOrderContext.Provider>
  );
}

export function useCourierOrder() {
  const context = useContext(CourierOrderContext);
  if (context === undefined) {
    throw new Error('useCourierOrder must be used within a CourierOrderProvider');
  }
  return context;
} 