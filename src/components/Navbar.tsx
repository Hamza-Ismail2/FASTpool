"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Menu, X, User, LogOut, LogIn, AlertCircle } from "lucide-react";
import { auth } from "@/firebase/clientApp";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [authPrompt, setAuthPrompt] = useState(false);
  
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      unsubscribe();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
  
  // Define protected routes that need authentication
  const protectedRoutes = ['/rides', '/offer', '/my-rides', '/profile'];
  
  const handleProtectedNavigation = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    // If the path is protected and user is not authenticated
    if (protectedRoutes.includes(path) && !user) {
      e.preventDefault();
      setAuthPrompt(true);
      setTimeout(() => setAuthPrompt(false), 5000); // Hide the prompt after 5 seconds
      
      // Option: Redirect to auth page with a return URL
      // router.push(`/auth?redirectTo=${encodeURIComponent(path)}`);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      
      // If user is on a protected page, redirect to home
      if (protectedRoutes.includes(pathname || '')) {
        router.push('/');
      }
    } catch (error) {
      console.error("Sign-out error: ", error);
    }
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-gray-900/90 backdrop-blur-md shadow-md"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
                  FASTpool
                </span>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <Link
                href="/"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Home
              </Link>
              <Link
                href="/rides"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  user 
                    ? "text-gray-300 hover:text-white" 
                    : "text-gray-500 cursor-not-allowed"
                }`}
                onClick={(e) => handleProtectedNavigation(e, '/rides')}
              >
                Find Rides
              </Link>
              <Link
                href="/offer"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  user 
                    ? "text-gray-300 hover:text-white" 
                    : "text-gray-500 cursor-not-allowed"
                }`}
                onClick={(e) => handleProtectedNavigation(e, '/offer')}
              >
                Offer Ride
              </Link>
              <Link
                href="/about"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                About
              </Link>

              {user ? (
                <div className="relative group ml-4">
                  <button className="flex items-center rounded-full overflow-hidden border-2 border-emerald-500/30 focus:outline-none focus:border-emerald-500/70 transition-all">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || "User"}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center">
                        <User size={16} className="text-emerald-400" />
                      </div>
                    )}
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg overflow-hidden scale-0 group-hover:scale-100 origin-top-right transition-all duration-200 border border-gray-700 z-50">
                    <div className="py-2">
                      <div className="px-4 py-3 border-b border-gray-700">
                        <p className="text-sm text-white font-medium truncate">
                          {user.displayName}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {user.email}
                        </p>
                      </div>
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                      >
                        Profile
                      </Link>
                      <Link
                        href="/my-rides"
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                      >
                        My Rides
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <LogOut size={14} />
                          <span>Sign Out</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  href="/auth"
                  className="inline-flex items-center gap-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-emerald-500/20"
                >
                  <LogIn size={16} />
                  <span>Sign In</span>
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-300 hover:text-white hover:bg-gray-800 focus:outline-none"
              >
                {isMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={`${
            isMenuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
          } md:hidden bg-gray-900 overflow-hidden transition-all duration-300 ease-in-out`}
        >
          <div className="px-2 pt-2 pb-3 space-y-1 border-t border-gray-800">
            <Link
              href="/"
              className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-gray-800 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            
            {user ? (
              <>
                <Link
                  href="/rides"
                  className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-gray-800 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Find Rides
                </Link>
                <Link
                  href="/offer"
                  className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-gray-800 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Offer Ride
                </Link>
              </>
            ) : (
              <>
                <div
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-500 cursor-not-allowed"
                  onClick={() => {
                    setAuthPrompt(true);
                    setTimeout(() => setAuthPrompt(false), 5000); // Hide the prompt after 5 seconds
                  }}
                >
                  Find Rides <span className="text-xs">(Sign in required)</span>
                </div>
                <div
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-500 cursor-not-allowed"
                  onClick={() => {
                    setAuthPrompt(true);
                    setTimeout(() => setAuthPrompt(false), 5000); // Hide the prompt after 5 seconds
                  }}
                >
                  Offer Ride <span className="text-xs">(Sign in required)</span>
                </div>
              </>
            )}
            
            <Link
              href="/about"
              className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-gray-800 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              About
            </Link>
            
            {user ? (
              <div className="pt-4 pb-3 border-t border-gray-800">
                <div className="flex items-center px-3">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || "User"}
                      className="h-10 w-10 rounded-full border-2 border-emerald-500/30"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center border-2 border-emerald-500/30">
                      <User size={18} className="text-emerald-400" />
                    </div>
                  )}
                  <div className="ml-3">
                    <div className="text-base font-medium text-white">
                      {user.displayName}
                    </div>
                    <div className="text-sm font-medium text-gray-400">
                      {user.email}
                    </div>
                  </div>
                </div>
                <div className="mt-3 space-y-1 border-t border-gray-800 pt-2">
                  <Link
                    href="/profile"
                    className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-gray-800 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    href="/my-rides"
                    className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-gray-800 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    My Rides
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-400 hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <LogOut size={18} />
                      <span>Sign Out</span>
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/auth"
                className="block w-full mt-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-3 px-4 rounded-lg text-center font-medium shadow-md"
                onClick={() => setIsMenuOpen(false)}
              >
                <div className="flex items-center justify-center gap-2">
                  <LogIn size={18} />
                  <span>Sign In</span>
                </div>
              </Link>
            )}
          </div>
        </div>
      </nav>
      
      {/* Authentication Prompt */}
      {authPrompt && !user && (
        <div className="fixed bottom-4 right-4 bg-gray-800/90 backdrop-blur-md rounded-lg p-4 border border-emerald-500/30 shadow-lg z-50 max-w-sm animate-fade-in flex items-start gap-3">
          <AlertCircle className="text-emerald-500 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-white font-medium mb-2">Authentication Required</p>
            <p className="text-gray-300 text-sm mb-3">Please sign in to access this feature. Only FAST University students with @nu.edu.pk email can sign in.</p>
            <Link 
              href="/auth" 
              className="inline-flex items-center gap-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-all shadow-md w-full justify-center"
              onClick={() => setAuthPrompt(false)}
            >
              <LogIn size={16} />
              <span>Sign In Now</span>
            </Link>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar; 