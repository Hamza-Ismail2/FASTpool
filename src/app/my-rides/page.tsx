export const dynamic = "force-dynamic";

"use client";

import { useState, useEffect } from "react";
import { auth } from "@/firebase/clientApp";
import { User } from "firebase/auth";
import { Car, MapPin, Calendar, Clock, Users, DollarSign, CheckCircle, XCircle, MessageCircle, Loader2, UserCheck } from "lucide-react";
import Link from "next/link";
import { Ride, getRidesByDriver, cancelRide, getRideById } from "@/firebase/models/ride";
import { Booking, getBookingsByUser, cancelBooking, getBookingsByRide } from "@/firebase/models/booking";
import { getUserProfile } from "@/firebase/models/user";
import { Timestamp } from "firebase/firestore";

// Enhanced Ride type with Firestore data and driver info
interface EnhancedRide extends Ride {
  driver: {
    id: string;
    name: string;
    avatar: string;
    email?: string;
    phone?: string;
  };
}

// Enhanced Booking type with ride details
interface EnhancedBooking extends Booking {
  ride?: EnhancedRide;
}

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

export default function MyRidesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingRides, setLoadingRides] = useState(false);
  const [activeTab, setActiveTab] = useState<'booked' | 'offered'>('booked');
  
  // Store Firestore data
  const [bookedRides, setBookedRides] = useState<EnhancedBooking[]>([]);
  const [offeredRides, setOfferedRides] = useState<Ride[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [showPassengersModal, setShowPassengersModal] = useState(false);
  const [passengerList, setPassengerList] = useState<any[]>([]);
  const [passengerLoading, setPassengerLoading] = useState(false);
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      if (currentUser) {
        fetchUserRidesData(currentUser.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchUserRidesData = async (userId: string) => {
    setLoadingRides(true);
    try {
      // Fetch rides offered by this user
      const driverRides = await getRidesByDriver(userId);
      setOfferedRides(driverRides);
      
      // Fetch bookings made by this user
      const userBookings = await getBookingsByUser(userId);
      
      // For each booking, fetch the associated ride details
      const enhancedBookings: EnhancedBooking[] = [];
      
      for (const booking of userBookings) {
        try {
          // Fetch the ride details for this booking
          const rideDetails = await getRideById(booking.rideId);
          if (rideDetails) {
            // Get the driver profile
            const driverProfile = await getUserProfile(booking.driverId);
            enhancedBookings.push({
              ...booking,
              ride: {
                ...rideDetails,
                driver: {
                  id: booking.driverId,
                  name: driverProfile?.displayName || 'Unknown Driver',
                  avatar: driverProfile?.photoURL || `https://i.pravatar.cc/150?u=${booking.driverId}`,
                  email: driverProfile?.email,
                  phone: driverProfile?.phone
                }
              }
            });
          }
        } catch (error) {
          console.error('Error enriching booking data:', error);
        }
      }
      
      setBookedRides(enhancedBookings);
    } catch (error) {
      console.error('Error fetching user rides data:', error);
    } finally {
      setLoadingRides(false);
    }
  };

  // Helper function to format date
  const formatDate = (dateValue: Date | Timestamp) => {
    const date = dateValue instanceof Timestamp ? dateValue.toDate() : dateValue;
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  };

  // Cancel a booked ride
  const handleCancelBooking = async (booking: EnhancedBooking) => {
    if (!booking.id || !booking.rideId) return;
    
    if (confirm('Are you sure you want to cancel this ride?')) {
      setActionLoading(true);
      try {
        const success = await cancelBooking(booking.id, booking.rideId);
        
        if (success) {
          // Update local state
          setBookedRides(prev => 
            prev.map(b => 
              b.id === booking.id ? { ...b, status: 'cancelled' } : b
            )
          );
        }
      } catch (error) {
        console.error('Error cancelling booking:', error);
      } finally {
        setActionLoading(false);
      }
    }
  };

  // Cancel an offered ride
  const handleCancelOfferedRide = async (rideId: string) => {
    if (!rideId) return;
    
    if (confirm('Are you sure you want to cancel this ride? All passengers will be notified.')) {
      setActionLoading(true);
      try {
        await cancelRide(rideId);
        
        // Update local state
        setOfferedRides(prev => 
          prev.map(ride => 
            ride.id === rideId ? { ...ride, status: 'cancelled' } : ride
          )
        );
        
        // In a real app, you would also cancel all bookings for this ride
        // and notify the passengers
      } catch (error) {
        console.error('Error cancelling ride:', error);
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleViewPassengers = async (ride: Ride) => {
    setSelectedRide(ride);
    setShowPassengersModal(true);
    setPassengerLoading(true);
    try {
      const bookings = await getBookingsByRide(ride.id!);
      const passengers = await Promise.all(
        bookings
          .filter(b => b.status === "confirmed")
          .map(async (booking) => {
            const profile = await getUserProfile(booking.userId);
            return {
              ...booking,
              profile,
            };
          })
      );
      setPassengerList(passengers);
    } catch (err) {
      setPassengerList([]);
    } finally {
      setPassengerLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 pt-20 flex items-center justify-center">
        <div className="animate-pulse text-emerald-400 text-xl">Loading...</div>
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
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
            My Rides
          </span>
        </h1>
        
        {/* Tab navigation */}
        <div className="flex border-b border-gray-700 mb-8">
          <button
            className={`pb-4 px-6 font-medium text-lg transition-colors ${
              activeTab === 'booked' 
                ? 'text-emerald-400 border-b-2 border-emerald-400' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('booked')}
          >
            Rides I've Booked
          </button>
          <button
            className={`pb-4 px-6 font-medium text-lg transition-colors ${
              activeTab === 'offered' 
                ? 'text-emerald-400 border-b-2 border-emerald-400' 
                : 'text-gray-400 hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('offered')}
          >
            Rides I'm Offering
          </button>
        </div>

        {loadingRides && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-emerald-400">
              <Loader2 className="animate-spin" size={24} />
              <span>Loading rides data...</span>
            </div>
          </div>
        )}
        
        {!loadingRides && (
          <div>
            {/* Rides I've Booked */}
            {activeTab === 'booked' && (
              <div className="space-y-6">
                {bookedRides.length === 0 ? (
                  <div className="bg-gray-800 rounded-xl p-8 text-center border border-gray-700">
                    <Car className="mx-auto text-gray-600 mb-4" size={48} />
                    <h3 className="text-xl font-semibold text-white mb-2">No rides booked yet</h3>
                    <p className="text-gray-400 mb-6">
                      You haven't booked any rides yet. Find available rides and start your journey!
                    </p>
                    <Link 
                      href="/rides" 
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-medium py-3 px-6 rounded-lg shadow-lg hover:shadow-emerald-500/30 transition-all"
                    >
                      Find Rides
                    </Link>
                  </div>
                ) : (
                  <>
                    {/* Group rides by status */}
                    {['confirmed', 'completed', 'cancelled'].map((status) => {
                      const filteredBookings = bookedRides.filter(booking => booking.status === status);
                      if (filteredBookings.length === 0) return null;
                      
                      const statusLabel = status === 'confirmed' ? 'upcoming' : status;
                      
                      return (
                        <div key={status} className="mb-8">
                          <h3 className="text-xl font-semibold text-white mb-4 capitalize">
                            {statusLabel} Rides
                          </h3>
                          
                          <div className="space-y-4">
                            {filteredBookings.map((booking) => {
                              if (!booking.ride) return null;
                              const ride = booking.ride;
                              
                              return (
                                <div 
                                  key={booking.id} 
                                  className={`bg-gray-800/70 rounded-xl p-6 border transition-all ${
                                    status === 'confirmed' ? 'border-emerald-500/30' :
                                    status === 'completed' ? 'border-gray-700' :
                                    'border-red-500/30 opacity-70'
                                  }`}
                                >
                                  <div className="flex flex-col md:flex-row gap-6">
                                    {/* Driver info */}
                                    <div className="flex items-center gap-4">
                                      <div className="relative">
                                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur-sm opacity-70"></div>
                                        <img 
                                          src={ride.driver.avatar} 
                                          alt={ride.driver.name} 
                                          className="relative w-16 h-16 rounded-full object-cover border-2 border-gray-800"
                                        />
                                      </div>
                                      <div>
                                        <h3 className="text-lg font-medium text-white">{ride.driver.name}</h3>
                                        <div className="text-gray-400 text-sm">{ride.driver.email || ''}</div>
                                        <div className="text-emerald-400 text-xs">{ride.driver.phone ? `Phone: ${ride.driver.phone}` : ''}</div>
                                        {status === 'confirmed' && (
                                          <a
                                            href={`mailto:${ride.driver.email}`}
                                            className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors mt-1"
                                            title="Chat via Email"
                                          >
                                            <MessageCircle size={14} />
                                            <span>Chat</span>
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {/* Ride details */}
                                    <div className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-4">
                                      <div className="space-y-2">
                                        <div className="flex items-start gap-2">
                                          <MapPin className="text-emerald-400 flex-shrink-0 mt-0.5" size={16} />
                                          <div>
                                            <div className="text-gray-400 text-xs">Route</div>
                                            <div className="text-white text-sm">
                                              {ride.pickup} → {ride.destination}
                                            </div>
                                          </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                          <DollarSign className="text-emerald-400 flex-shrink-0 mt-0.5" size={16} />
                                          <div>
                                            <div className="text-gray-400 text-xs">Price</div>
                                            <div className="text-white text-sm">Rs. {booking.totalPrice}</div>
                                          </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                          <UserCheck className="text-emerald-400 flex-shrink-0 mt-0.5" size={16} />
                                          <div>
                                            <div className="text-gray-400 text-xs">Gender Preference</div>
                                            <div className="text-white text-sm">{getGenderPreferenceLabel(ride.genderPreference || 'all')}</div>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div className="space-y-2">
                                        <div className="flex items-start gap-2">
                                          <Calendar className="text-emerald-400 flex-shrink-0 mt-0.5" size={16} />
                                          <div>
                                            <div className="text-gray-400 text-xs">Date</div>
                                            <div className="text-white text-sm">{formatDate(ride.date)}</div>
                                          </div>
                                        </div>
                                        <div className="flex items-start gap-2">
                                          <Clock className="text-emerald-400 flex-shrink-0 mt-0.5" size={16} />
                                          <div>
                                            <div className="text-gray-400 text-xs">Time</div>
                                            <div className="text-white text-sm">{ride.time}</div>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {/* Action buttons */}
                                      <div className="flex items-center justify-end">
                                        {status === 'confirmed' && (
                                          <button 
                                            onClick={() => handleCancelBooking(booking)}
                                            disabled={actionLoading}
                                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium py-2 px-4 rounded-lg border border-red-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
                                          >
                                            {actionLoading && <Loader2 size={14} className="animate-spin" />}
                                            Cancel Booking
                                          </button>
                                        )}
                                        {status === 'completed' && (
                                          <div className="flex items-center gap-2 text-emerald-400">
                                            <CheckCircle size={18} />
                                            <span>Completed</span>
                                          </div>
                                        )}
                                        {status === 'cancelled' && (
                                          <div className="flex items-center gap-2 text-red-400">
                                            <XCircle size={18} />
                                            <span>Cancelled</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            )}
            
            {/* Rides I'm Offering */}
            {activeTab === 'offered' && (
              <div className="space-y-6">
                {offeredRides.length === 0 ? (
                  <div className="bg-gray-800 rounded-xl p-8 text-center border border-gray-700">
                    <Car className="mx-auto text-gray-600 mb-4" size={48} />
                    <h3 className="text-xl font-semibold text-white mb-2">No rides offered yet</h3>
                    <p className="text-gray-400 mb-6">
                      You haven't offered any rides yet. Start sharing your journey with others!
                    </p>
                    <Link 
                      href="/offer" 
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-medium py-3 px-6 rounded-lg shadow-lg hover:shadow-emerald-500/30 transition-all"
                    >
                      Offer a Ride
                    </Link>
                  </div>
                ) : (
                  <>
                    {/* Group rides by status */}
                    {['upcoming', 'completed', 'cancelled'].map((status) => {
                      const filteredRides = offeredRides.filter(ride => ride.status === status);
                      if (filteredRides.length === 0) return null;
                      
                      return (
                        <div key={status} className="mb-8">
                          <h3 className="text-xl font-semibold text-white mb-4 capitalize">
                            {status} Rides
                          </h3>
                          
                          <div className="space-y-4">
                            {filteredRides.map((ride) => {
                              if (!ride.id) return null;
                              
                              return (
                                <div 
                                  key={ride.id} 
                                  className={`bg-gray-800/70 rounded-xl p-6 border transition-all ${
                                    status === 'upcoming' ? 'border-emerald-500/30' :
                                    status === 'completed' ? 'border-gray-700' :
                                    'border-red-500/30 opacity-70'
                                  }`}
                                >
                                  <div className="flex flex-col gap-4">
                                    {/* Route and date info */}
                                    <div className="flex flex-col md:flex-row justify-between gap-4">
                                      <div className="flex items-center gap-3">
                                        <MapPin className="text-emerald-400" size={20} />
                                        <div>
                                          <div className="text-white font-medium">
                                            {ride.pickup} → {ride.destination}
                                          </div>
                                          <div className="text-gray-400 text-sm">
                                            {formatDate(ride.date)} at {ride.time}
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div className="flex gap-4 items-center">
                                        <div className="flex items-center gap-2">
                                          <Users className="text-emerald-400" size={18} />
                                          <span className="text-white">{ride.totalSeats - ride.availableSeats}/{ride.totalSeats} booked</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <DollarSign className="text-emerald-400" size={18} />
                                          <span className="text-white">Rs. {ride.price}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <UserCheck className="text-emerald-400" size={18} />
                                          <span className="text-white">{getGenderPreferenceLabel(ride.genderPreference || 'all')}</span>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Status and actions */}
                                    <div className="flex justify-between items-center">
                                      <div>
                                        {status === 'upcoming' && (
                                          <div className="inline-flex items-center gap-2 py-1 px-3 bg-emerald-500/10 text-emerald-400 text-sm rounded-full border border-emerald-500/20">
                                            <CheckCircle size={14} />
                                            <span>Active</span>
                                          </div>
                                        )}
                                        {status === 'completed' && (
                                          <div className="inline-flex items-center gap-2 py-1 px-3 bg-gray-700/50 text-gray-300 text-sm rounded-full border border-gray-600">
                                            <CheckCircle size={14} />
                                            <span>Completed</span>
                                          </div>
                                        )}
                                        {status === 'cancelled' && (
                                          <div className="inline-flex items-center gap-2 py-1 px-3 bg-red-500/10 text-red-400 text-sm rounded-full border border-red-500/20">
                                            <XCircle size={14} />
                                            <span>Cancelled</span>
                                          </div>
                                        )}
                                      </div>
                                      
                                      <div className="flex gap-3">
                                        {status === 'upcoming' && (
                                          <>
                                            <button
                                              className="bg-gray-700 hover:bg-gray-600 text-white text-sm py-2 px-4 rounded-lg transition-colors"
                                              onClick={() => handleViewPassengers(ride)}
                                            >
                                              View Passengers
                                            </button>
                                            <button 
                                              onClick={() => handleCancelOfferedRide(ride.id!)}
                                              disabled={actionLoading}
                                              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium py-2 px-4 rounded-lg border border-red-500/30 transition-all disabled:opacity-50 flex items-center gap-2"
                                            >
                                              {actionLoading && <Loader2 size={14} className="animate-spin" />}
                                              Cancel Ride
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
                
                {/* Offer a new ride button */}
                <div className="mt-8 flex justify-center">
                  <Link 
                    href="/offer" 
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-medium py-3 px-6 rounded-lg shadow-lg hover:shadow-emerald-500/30 transition-all"
                  >
                    <Car size={18} />
                    Offer a New Ride
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {showPassengersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-gray-900/80 to-gray-800/90 border border-emerald-700/30 rounded-2xl shadow-2xl p-8 max-w-lg w-full relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-emerald-400"
              onClick={() => setShowPassengersModal(false)}
            >
              ×
            </button>
            <h2 className="text-2xl font-bold text-white mb-4">
              Passengers for <span className="text-emerald-400">{selectedRide?.pickup} → {selectedRide?.destination}</span>
            </h2>
            {passengerLoading ? (
              <div className="flex items-center gap-2 text-emerald-400">
                <Loader2 className="animate-spin" size={24} />
                <span>Loading passengers...</span>
              </div>
            ) : passengerList.length === 0 ? (
              <div className="text-gray-400">No passengers booked yet.</div>
            ) : (
              <ul className="space-y-4">
                {passengerList.map((p) => (
                  <li key={p.id} className="flex items-center gap-4 bg-gray-800/70 rounded-xl p-4 border border-gray-700 shadow">
                    <img
                      src={p.profile?.photoURL || `https://i.pravatar.cc/150?u=${p.userId}`}
                      alt={p.profile?.displayName || 'Passenger'}
                      className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500/30"
                    />
                    <div>
                      <div className="text-white font-medium">{p.profile?.displayName || 'Passenger'}</div>
                      <div className="text-gray-400 text-sm">{p.profile?.email || ''}</div>
                      <div className="text-emerald-400 text-xs">{p.profile?.phone ? `Phone: ${p.profile.phone}` : ''}</div>
                      <div className="text-emerald-400 text-xs">Seats: {p.seats}</div>
                    </div>
                    <div className="ml-auto flex flex-col items-end gap-2">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {p.status}
                      </span>
                      <a
                        href={`mailto:${p.profile?.email}`}
                        className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 transition-colors mt-1"
                        title="Chat via Email"
                      >
                        <MessageCircle size={16} />
                        <span>Chat</span>
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 