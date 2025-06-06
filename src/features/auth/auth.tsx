"use client";

import { useEffect, useState } from "react";
import { auth } from "@/firebase/clientApp";    
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut, User } from "firebase/auth";
import { LogOut, ChevronRight, Car, AlertTriangle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import { createOrUpdateUser, getUserProfile, UserProfile } from "@/firebase/models/user";
import CompleteProfile from "./CompleteProfile";

function SignInScreen() {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [needsProfile, setNeedsProfile] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const ALLOWED_DOMAIN = "nu.edu.pk";
    
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get('redirectTo');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                if (user.email && isAllowedEmail(user.email)) {
                    setUser(user);
                    setError(null);
                    try {
                        await createOrUpdateUser(user);
                        // Fetch user profile from Firestore
                        const profile = await getUserProfile(user.uid);
                        setProfile(profile);
                        // Check if phone/gender are missing or invalid
                        if (!profile?.phone?.trim() || !['male','female'].includes(profile.gender)) {
                            setNeedsProfile(true);
                        } else {
                            setNeedsProfile(false);
                            // Set cookie and redirect if needed
                            user.getIdToken().then(token => {
                                Cookies.set('__session', token, { 
                                    expires: 14,
                                    secure: process.env.NODE_ENV === 'production',
                                    sameSite: 'lax'
                                });
                                if (redirectTo) {
                                    router.push(decodeURIComponent(redirectTo));
                                }
                            });
                        }
                    } catch (error) {
                        console.error("Error updating user profile:", error);
                    }
                } else {
                    handleSignOut();
                    setError(`Only ${ALLOWED_DOMAIN} email addresses are allowed.`);
                }
            } else {
                setUser(null);
                setProfile(null);
                setNeedsProfile(false);
                Cookies.remove('__session');
            }
        });

        return () => unsubscribe();
    }, [redirectTo, router]);

    // Function to check if email is from allowed domain
    const isAllowedEmail = (email: string) => {
        return email.endsWith(`@${ALLOWED_DOMAIN}`);
    };

    const handleGoogleSignIn = async () => {
        setLoading(true);
        setError(null);
        const provider = new GoogleAuthProvider();
        
        // Hint to users to use their academic email
        provider.setCustomParameters({
            prompt: 'select_account'
        });
        
        try {
            const result = await signInWithPopup(auth, provider);
            const email = result.user.email;
            
            // Verify domain after sign-in
            if (email && !isAllowedEmail(email)) {
                await handleSignOut();
                setError(`Only ${ALLOWED_DOMAIN} email addresses are allowed.`);
            }
        } catch (error) {
            console.error("Sign In error: ", error);
            setError("Sign in failed. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    const handleSignOut = async() => {
        try {
            await signOut(auth);
            setUser(null);
            setProfile(null);
            setNeedsProfile(false);
            Cookies.remove('__session');
        } catch (error) {
            console.error("Sign-out error: ", error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 relative overflow-hidden flex items-center justify-center p-4 pt-20">
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-400 opacity-10"></div>
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
            
            <div className="relative w-full max-w-md z-10">
                {/* Main card */}
                <div className="bg-gray-800/80 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-gray-700">
                    {/* Header section */}
                    <div className="pt-10 pb-8 px-8 text-center relative overflow-hidden">
                        {/* Decorative overlay */}
                        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-emerald-500/10 to-transparent"></div>
                        
                        <div className="relative">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 mb-6 shadow-lg shadow-emerald-500/20">
                                <Car className="text-white" size={28} />
                            </div>
                            <h1 className="text-3xl font-bold text-white mb-3">
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
                                    FASTpool
                                </span>
                            </h1>
                            <p className="text-gray-300 text-lg">
                                {user ? 'Welcome back!' : 'Your ride-sharing solution'}
                            </p>
                        </div>
                    </div>
                    
                    {/* Content section */}
                    <div className="bg-gray-900 rounded-t-2xl p-8 border-t border-gray-700">
                        {user ? (
                            needsProfile ? (
                                <CompleteProfile
                                    uid={user.uid}
                                    onComplete={async () => {
                                        // Refetch profile and set cookie/redirect
                                        const updated = await getUserProfile(user.uid);
                                        setProfile(updated);
                                        setNeedsProfile(false);
                                        user.getIdToken().then(token => {
                                            Cookies.set('__session', token, { 
                                                expires: 14,
                                                secure: process.env.NODE_ENV === 'production',
                                                sameSite: 'lax'
                                            });
                                            if (redirectTo) {
                                                router.push(decodeURIComponent(redirectTo));
                                            }
                                        });
                                    }}
                                />
                            ) : (
                                <div className="flex flex-col items-center">
                                    <div className="relative mb-6 group">
                                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-sm group-hover:blur-md transition-all opacity-80"></div>
                                        <img 
                                            src={user.photoURL || ""} 
                                            alt={user.displayName || "User"} 
                                            className="relative w-24 h-24 rounded-full object-cover border-4 border-gray-800"
                                        />
                                    </div>
                                    <h2 className="text-xl font-semibold text-white mb-1">
                                        {user.displayName}
                                    </h2>
                                    <p className="text-gray-400 mb-6">
                                        {user.email}
                                    </p>
                                    
                                    <div className="flex flex-col sm:flex-row gap-4 mb-8">
                                        <button 
                                            onClick={() => router.push('/rides')}
                                            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-3 px-6 rounded-xl font-medium transition-all shadow-md"
                                        >
                                            Find Rides
                                        </button>
                                        <button 
                                            onClick={() => router.push('/offer')}
                                            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-3 px-6 rounded-xl font-medium transition-all shadow-md"
                                        >
                                            Offer a Ride
                                        </button>
                                    </div>
                                    
                                    <button 
                                        onClick={handleSignOut}
                                        className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-200 py-3 px-6 rounded-xl font-medium transition-all shadow-md border border-gray-700 hover:border-red-500/30"
                                    >
                                        <LogOut size={18} className="text-red-400" />
                                        Sign Out
                                    </button>
                                </div>
                            )
                        ) : (
                            <div className="flex flex-col">
                                <div className="inline-block px-3 py-1 mb-4 self-start rounded-full bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 backdrop-blur-md border border-emerald-500/30">
                                    <span className="text-sm font-medium text-emerald-400">NU Students Only</span>
                                </div>
                                
                                <h2 className="text-xl font-semibold text-white mb-2">
                                    Sign In to Continue!
                                </h2>
                                
                                <p className="text-gray-400 mb-6 text-sm">
                                    Please use your <span className="text-emerald-400 font-medium">@nu.edu.pk</span> email to sign in
                                </p>
                                
                                {error && (
                                    <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
                                        <AlertTriangle size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
                                        <p className="text-red-400 text-sm">{error}</p>
                                    </div>
                                )}
                                
                                {redirectTo && (
                                    <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                                        <p className="text-emerald-400 text-sm">
                                            You need to sign in to access this page. You'll be redirected after signing in.
                                        </p>
                                    </div>
                                )}
                                
                                <button 
                                    onClick={handleGoogleSignIn}
                                    disabled={loading}
                                    className="relative overflow-hidden group flex items-center justify-between bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-4 px-6 rounded-xl font-medium transition-all disabled:opacity-70 shadow-md hover:shadow-emerald-500/30"
                                >
                                    <div className="absolute inset-0 bg-white/10 scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                                    <div className="flex items-center gap-3 relative z-10">
                                        <div className="bg-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
                                            <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                                                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                                                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                                                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                                                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                                            </svg>
                                        </div>
                                        <span className="text-white">
                                            {loading ? 'Signing in...' : 'Continue with Google'}
                                        </span>
                                    </div>
                                    <ChevronRight size={18} className="relative z-10" />
                                </button>
                                
                                <div className="mt-8 pt-6 border-t border-gray-800 flex justify-between">
                                    <span className="text-gray-500 text-sm">Need help?</span>
                                    <span className="text-emerald-500 hover:text-emerald-400 text-sm cursor-pointer">Contact support</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SignInScreen;