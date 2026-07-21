"use client";

import { useShipment, useShipments, useCreateShipment, useUpdateShipmentStatus, useAssignDriver, useTrackShipment } from "./useShipment";
import { useDrivers, useDriver, useDriverPerformance, useCreateDriver, useUpdateDriver } from "./useDriver";
import { useVehicles, useVehicle, useFleetStats, useCreateVehicle, useAssignDriverToVehicle } from "./useVehicle";
import { useRoutes, useRoute, useCreateRoute, useOptimizeRoute, useUpdateRouteStatus } from "./useRoute";
import { useZones, useZoneCoverage } from "./useZone";

/**
 * Combined logistics hook that aggregates all logistics-related hooks.
 * Use this for dashboard overview pages that need data from multiple domains.
 */
export function useLogistics() {
  const { data: shipments, isLoading: shipmentsLoading } = useShipments({});
  const { data: drivers, isLoading: driversLoading } = useDrivers({});
  const { data: vehicles, isLoading: vehiclesLoading } = useVehicles({});
  const { data: routes, isLoading: routesLoading } = useRoutes({});
  const { data: fleetStats } = useFleetStats();
  const { data: zones } = useZones();

  const isLoading = shipmentsLoading || driversLoading || vehiclesLoading || routesLoading;

  const stats = {
    activeShipments: shipments?.filter((s: any) => s.status === "in_transit" || s.status === "out_for_delivery").length ?? 0,
    pendingShipments: shipments?.filter((s: any) => s.status === "pending").length ?? 0,
    deliveredToday: shipments?.filter((s: any) => s.status === "delivered").length ?? 0,
    activeDrivers: drivers?.filter((d: any) => d.status === "active").length ?? 0,
    totalDrivers: drivers?.length ?? 0,
    activeVehicles: vehicles?.filter((v: any) => v.status === "active").length ?? 0,
    totalVehicles: vehicles?.length ?? 0,
    inMaintenance: vehicles?.filter((v: any) => v.status === "maintenance").length ?? 0,
    activeRoutes: routes?.filter((r: any) => r.status === "active").length ?? 0,
    completedRoutes: routes?.filter((r: any) => r.status === "completed").length ?? 0,
    fleetUtilization: fleetStats?.utilization ?? 0,
    onTimeRate: fleetStats?.onTimeRate ?? 0,
  };

  return {
    // Data
    shipments,
    drivers,
    vehicles,
    routes,
    zones,
    fleetStats,
    
    // Stats
    stats,
    
    // Loading state
    isLoading,
  };
}

// Re-export all individual hooks for direct usage
export {
  useShipment,
  useShipments,
  useCreateShipment,
  useUpdateShipmentStatus,
  useAssignDriver,
  useTrackShipment,
  useDrivers,
  useDriver,
  useDriverPerformance,
  useCreateDriver,
  useUpdateDriver,
  useVehicles,
  useVehicle,
  useFleetStats,
  useCreateVehicle,
  useAssignDriverToVehicle,
  useRoutes,
  useRoute,
  useCreateRoute,
  useOptimizeRoute,
  useUpdateRouteStatus,
  useZones,
  useZoneCoverage,
};
