"use client";

import { Car, MapPin, Search, UserCheck, Calendar, Clock, Filter } from "lucide-react";
import { useState, useEffect } from "react";
import { auth } from "@/firebase/clientApp";
import { getUserProfile } from "@/firebase/models/user";
import { getUpcomingRides, Ride, GenderPreference, getRideById } from "@/firebase/models/ride";
import { useRouter } from "next/navigation";
import NominatimSearchInput from "@/components/NominatimSearchInput";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import dynamic from "next/dynamic";
import type { LocationPoint } from "@/components/UserLocationMap";
import { createBooking } from "@/firebase/models/booking";

const UserLocationMap = dynamic(() => import("@/components/UserLocationMap"), { ssr: false });

export default function RidesPage() {
  const router = useRouter();
  const [pickupLocation, setPickupLocation] = useState<LocationPoint | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<LocationPoint | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);
  const [userGender, setUserGender] = useState<string>("");
  
  // Added gender filter
  const [genderFilter, setGenderFilter] = useState<GenderPreference | "">("");
  
  // State for loading and rides
  const [loading, setLoading] = useState(true);
  const [availableRides, setAvailableRides] = useState<Ride[]>([]);
  const [filteredRides, setFilteredRides] = useState<Ride[]>([]);
  const [expandedRideId, setExpandedRideId] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState<string | null>(null); // rideId if booking

  // Fetch user profile and rides
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch upcoming rides
        let rides = await getUpcomingRides(20);

        // Filter out rides that are for today but time has already passed
        const now = new Date();
        rides = rides.filter(ride => {
          const rideDate = new Date(ride.date instanceof Date ? ride.date : ride.date.toDate());
          rideDate.setHours(0, 0, 0, 0);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (rideDate.getTime() > today.getTime()) {
            return true; // future date
          } else if (rideDate.getTime() === today.getTime()) {
            // Check time
            if (!ride.time) return true; // if no time, show it
            // Parse ride.time (assume format 'HH:mm' or 'H:mm')
            const [hours, minutes] = ride.time.split(":").map(Number);
            const rideDateTime = new Date();
            rideDateTime.setHours(hours, minutes, 0, 0);
            return rideDateTime.getTime() > now.getTime();
          }
          return false; // past date
        });

        // Fetch user profile to get gender
        const user = auth.currentUser;
        if (user) {
          const profile = await getUserProfile(user.uid);
          if (profile) {
            setUserGender(profile.gender || "");
          }
        }

        setAvailableRides(rides);
        setFilteredRides(rides);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Apply filters
  const applyFilters = () => {
    let filtered = [...availableRides];
    
    // Filter by pickup location
    if (pickupLocation) {
      filtered = filtered.filter(ride => 
        ride.pickup.toLowerCase().includes(pickupLocation.display_name.toLowerCase())
      );
    }
    
    // Filter by destination
    if (destinationLocation) {
      filtered = filtered.filter(ride => 
        ride.destination.toLowerCase().includes(destinationLocation.display_name.toLowerCase())
      );
    }
    
    // Filter by date
    if (selectedDate) {
      const selectedDateObj = new Date(selectedDate);
      selectedDateObj.setHours(0, 0, 0, 0);
      
      filtered = filtered.filter(ride => {
        const rideDate = new Date(ride.date instanceof Date ? ride.date : ride.date.toDate());
        rideDate.setHours(0, 0, 0, 0);
        return rideDate.getTime() === selectedDateObj.getTime();
      });
    }
    
    // Filter by gender preference
    if (genderFilter) {
      filtered = filtered.filter(ride => {
        if (genderFilter === "all") {
          return true;
        }
        
        // If user selected female_only/male_only filter, 
        // only show rides that match or are open to all
        if (ride.genderPreference === "all") {
          return true;
        }
        
        return ride.genderPreference === genderFilter;
      });
    }
    
    setFilteredRides(filtered);
  };
  
  // Helper to display gender preference label
  const getGenderPreferenceLabel = (preference: string) => {
    switch (preference) {
      case 'female_only':
        return 'Female passengers only';
      case 'male_only':
        return 'Male passengers only';
      default:
        return 'Open to all';
    }
  };
  
  // Format date for display
  const formatDate = (dateValue: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric'
    };
    return dateValue.toLocaleDateString('en-US', options);
  };

  // Book a ride
  const handleBookRide = async (ride: Ride) => {
    if (!auth.currentUser) {
      alert("You must be signed in to book a ride.");
      return;
    }
    setBookingLoading(ride.id!);
    try {
      // Get latest ride data to avoid stale seat info
      const latestRide = await getRideById(ride.id!);
      if (!latestRide) {
        alert("This ride is no longer available.");
        setBookingLoading(null);
        return;
      }
      if (latestRide.availableSeats < 1) {
        alert("No seats available for this ride.");
        setBookingLoading(null);
        return;
      }
      // Prepare booking data
      const booking = {
        rideId: ride.id!,
        userId: auth.currentUser.uid,
        driverId: ride.driverId,
        seats: 1,
        totalPrice: ride.price,
      };
      const bookingId = await createBooking(booking, latestRide);
      if (bookingId) {
        alert("Booking successful! You can view your booking in My Rides.");
        // Optionally, update UI or redirect
        // Optionally, decrement availableSeats in UI
        setAvailableRides(prev => prev.map(r => r.id === ride.id ? { ...r, availableSeats: r.availableSeats - 1 } : r));
        setFilteredRides(prev => prev.map(r => r.id === ride.id ? { ...r, availableSeats: r.availableSeats - 1 } : r));
      } else {
        alert("Booking failed. Please try again.");
      }
    } catch (error: any) {
      alert(error.message || "Booking failed. Please try again.");
    } finally {
      setBookingLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 pt-20">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
            Find Available Rides
          </span>
        </h1>

        {/* Search Form */}
        <div className="bg-gray-800 rounded-xl p-6 mb-10 border border-gray-700 shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <NominatimSearchInput
              label="Pickup Location"
              placeholder="Enter pickup location"
              onSelect={setPickupLocation}
            />
            <NominatimSearchInput
              label="Destination"
              placeholder="Enter destination"
              onSelect={setDestinationLocation}
            />
            <div>
              <label className="block text-gray-400 text-sm font-medium mb-2">Date</label>
              <div className="pl-0 md:pl-10">
                <DayPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  fromDate={new Date()}
                  className="bg-gray-900 rounded-lg shadow-lg border border-gray-700 p-2 text-white"
                  styles={{
                    caption: { color: '#34d399' },
                    day_selected: { backgroundColor: '#10b981', color: '#fff' },
                    day_today: { borderColor: '#34d399' },
                    day: { borderRadius: '0.5rem' },
                  }}
                />
              </div>
            </div>
          </div>
          
          {/* Advanced Filters */}
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="text-emerald-400 hover:text-emerald-300 text-sm font-medium flex items-center gap-1 mt-4"
          >
            <Filter size={16} />
            {showFilters ? "Hide Filters" : "Show Additional Filters"}
          </button>
          
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">Gender Preference</label>
                <select
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value as GenderPreference | "")}
                  className="block w-full md:w-64 bg-gray-900 border border-gray-700 rounded-lg py-2 px-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                >
                  <option value="">All rides</option>
                  <option value="all">Open to all genders</option>
                  {userGender === 'female' && (
                    <option value="female_only">Female passengers only</option>
                  )}
                  {userGender === 'male' && (
                    <option value="male_only">Male passengers only</option>
                  )}
                </select>
                {!userGender && (
                  <p className="mt-2 text-xs text-gray-400">Set your gender in your profile to see gender-specific rides</p>
                )}
              </div>
            </div>
          )}
          
          <button 
            onClick={applyFilters}
            className="mt-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-medium py-3 px-6 rounded-lg shadow-lg hover:shadow-emerald-500/30 transition-all flex items-center gap-2"
          >
            <Search size={18} />
            Search Rides
          </button>
        </div>

        {/* Available Rides */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Available Rides</h2>
          {!loading && (
            <div className="text-gray-400 text-sm">
              {filteredRides.length} {filteredRides.length === 1 ? 'ride' : 'rides'} found
            </div>
          )}
        </div>
        
        {/* Loading state */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-pulse text-emerald-400 text-lg">Loading rides...</div>
          </div>
        ) : filteredRides.length === 0 ? (
          <div className="bg-gray-800 rounded-xl p-10 border border-gray-700 text-center">
            <Car size={48} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No rides found</h3>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              Try adjusting your search criteria or check back later for new ride offers.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredRides.map((ride) => {
              const isExpanded = expandedRideId === ride.id;
              return (
                <div
                  key={ride.id}
                  className={`bg-gray-800/70 rounded-xl p-6 border border-gray-700 hover:border-emerald-500/30 transition-all shadow-md hover:shadow-emerald-500/5 cursor-pointer ${isExpanded ? 'ring-2 ring-emerald-400' : ''}`}
                  onClick={() => setExpandedRideId(isExpanded ? null : ride.id ?? null)}
                >
                  <div className="flex flex-col md:flex-row items-center gap-6 w-full">
                    {/* Driver Info */}
                    <div className="flex items-center gap-4 min-w-[160px]">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-sm opacity-70"></div>
                        <img
                          src={ride.driver?.avatar || "https://i.pravatar.cc/150?img=1"}
                          alt={ride.driver?.name || "Driver"}
                          className="relative w-16 h-16 rounded-full object-cover border-2 border-gray-800"
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-white">{ride.driver?.name || "Driver"}</h3>
                        <div className="text-sm text-gray-400">4.9 ★</div>
                      </div>
                    </div>
                    {/* Pickup & Destination */}
                    <div className="flex-1 flex flex-col md:flex-row gap-6 w-full">
                      <div>
                        <div className="text-xs text-gray-500 uppercase mb-1">Pickup</div>
                        <div className="text-sm text-white font-medium">{ride.pickup}</div>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Calendar size={12} />
                          {formatDate(ride.date instanceof Date ? ride.date : ride.date.toDate())}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock size={12} />
                          {ride.time}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase mb-1">Destination</div>
                        <div className="text-sm text-white font-medium">{ride.destination}</div>
                        <div className="text-xs text-emerald-400">{ride.availableSeats} seats available</div>
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                          <UserCheck size={12} />
                          {getGenderPreferenceLabel(ride.genderPreference || 'all')}
                        </div>
                      </div>
                    </div>
                    {/* Price & Book */}
                    <div className="flex flex-col items-end min-w-[120px]">
                      <div className="text-xs text-gray-500 uppercase mb-1">Price</div>
                      <div className="text-xl text-white font-bold">
                        <span className="text-emerald-400">Rs.{ride.price}</span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const userCanBook = ride.genderPreference === 'all' ||
                            (ride.genderPreference === 'female_only' && userGender === 'female') ||
                            (ride.genderPreference === 'male_only' && userGender === 'male');
                          if (!userCanBook) {
                            alert("This ride is only available for " + (ride.genderPreference === 'female_only' ? 'female' : 'male') + " passengers.");
                            return;
                          }
                          handleBookRide(ride);
                        }}
                        disabled={bookingLoading === ride.id}
                        className="mt-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-medium py-2 px-4 rounded-lg border border-emerald-500/30 transition-all disabled:opacity-50"
                      >
                        {bookingLoading === ride.id ? 'Booking...' : 'Book Seat'}
                      </button>
                    </div>
                  </div>
                  {/* Expanded: Show map and route */}
                  {isExpanded && (
                    <div className="mt-6">
                      <UserLocationMap
                        pickup={{ display_name: ride.pickup, lat: ride.pickupLat, lng: ride.pickupLng }}
                        destination={{ display_name: ride.destination, lat: ride.destinationLat, lng: ride.destinationLng }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 