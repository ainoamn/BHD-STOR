import { create } from 'zustand';
import type { Shipment, Route, Location } from '../types/driver.types';

interface DriverState {
  // Online status
  isOnline: boolean;
  isToggling: boolean;

  // Route & Shipments
  currentRoute: Route | null;
  activeShipment: Shipment | null;
  todayShipments: Shipment[];
  isLoadingShipments: boolean;

  // Location
  location: Location | null;
  isTrackingLocation: boolean;

  // Actions
  setOnline: (status: boolean) => void;
  setToggling: (toggling: boolean) => void;
  setCurrentRoute: (route: Route | null) => void;
  setActiveShipment: (shipment: Shipment | null) => void;
  setTodayShipments: (shipments: Shipment[]) => void;
  setLoadingShipments: (loading: boolean) => void;
  updateShipmentInList: (shipment: Shipment) => void;
  updateLocation: (location: Location) => void;
  setTrackingLocation: (tracking: boolean) => void;

  // Navigation state
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const useDriverStore = create<DriverState>(set => ({
  // Initial state
  isOnline: false,
  isToggling: false,
  currentRoute: null,
  activeShipment: null,
  todayShipments: [],
  isLoadingShipments: false,
  location: null,
  isTrackingLocation: false,
  currentTab: 'Shipments',

  // Actions
  setOnline: (status: boolean) => set({ isOnline: status }),
  setToggling: (toggling: boolean) => set({ isToggling: toggling }),
  setCurrentRoute: (route: Route | null) => set({ currentRoute: route }),
  setActiveShipment: (shipment: Shipment | null) => set({ activeShipment: shipment }),
  setTodayShipments: (shipments: Shipment[]) => set({ todayShipments: shipments }),
  setLoadingShipments: (loading: boolean) => set({ isLoadingShipments: loading }),

  updateShipmentInList: (shipment: Shipment) =>
    set(state => ({
      todayShipments: state.todayShipments.map(s =>
        s.id === shipment.id ? shipment : s,
      ),
    })),

  updateLocation: (location: Location) => set({ location }),
  setTrackingLocation: (tracking: boolean) => set({ isTrackingLocation: tracking }),

  setCurrentTab: (tab: string) => set({ currentTab: tab }),
}));
