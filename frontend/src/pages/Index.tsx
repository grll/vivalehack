import { useState, useEffect } from 'react';
import OnboardingStep from '@/components/OnboardingStep';
import ChatInterface from '@/components/ChatInterface';
import { MainLayout } from '@/components/MainLayout';

const Index = () => {
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean | null>(null);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);

  useEffect(() => {
    // Check if onboarding is already complete
    const onboardingComplete = localStorage.getItem('onboardingComplete');
    setIsOnboardingComplete(onboardingComplete === 'true');
    setIsCheckingOnboarding(false);
  }, []);

  const handleOnboardingComplete = (linkedinUrl: string, userData: { firstName: string; lastName: string }) => {
    setIsOnboardingComplete(true);
    console.log('Onboarding completed with LinkedIn:', linkedinUrl);
    console.log('User data received:', userData);
  };

  if (isCheckingOnboarding) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
          <div className="text-slate-600 dark:text-slate-400">Loading...</div>
        </div>
      </MainLayout>
    );
  }

  if (!isOnboardingComplete) {
    return <OnboardingStep onComplete={handleOnboardingComplete} />;
  }

  return (
    <MainLayout>
      <ChatInterface />
    </MainLayout>
  );
};

export default Index;
