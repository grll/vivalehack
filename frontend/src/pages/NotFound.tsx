import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { MapPin } from 'lucide-react';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mx-auto w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
          <MapPin className="w-10 h-10 text-gray-600 dark:text-gray-400" />
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Page Not Found</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Looks like you've wandered off the map. Let's get you back on track!
        </p>
        
        <a href="/" className="text-gray-900 hover:text-gray-700 dark:text-gray-100 dark:hover:text-gray-300 underline">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
