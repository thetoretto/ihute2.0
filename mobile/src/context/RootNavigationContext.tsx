import React, { createContext, useContext } from 'react';
import type { NavigationContainerRefWithCurrent } from '@react-navigation/native';

export type RootParamList = {
  VehicleGarage: undefined;
  DriverActivityListStack: undefined;
  EditProfile: undefined;
  AddCard: undefined;
  AddMobileMoney: undefined;
  Wallet: undefined;
  TermsOfService: undefined;
  AddVehicle: undefined;
  EditVehicle: { vehicleId: string };
  Earnings: undefined;
  FAQ: undefined;
  About: undefined;
  [key: string]: undefined | object;
};

const RootNavigationContext = createContext<React.RefObject<NavigationContainerRefWithCurrent<RootParamList>> | null>(
  null
);

export function RootNavigationProvider({
  children,
  rootNavRef,
}: {
  children: React.ReactNode;
  rootNavRef: React.RefObject<NavigationContainerRefWithCurrent<RootParamList> | null>;
}) {
  return (
    <RootNavigationContext.Provider value={rootNavRef}>
      {children}
    </RootNavigationContext.Provider>
  );
}

export function useRootNavigation() {
  const rootNavRef = useContext(RootNavigationContext);
  if (!rootNavRef) return { rootNavigate: () => {}, ref: null };
  return {
    ref: rootNavRef,
    rootNavigate: (name: keyof RootParamList, params?: object) => {
      rootNavRef.current?.navigate(name as string, params as any);
    },
  };
}
