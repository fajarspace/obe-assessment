import { useState } from "react";
import { Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LineShadowText } from "@/components/magicui/line-shadow-text";

const OBESignInPage = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = () => {
    setIsLoading(true);
    // Redirect to Google OAuth endpoint
    window.location.href = `${import.meta.env.VITE_API_URI}/auth/google`;

    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Hero Text with Solid Color */}
      <div className="flex-1 relative flex items-center justify-center p-6 lg:p-12 bg-blue-900">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(/bg-blue.png)` }}
        >
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-black/20"></div>
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-blue-900/40"></div>
        </div>
        <div className="relative z-10 text-white max-w-2xl w-full space-y-6">
          <h1
            className="uppercase font-extrabold italic tracking-wide leading-tight text-left 
                         text-5xl sm:text-7xl lg:text-9xl"
          >
            we are <br /> ready <br /> for <br />
            <LineShadowText className="italic text-[80px] sm:text-[100px] lg:text-[140px]">
              Raker
            </LineShadowText>
          </h1>
        </div>
      </div>

      {/* Right Side - Sign In with Background Image */}
      <div className="flex-1 relative flex items-center justify-center p-6 lg:p-12 min-h-[60vh] lg:min-h-screen">
        {/* Background Image */}

        {/* Sign In Box */}
        <div className="relative z-10 w-full max-w-md space-y-8 rounded-2xl p-8">
          {/* Logo and Title */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="bg-blue-600 p-4 rounded-2xl shadow-lg">
                <Package className="h-10 w-10 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">OBE</h2>
              <p className="mt-2 text-gray-600 text-lg">
                Sign in to access your OBE dashboard
              </p>
            </div>
          </div>

          {/* Sign In Button */}
          <div className="space-y-6">
            <Button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full h-auto p-4 rounded-xl shadow-md 
                         bg-white border border-gray-200 text-gray-900 
                         hover:bg-gray-50 hover:border-blue-300 
                         transition transform hover:scale-[1.02] 
                         disabled:opacity-70 disabled:transform-none"
            >
              <div className="flex items-center justify-center space-x-3">
                {isLoading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600"></div>
                ) : (
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 
                      1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 
                      3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 
                      1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 
                      20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 
                      8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 
                      2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 
                      7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                )}
                <span className="font-medium text-lg text-center">
                  {isLoading
                    ? "Signing in..."
                    : "Continue with Pelita Bangsa Google"}
                </span>
              </div>
            </Button>

            {/* Footer Note */}
            <div className="text-center">
              <span className="text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-full">
                OBE Platform • Beta Version
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OBESignInPage;
