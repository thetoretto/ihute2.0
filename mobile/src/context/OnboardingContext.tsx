import React from 'react';

export const OnboardingContext = React.createContext<{ completeOnboarding: () => void } | null>(null);
