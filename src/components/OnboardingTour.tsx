import React, { useMemo } from 'react';
import Joyride, { Step, CallBackProps, STATUS, EVENTS, ACTIONS } from 'react-joyride';
import { useTourState } from '@/state/useTourState';
import { useTheme } from '@/hooks/useTheme';
import { dashboardSteps, referralsSteps, marketingSteps, myAccountsSteps, settingsSteps, stoplightSteps } from '@/lib/tourSteps';

const tours: Record<string, Step[]> = {
  dashboard: dashboardSteps,
  referrals: referralsSteps,
  marketing: marketingSteps,
  'my-accounts': myAccountsSteps,
  settings: settingsSteps,
  stoplight: stoplightSteps,
};

const OnboardingTour = () => {
  const { run, stepIndex, tourKey, stopTour, goToStep } = useTourState();
  const { theme } = useTheme();

  const handleCallback = (data: CallBackProps) => {
    const { action, index, status, type } = data;

    if ([EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND].includes(type as any)) {
      const newStepIndex = index + (action === ACTIONS.PREV ? -1 : 1);
      goToStep(newStepIndex);
    } else if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      stopTour();
      if (tourKey === 'dashboard') {
        localStorage.setItem('hasSeenTour', 'true');
      }
    }
  };

  const steps = useMemo(() => {
    return tourKey ? tours[tourKey] || [] : [];
  }, [tourKey]);

  return (
    <Joyride
      run={run}
      steps={steps}
      stepIndex={stepIndex}
      callback={handleCallback}
      continuous
      showProgress
      showSkipButton
      styles={{
        options: {
          zIndex: 10000,
          arrowColor: theme === 'dark' ? '#1e1e1e' : '#fff',
          backgroundColor: theme === 'dark' ? '#1e1e1e' : '#fff',
          primaryColor: '#14b8a6',
          textColor: theme === 'dark' ? '#f3f4f6' : '#111827',
        },
        tooltip: {
          borderRadius: '1rem',
        },
        buttonNext: {
          borderRadius: '0.75rem',
        },
        buttonBack: {
          borderRadius: '0.75rem',
        },
      }}
    />
  );
};

export default OnboardingTour;
