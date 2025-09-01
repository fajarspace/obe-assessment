import { useState } from "react";
import { LineShadowText } from "@/components/magicui/line-shadow-text";

const OBESignInPage = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = () => {
    setIsLoading(true);
    // Redirect to Google OAuth endpoint
    window.location.href = `${import.meta.env.VITE_API_URI}/auth/google`;

    // Reset loading state after redirect attempt
    setTimeout(() => setIsLoading(false), 2000);
  };

  const GoogleIcon = () => (
    <svg className="w-6 h-6" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );

  const LoadingSpinner = () => (
    <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600" />
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Hero Section */}
      <div className="flex-2 relative flex items-center justify-center p-4 lg:p-12 bg-blue-900">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(/bg-yellow.png)` }}
          aria-hidden="true"
        />

        {/* Hero Content */}
        <div className="relative z-10 text-white max-w-5xl w-full">
          <h1 className="uppercase font-extrabold italic tracking-wide leading-tight text-left text-5xl sm:text-7xl lg:text-8xl">
            outcome <br />
            based <br />
            education <br />
            Assessment
          </h1>
        </div>
      </div>

      {/* Right Side - Sign In Form */}
      <div className="flex-1 relative flex items-center justify-center">
        {/* Background Image - Fixed positioning */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(/bg-white.png)` }}
          aria-hidden="true"
        />

        {/* Sign In Form Content */}
        <div className="relative z-10 w-full max-w-md p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center">
              <LineShadowText className="italic text-[80px] sm:text-[100px] lg:text-[140px] text-blue-800">
                OBE
              </LineShadowText>
            </div>
            <p className="text-gray-600 text-lg">
              Sign in to access your OBE dashboard
            </p>
          </div>

          {/* Sign In Button */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full p-4 rounded-xl shadow-md bg-white border border-gray-200 text-gray-900 hover:bg-gray-50 hover:border-blue-800 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-70 disabled:transform-none disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-center space-x-3">
              {isLoading ? <LoadingSpinner /> : <GoogleIcon />}
              <span className="font-medium text-lg">
                {isLoading ? "Signing in..." : "Continue with Google"}
              </span>
            </div>
          </button>

          {/* Footer */}
          <div className="text-center mt-6">
            <span className="inline-block text-sm text-gray-500 bg-gray-100 px-4 py-2 rounded-full">
              OBE Assessment • Beta Version
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OBESignInPage;
