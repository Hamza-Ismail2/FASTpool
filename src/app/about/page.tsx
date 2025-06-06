import { Car, Users, Globe, ShieldCheck, MapPin, Award } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-900 pt-20">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* About Section */}
        <div className="mb-16">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-8 text-center">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
              About FASTpool
            </span>
          </h1>
          
          <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Our Mission</h2>
                <p className="text-gray-300 mb-6">
                  FASTpool was created to solve the transportation challenges faced by students and faculty at FAST University. We aim to reduce traffic congestion, cut transportation costs, and decrease carbon emissions by connecting people traveling in the same direction.
                </p>
                <p className="text-gray-300">
                  By fostering a community of shared rides, we're not just creating a more efficient transportation system—we're building a more connected campus community.
                </p>
              </div>
              
              <div className="flex items-center justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-md opacity-50"></div>
                  <div className="relative bg-gray-900 w-48 h-48 rounded-full flex items-center justify-center border border-emerald-500/30">
                    <Car size={80} className="text-emerald-400" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Our Values */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Our Values</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-800/70 rounded-2xl p-6 border border-gray-700 shadow-xl hover:shadow-emerald-500/5 hover:border-emerald-500/30 hover:-translate-y-1 transition-all">
              <div className="bg-emerald-500/10 border border-emerald-500/20 w-14 h-14 rounded-full flex items-center justify-center mb-6">
                <Globe className="text-emerald-400" size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Sustainability</h3>
              <p className="text-gray-400">
                We're committed to reducing our community's carbon footprint by making carpooling easy, accessible, and rewarding.
              </p>
            </div>
            
            <div className="bg-gray-800/70 rounded-2xl p-6 border border-gray-700 shadow-xl hover:shadow-teal-500/5 hover:border-teal-500/30 hover:-translate-y-1 transition-all">
              <div className="bg-teal-500/10 border border-teal-500/20 w-14 h-14 rounded-full flex items-center justify-center mb-6">
                <Users className="text-teal-400" size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Community</h3>
              <p className="text-gray-400">
                More than just rides, we're building a community of trust, collaboration, and shared experiences among FAST students.
              </p>
            </div>
            
            <div className="bg-gray-800/70 rounded-2xl p-6 border border-gray-700 shadow-xl hover:shadow-cyan-500/5 hover:border-cyan-500/30 hover:-translate-y-1 transition-all">
              <div className="bg-cyan-500/10 border border-cyan-500/20 w-14 h-14 rounded-full flex items-center justify-center mb-6">
                <ShieldCheck className="text-cyan-400" size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Safety</h3>
              <p className="text-gray-400">
                Student safety is our top priority. We maintain a secure system with verified university accounts only.
              </p>
            </div>
          </div>
        </div>
        
        {/* How It Works */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-white mb-8 text-center">How It Works</h2>
          
          <div className="bg-gray-800/50 rounded-2xl p-8 border border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-sm opacity-70"></div>
                  <div className="relative w-14 h-14 rounded-full bg-gray-900 border border-emerald-500/30 flex items-center justify-center">
                    <span className="text-emerald-400 font-bold text-xl">1</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Sign Up</h3>
                <p className="text-gray-400">
                  Create an account using your NU email and complete your profile.
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-sm opacity-70"></div>
                  <div className="relative w-14 h-14 rounded-full bg-gray-900 border border-emerald-500/30 flex items-center justify-center">
                    <span className="text-emerald-400 font-bold text-xl">2</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Find or Offer</h3>
                <p className="text-gray-400">
                  Search for available rides or offer your own by setting your route and time.
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-sm opacity-70"></div>
                  <div className="relative w-14 h-14 rounded-full bg-gray-900 border border-emerald-500/30 flex items-center justify-center">
                    <span className="text-emerald-400 font-bold text-xl">3</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Ride Together</h3>
                <p className="text-gray-400">
                  Connect with riders, share the journey, and split the costs.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Team */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Our Team</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-800/70 rounded-2xl p-6 border border-gray-700 shadow-xl hover:shadow-emerald-500/5 hover:border-emerald-500/30 hover:-translate-y-1 transition-all text-center">
              <div className="relative mb-6 mx-auto">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-sm opacity-70"></div>
                <img 
                  src="https://i.pravatar.cc/150?img=1" 
                  alt="Team Member" 
                  className="relative w-24 h-24 rounded-full object-cover border-2 border-gray-800 mx-auto"
                />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Ahmed Khan</h3>
              <p className="text-emerald-400 font-medium mb-3">Founder & Lead Developer</p>
              <p className="text-gray-400 text-sm">
                Computer Science student with a passion for sustainable transportation solutions.
              </p>
            </div>
            
            <div className="bg-gray-800/70 rounded-2xl p-6 border border-gray-700 shadow-xl hover:shadow-emerald-500/5 hover:border-emerald-500/30 hover:-translate-y-1 transition-all text-center">
              <div className="relative mb-6 mx-auto">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-sm opacity-70"></div>
                <img 
                  src="https://i.pravatar.cc/150?img=5" 
                  alt="Team Member" 
                  className="relative w-24 h-24 rounded-full object-cover border-2 border-gray-800 mx-auto"
                />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Fatima Ali</h3>
              <p className="text-emerald-400 font-medium mb-3">UX Designer</p>
              <p className="text-gray-400 text-sm">
                Creating intuitive user experiences that make ridesharing simple and enjoyable.
              </p>
            </div>
            
            <div className="bg-gray-800/70 rounded-2xl p-6 border border-gray-700 shadow-xl hover:shadow-emerald-500/5 hover:border-emerald-500/30 hover:-translate-y-1 transition-all text-center">
              <div className="relative mb-6 mx-auto">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-sm opacity-70"></div>
                <img 
                  src="https://i.pravatar.cc/150?img=12" 
                  alt="Team Member" 
                  className="relative w-24 h-24 rounded-full object-cover border-2 border-gray-800 mx-auto"
                />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Hassan Raza</h3>
              <p className="text-emerald-400 font-medium mb-3">Business Development</p>
              <p className="text-gray-400 text-sm">
                Working on partnerships and growth strategies to expand our ridesharing community.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="py-8 px-6 bg-gray-950 border-t border-gray-800 mt-16">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-gray-400 mb-4">
            Have questions or feedback? <span className="text-emerald-400 cursor-pointer hover:underline">Contact us</span>
          </p>
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} FASTpool. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
} 