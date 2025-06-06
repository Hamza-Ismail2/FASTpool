"use client";

import Link from "next/link";
import { ArrowRight, Car, DollarSign, MapPin, CalendarClock } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden pt-28 pb-24 px-6">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-400 opacity-10"></div>
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-block px-3 py-1 mb-6 rounded-full bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 backdrop-blur-md border border-emerald-500/30">
            <span className="text-sm font-medium text-emerald-400">Sustainable Ridesharing</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
              Smarter Commutes with FASTpool
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto">
            Share rides, save money, and reduce your carbon footprint with our modern ridesharing platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/auth" 
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-medium py-3 px-8 rounded-full shadow-lg hover:shadow-emerald-500/30 transition-all flex items-center justify-center gap-2"
            >
              Get Started <ArrowRight size={18} />
            </Link>
            <button className="backdrop-blur-md bg-white/5 text-white border border-white/10 font-medium py-3 px-8 rounded-full hover:bg-white/10 transition-all">
              Learn More
            </button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 px-6 bg-gray-950 relative">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-5"></div>
        
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-16">
            Why Choose <span className="text-emerald-400">FASTpool</span>?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-gray-800/70 rounded-2xl p-8 border border-gray-700 shadow-xl hover:shadow-emerald-500/5 hover:border-emerald-500/30 hover:-translate-y-1 transition-all">
              <div className="bg-emerald-500/10 border border-emerald-500/20 w-14 h-14 rounded-full flex items-center justify-center mb-6">
                <MapPin className="text-emerald-400" size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Find Nearby Rides</h3>
              <p className="text-gray-400">
                Easily find and connect with drivers heading your way, all in real-time with location-based matching.
              </p>
            </div>
            
            {/* Feature 2 */}
            <div className="bg-gray-800/70 rounded-2xl p-8 border border-gray-700 shadow-xl hover:shadow-teal-500/5 hover:border-teal-500/30 hover:-translate-y-1 transition-all">
              <div className="bg-teal-500/10 border border-teal-500/20 w-14 h-14 rounded-full flex items-center justify-center mb-6">
                <DollarSign className="text-teal-400" size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Save on Costs</h3>
              <p className="text-gray-400">
                Split travel expenses with others going your way. Save on gas, parking, and vehicle maintenance.
              </p>
            </div>
            
            {/* Feature 3 */}
            <div className="bg-gray-800/70 rounded-2xl p-8 border border-gray-700 shadow-xl hover:shadow-cyan-500/5 hover:border-cyan-500/30 hover:-translate-y-1 transition-all">
              <div className="bg-cyan-500/10 border border-cyan-500/20 w-14 h-14 rounded-full flex items-center justify-center mb-6">
                <CalendarClock className="text-cyan-400" size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Flexible Schedules</h3>
              <p className="text-gray-400">
                Create recurring rides or one-time trips. Our smart matching system finds the perfect ride partners.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats and Highlights */}
      <div className="py-16 px-6 bg-gray-900 border-y border-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">500+</div>
              <p className="text-gray-400">Active Drivers</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">2K+</div>
              <p className="text-gray-400">Rides Shared</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">50K</div>
              <p className="text-gray-400">CO₂ Saved (kg)</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">4.9</div>
              <p className="text-gray-400">User Rating</p>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="py-20 px-6 bg-gray-900 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-900/80 to-emerald-950/20"></div>
        
        <div className="max-w-4xl mx-auto bg-gray-800 rounded-2xl p-10 border border-gray-700 shadow-2xl relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-white mb-4">
                Ready to Start Sharing Rides?
              </h2>
              <p className="text-gray-300 mb-6">
                Join thousands of users already saving time and money with FASTpool. Sign up today and get your first ride matched!
              </p>
              <Link 
                href="/auth" 
                className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-medium py-3 px-8 rounded-full shadow-lg hover:shadow-emerald-500/30 transition-all"
              >
                Sign Up Now <ArrowRight size={18} />
              </Link>
            </div>
            <div className="flex-1 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-md opacity-50"></div>
                <div className="relative bg-gray-900 w-28 h-28 rounded-full flex items-center justify-center border border-emerald-500/30">
                  <Car size={48} className="text-emerald-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-8 px-6 bg-gray-950 border-t border-gray-800">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex justify-center space-x-6 mb-4">
            <span className="text-emerald-500 hover:text-emerald-400 cursor-pointer">Twitter</span>
            <span className="text-emerald-500 hover:text-emerald-400 cursor-pointer">Facebook</span>
            <span className="text-emerald-500 hover:text-emerald-400 cursor-pointer">Instagram</span>
            <span className="text-emerald-500 hover:text-emerald-400 cursor-pointer">Contact</span>
          </div>
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} FASTpool. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}