export const dynamic = "force-dynamic";

"use client";

import { useState, useEffect } from "react";
import { auth } from "@/firebase/clientApp";
import { User } from "firebase/auth";
import { User as LucideUser, Car, MapPin, Bell, Mail, Calendar, Settings, Edit, Save, X, Phone, Info, UserCheck, PencilLine } from "lucide-react";
import { getUserProfile, updateUserProfile, UserProfile } from "@/firebase/models/user";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    displayName: "",
    gender: "",
    phone: "",
    address: "",
    preferredPickupPoints: "",
    bio: ""
  });

  // User profile data from Firestore
  const [profileData, setProfileData] = useState<UserProfile | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setFormData({
          ...formData,
          displayName: currentUser.displayName || "",
        });
        
        // Fetch user profile from Firestore
        setProfileLoading(true);
        try {
          const profile = await getUserProfile(currentUser.uid);
          if (profile) {
            setProfileData(profile);
            setFormData({
              displayName: profile.displayName || currentUser.displayName || "",
              gender: profile.gender || "",
              phone: profile.phone || "",
              address: profile.address || "",
              preferredPickupPoints: profile.preferredPickupPoints || "",
              bio: profile.bio || ""
            });
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        } finally {
          setProfileLoading(false);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const saveProfile = async () => {
    if (!user) return;
    
    setSaveLoading(true);
    try {
      // Update Firestore profile
      await updateUserProfile(user.uid, {
        gender: formData.gender,
        phone: formData.phone,
        address: formData.address,
        preferredPickupPoints: formData.preferredPickupPoints,
        bio: formData.bio
      });
      
      // Update local state
      setProfileData(prev => 
        prev ? {
          ...prev,
          gender: formData.gender,
          phone: formData.phone,
          address: formData.address,
          preferredPickupPoints: formData.preferredPickupPoints,
          bio: formData.bio
        } : null
      );
      
      // Exit edit mode
      setEditMode(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setSaveLoading(false);
    }
  };

  const cancelEdit = () => {
    if (profileData) {
      setFormData({
        displayName: user?.displayName || "",
        gender: profileData.gender || "",
        phone: profileData.phone || "",
        address: profileData.address || "",
        preferredPickupPoints: profileData.preferredPickupPoints || "",
        bio: profileData.bio || ""
      });
    }
    setEditMode(false);
  };

  // Helper function to get gender display text
  const getGenderDisplay = (gender: string): string => {
    switch(gender) {
      case 'male': return 'Male';
      case 'female': return 'Female';
      case 'other': return 'Other';
      default: return 'Not specified';
    }
  };

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-gray-900 pt-20 flex items-center justify-center">
        <div className="animate-pulse text-emerald-400 text-xl">Loading profile...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 pt-20 flex items-center justify-center">
        <div className="text-red-400 text-xl">You need to be signed in to view this page.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 pt-20">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Left side - User info */}
          <div className="md:w-1/3">
            <div className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700 shadow-xl">
              <div className="p-6 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-b border-gray-700 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">Profile</h2>
                {!editMode ? (
                  <button 
                    onClick={() => setEditMode(true)}
                    className="text-emerald-400 hover:text-emerald-300 p-1 rounded-full hover:bg-gray-700 transition-colors"
                  >
                    <Edit size={18} />
                  </button>
                ) : (
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={saveProfile}
                      disabled={saveLoading}
                      className="text-emerald-400 hover:text-emerald-300 p-1 rounded-full hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                      <Save size={18} />
                    </button>
                    <button 
                      onClick={cancelEdit}
                      disabled={saveLoading}
                      className="text-red-400 hover:text-red-300 p-1 rounded-full hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="p-6 flex flex-col items-center">
                <div className="relative mb-6 group">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-sm group-hover:blur-md transition-all opacity-80"></div>
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || "User"} 
                      className="relative w-24 h-24 rounded-full object-cover border-4 border-gray-800"
                    />
                  ) : (
                    <div className="relative w-24 h-24 rounded-full flex items-center justify-center bg-gray-700 border-4 border-gray-800">
                      <LucideUser size={40} className="text-emerald-400" />
                    </div>
                  )}
                </div>
                
                <h2 className="text-xl font-semibold text-white mb-1">
                  {user.displayName}
                </h2>
                <div className="text-emerald-400 text-sm mb-2 flex items-center gap-1">
                  <Mail size={14} />
                  <span>{user.email}</span>
                </div>
                
                {/* Gender Badge - Always visible */}
                <div className={`text-sm px-3 py-1 rounded-full mb-4 flex items-center gap-1 ${formData.gender ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-gray-700 text-gray-400 border border-gray-600'}`}>
                  <UserCheck size={14} />
                  <span>{getGenderDisplay(formData.gender)}</span>
                </div>
                
                {editMode ? (
                  <div className="w-full space-y-4 mb-4">
                    <div>
                      <label className="block text-gray-400 text-sm font-medium mb-1">Gender</label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 px-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                      >
                        <option value="">Prefer not to say</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                      <p className="mt-1 text-xs text-gray-400">
                        Setting your gender helps with gender-specific rides
                      </p>
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm font-medium mb-1">Phone</label>
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 px-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                        placeholder="Enter your phone number"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm font-medium mb-1">Address</label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 px-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                        placeholder="Enter your address"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm font-medium mb-1">Preferred Pickup Points</label>
                      <input
                        type="text"
                        name="preferredPickupPoints"
                        value={formData.preferredPickupPoints}
                        onChange={handleInputChange}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 px-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                        placeholder="e.g. Main Gate, CS Block, Cafeteria"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm font-medium mb-1">Bio</label>
                      <textarea
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full bg-gray-900 border border-gray-700 rounded-lg py-2 px-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                        placeholder="Tell others about yourself"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="w-full space-y-4 mb-4">
                    <div className="flex items-start gap-3">
                      <Phone className="text-emerald-400 flex-shrink-0 mt-0.5" size={16} />
                      <div>
                        <div className="text-gray-400 text-xs">Phone</div>
                        <div className="text-white text-sm">{profileData?.phone || "Not specified"}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <MapPin className="text-emerald-400 flex-shrink-0 mt-0.5" size={16} />
                      <div>
                        <div className="text-gray-400 text-xs">Address</div>
                        <div className="text-white text-sm">{profileData?.address || "Not specified"}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <Car className="text-emerald-400 flex-shrink-0 mt-0.5" size={16} />
                      <div>
                        <div className="text-gray-400 text-xs">Preferred Pickup Points</div>
                        <div className="text-white text-sm">{profileData?.preferredPickupPoints || "Not specified"}</div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="w-full border-t border-gray-700 pt-4 mt-2">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-medium text-sm">About Me</h3>
                    {!editMode && (
                      <button 
                        onClick={() => setEditMode(true)}
                        className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                      >
                        <PencilLine size={12} />
                        Edit
                      </button>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm">
                    {profileData?.bio || "No bio provided yet."}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right side - Stats and activity */}
          <div className="md:w-2/3">
            {/* Stats section */}
            <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 mb-6">
              <h2 className="text-xl font-bold text-white mb-6">Statistics</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-900/70 rounded-xl p-4 border border-gray-700 hover:border-emerald-500/20 transition-all">
                  <div className="text-emerald-400 font-bold text-2xl">{profileData?.ridesOffered || 0}</div>
                  <div className="text-gray-400 text-sm">Rides Offered</div>
                </div>
                <div className="bg-gray-900/70 rounded-xl p-4 border border-gray-700 hover:border-emerald-500/20 transition-all">
                  <div className="text-emerald-400 font-bold text-2xl">{profileData?.ridesJoined || 0}</div>
                  <div className="text-gray-400 text-sm">Rides Joined</div>
                </div>
                <div className="bg-gray-900/70 rounded-xl p-4 border border-gray-700 hover:border-emerald-500/20 transition-all">
                  <div className="text-emerald-400 font-bold text-2xl">₨{profileData?.totalSavings || 0}</div>
                  <div className="text-gray-400 text-sm">Money Saved</div>
                </div>
                <div className="bg-gray-900/70 rounded-xl p-4 border border-gray-700 hover:border-emerald-500/20 transition-all">
                  <div className="text-emerald-400 font-bold text-2xl">{profileData?.co2Saved || 0}kg</div>
                  <div className="text-gray-400 text-sm">CO₂ Reduced</div>
                </div>
              </div>
            </div>
            
            {/* Settings section */}
            <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6">
              <h2 className="text-xl font-bold text-white mb-6">Account Settings</h2>
              
              <div className="space-y-4">
                <div className="p-4 bg-gray-900/70 rounded-xl border border-gray-700 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Bell className="text-emerald-400" size={20} />
                    <div>
                      <div className="text-white font-medium">Notifications</div>
                      <div className="text-gray-400 text-sm">Get notified about ride updates and messages</div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
                
                <div className="p-4 bg-gray-900/70 rounded-xl border border-gray-700 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Calendar className="text-emerald-400" size={20} />
                    <div>
                      <div className="text-white font-medium">Calendar Integration</div>
                      <div className="text-gray-400 text-sm">Add rides to your calendar automatically</div>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
                
                <div className="p-4 bg-gray-900/70 rounded-xl border border-gray-700 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Settings className="text-emerald-400" size={20} />
                    <div>
                      <div className="text-white font-medium">Privacy Settings</div>
                      <div className="text-gray-400 text-sm">Control who can see your profile and rides</div>
                    </div>
                  </div>
                  <button className="bg-gray-700 hover:bg-gray-600 text-white text-sm py-2 px-4 rounded-lg transition-colors">
                    Manage
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 