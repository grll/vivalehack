import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ExternalLink, ArrowRight, AlertCircle } from 'lucide-react';
import api from '@/config/api';
import { AxiosError } from 'axios';

interface OnboardingStepProps {
  onComplete: (linkedinUrl: string, userData: { firstName: string; lastName: string }) => void;
}

const OnboardingStep = ({ onComplete }: OnboardingStepProps) => {
  const { t } = useTranslation();
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const validateLinkedInUrl = (url: string) => {
    if (!url.trim()) {
      return 'LinkedIn profile URL is required';
    }
    
    const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?$/;
    if (!linkedinRegex.test(url.trim())) {
      return 'Please enter a valid LinkedIn profile URL (e.g., https://linkedin.com/in/your-profile)';
    }
    
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const trimmedUrl = linkedinUrl.trim();
    const validationError = validateLinkedInUrl(trimmedUrl);
    
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    
    try {
      // Send LinkedIn URL to backend
      const response = await api.post('/linkedin-profile', {
        linkedinUrl: trimmedUrl
      });

      const { firstName, lastName } = response.data;
      
      // Store LinkedIn URL and user data in localStorage
      localStorage.setItem('linkedinUrl', trimmedUrl);
      localStorage.setItem('fullName', `${firstName} ${lastName}`);
      localStorage.setItem('onboardingComplete', 'true');
      
      // Call onComplete with the user data
      onComplete(trimmedUrl, { firstName, lastName });
      
    } catch (error) {
      console.error('Error submitting LinkedIn profile:', error);
      
      // Handle specific error messages from backend
      if (error instanceof AxiosError) {
        if (error.response?.data?.message) {
          setError(error.response.data.message);
        } else if (error.response?.status === 400) {
          setError('Invalid LinkedIn profile URL. Please check and try again.');
        } else if (error.response?.status === 404) {
          setError('LinkedIn profile not found. Please check the URL and try again.');
        } else {
          setError('Failed to validate LinkedIn profile. Please try again.');
        }
      } else {
        setError('Failed to validate LinkedIn profile. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: "url('/vivatech.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Background overlay for better readability */}
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60"></div>
      
      <div className="max-w-lg w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-10 text-center space-y-8 relative z-10 border border-white/20 dark:border-slate-700">
        {/* Welcome Header */}
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl shadow-lg mb-4">
            <ExternalLink className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-700 to-slate-900 dark:from-white dark:to-slate-200 mb-2">
            {t('onboarding.welcome')}
          </h1>
          
          <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            {t('onboarding.description')}
          </p>
        </div>

        {/* LinkedIn Input Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3 text-left">
            <label htmlFor="linkedin" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              LinkedIn Profile <span className="text-red-500">*</span>
            </label>
            <Input
              id="linkedin"
              type="url"
              placeholder={t('onboarding.linkedinPlaceholder')}
              value={linkedinUrl}
              onChange={(e) => {
                setLinkedinUrl(e.target.value);
                if (error) setError(''); // Clear error when user starts typing
              }}
              className={`w-full h-12 px-4 text-base border-2 rounded-xl transition-colors bg-white dark:bg-slate-800 ${
                error 
                  ? 'border-red-300 dark:border-red-600 focus:border-red-500 dark:focus:border-red-400' 
                  : 'border-slate-200 dark:border-slate-600 focus:border-slate-500 dark:focus:border-slate-400'
              }`}
              required
            />
            
            {error && (
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t('onboarding.linkedinHelp')}
            </p>
          </div>

          <div className="space-y-3">
            <Button
              type="submit"
              disabled={isLoading || !linkedinUrl.trim()}
              className="w-full h-12 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 disabled:from-slate-400 disabled:to-slate-500 text-white rounded-xl font-semibold text-base transition-all duration-200 shadow-lg hover:shadow-xl disabled:shadow-none"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Validating Profile...
                </>
              ) : (
                <>
                  {t('onboarding.getStarted')}
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </div>
        </form>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {t('onboarding.privacyNote')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default OnboardingStep;