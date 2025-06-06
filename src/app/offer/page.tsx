export const dynamic = "force-dynamic";

"use client";

import { useState, useEffect } from "react";
import { MapPin, Calendar, Clock, User, DollarSign, ArrowRight, Info, UserCheck } from "lucide-react";
import { auth } from "@/firebase/clientApp";
import { getUserProfile } from "@/firebase/models/user";
import { createRide, GenderPreference } from "@/firebase/models/ride";
import { useRouter } from "next/navigation";
import { Timestamp } from "firebase/firestore";
import dynamic from "next/dynamic";
import NominatimSearchInput from "@/components/NominatimSearchInput";
import type { LocationPoint } from "@/components/UserLocationMap";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

const UserLocationMap = dynamic(() => import("@/components/UserLocationMap"), { ssr: false });

function getTodayInGMT5() {
  const now = new Date();
  // Convert to GMT+5
  const offset = 5 * 60; // minutes
  const localOffset = now.getTimezoneOffset();
  const gmt5 = new Date(now.getTime() + (offset + localOffset) * 60000);
  gmt5.setHours(0, 0, 0, 0);
  return gmt5;
}

function getNowInGMT5() {
  const now = new Date();
  const offset = 5 * 60; // minutes
  const localOffset = now.getTimezoneOffset();
  return new Date(now.getTime() + (offset + localOffset) * 60000);
}

export default function OfferRidePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [userGender, setUserGender] = useState<string>("");
  const [formData, setFormData] = useState({
    pickup: "",
    destination: "",
    date: "",
    time: "",
    seats: 1,
    price: "",
    description: "",
    genderPreference: "all" as GenderPreference,
  });
  const [pickupLocation, setPickupLocation] = useState<LocationPoint | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<LocationPoint | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Fetch user profile to get gender (for display purposes)
  useEffect(() => {
    const fetchUserProfile = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const profile = await getUserProfile(user.uid);
          if (profile) {
            setUserGender(profile.gender || "");
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      }
    };
    fetchUserProfile();
  }, []);

  // Validation
  function validate() {
    const errs: { [key: string]: string } = {};
    const today = getTodayInGMT5();
    const now = getNowInGMT5();
    if (!selectedDate) {
      errs.date = "Please select a date.";
    } else if (selectedDate < today) {
      errs.date = "Date cannot be in the past.";
    }
    if (!selectedTime) {
      errs.time = "Please select a departure time.";
    } else if (selectedDate) {
      // Check if today, time must be at least 10 min from now
      const [h, m] = selectedTime.split(":").map(Number);
      const dep = new Date(selectedDate);
      dep.setHours(h, m, 0, 0);
      if (selectedDate.toDateString() === today.toDateString()) {
        if (dep.getTime() - now.getTime() < 10 * 60 * 1000) {
          errs.time = "Departure time must be at least 10 minutes from now (GMT+5).";
        }
      }
    }
    if (!formData.seats || Number(formData.seats) < 1 || Number(formData.seats) > 6) {
      errs.seats = "Seats must be between 1 and 6.";
    }
    if (!formData.price || Number(formData.price) <= 0) {
      errs.price = "Price must be a positive number.";
    }
    return errs;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    const { [name]: _removed, ...rest } = errors;
    setErrors(rest);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    const { date: _removed, ...rest } = errors;
    setErrors(rest);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTime(e.target.value);
    const { time: _removed, ...rest } = errors;
    setErrors(rest);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    const user = auth.currentUser;
    if (!user) {
      alert("You must be signed in to offer a ride");
      return;
    }
    if (!pickupLocation || !destinationLocation) {
      alert("Please select both pickup and destination locations.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Convert form data to ride object
      const dateObj = selectedDate!;
      const rideData = {
        driverId: user.uid,
        pickup: pickupLocation.display_name!,
        pickupLat: pickupLocation.lat!,
        pickupLng: pickupLocation.lng!,
        destination: destinationLocation.display_name!,
        destinationLat: destinationLocation.lat!,
        destinationLng: destinationLocation.lng!,
        date: Timestamp.fromDate(dateObj),
        time: selectedTime,
        totalSeats: Number(formData.seats),
        availableSeats: Number(formData.seats),
        price: Number(formData.price),
        status: 'upcoming' as const,
        description: formData.description,
        genderPreference: formData.genderPreference,
      };
      // Create ride in Firestore
      const rideId = await createRide(rideData);
      alert("Your ride has been offered successfully!");
      router.push("/my-rides");
    } catch (error) {
      console.error("Error creating ride:", error);
      alert("Failed to create ride. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Generate time options (every 5 min, only valid times)
  const getTimeOptions = () => {
    const options: string[] = [];
    const today = getTodayInGMT5();
    const now = getNowInGMT5();
    let start = 0;
    if (selectedDate && selectedDate.toDateString() === today.toDateString()) {
      // If today, start from now + 10 min
      const minTime = new Date(now.getTime() + 10 * 60 * 1000);
      start = minTime.getHours() * 60 + minTime.getMinutes();
    }
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 5) {
        const total = h * 60 + m;
        if (total < start) continue;
        const label = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
        options.push(label);
      }
    }
    return options;
  };

  return (
    <div className="min-h-screen bg-gray-900 pt-20">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
            Offer a Ride
          </span>
        </h1>
        <p className="text-gray-400 mb-10">
          Share your journey with others, save on costs, and reduce your carbon footprint.
        </p>
        {/* Pickup and Destination Search */}
        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <NominatimSearchInput
            label="Pickup Location *"
            placeholder="e.g. FAST University Main Campus"
            onSelect={setPickupLocation}
          />
          <NominatimSearchInput
            label="Destination *"
            placeholder="e.g. Liberty Market"
            onSelect={setDestinationLocation}
          />
        </div>
        {/* User Location Map */}
        <div className="mb-8">
          <UserLocationMap pickup={pickupLocation} destination={destinationLocation} />
        </div>
        <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-xl">
          <div className="p-6 bg-gradient-to-r from-emerald-500/5 to-cyan-500/5 border-b border-gray-700">
            <h2 className="text-xl font-bold text-white">Ride Details</h2>
            <p className="text-gray-400 text-sm">Fill in the details of your journey</p>
          </div>
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date */}
              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">
                  Date *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar size={18} className="text-emerald-500" />
                  </div>
                  <div className="pl-10">
                    <DayPicker
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateSelect}
                      fromDate={getTodayInGMT5()}
                      className="bg-gray-900 rounded-lg shadow-lg border border-gray-700 p-2 text-white"
                      styles={{
                        caption: { color: '#34d399' },
                        day_selected: { backgroundColor: '#10b981', color: '#fff' },
                        day_today: { borderColor: '#34d399' },
                        day: { borderRadius: '0.5rem' },
                      }}
                    />
                  </div>
                  {errors.date && <div className="text-xs text-red-400 mt-1 pl-10">{errors.date}</div>}
                </div>
              </div>
              {/* Time */}
              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">
                  Departure Time *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Clock size={18} className="text-emerald-500" />
                  </div>
                  <select
                    name="time"
                    required
                    value={selectedTime}
                    onChange={handleTimeChange}
                    className="block w-full bg-gray-900 border border-gray-700 rounded-lg py-3 pl-10 pr-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 appearance-none"
                  >
                    <option value="">Select time</option>
                    {getTimeOptions().map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  {errors.time && <div className="text-xs text-red-400 mt-1 pl-10">{errors.time}</div>}
                </div>
              </div>
              {/* Available Seats */}
              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">
                  Available Seats *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={18} className="text-emerald-500" />
                  </div>
                  <select
                    name="seats"
                    required
                    value={formData.seats}
                    onChange={handleChange}
                    className="block w-full bg-gray-900 border border-gray-700 rounded-lg py-3 pl-10 pr-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 appearance-none"
                  >
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? "seat" : "seats"}
                      </option>
                    ))}
                  </select>
                  {errors.seats && <div className="text-xs text-red-400 mt-1 pl-10">{errors.seats}</div>}
                </div>
              </div>
              {/* Price per Seat */}
              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">
                  Price per Seat (Rs.) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign size={18} className="text-emerald-500" />
                  </div>
                  <input
                    type="number"
                    name="price"
                    required
                    min="0"
                    value={formData.price}
                    onChange={handleChange}
                    className="block w-full bg-gray-900 border border-gray-700 rounded-lg py-3 pl-10 pr-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                    placeholder="e.g. 250"
                  />
                  {errors.price && <div className="text-xs text-red-400 mt-1 pl-10">{errors.price}</div>}
                </div>
              </div>
              {/* Gender Preference */}
              <div className="md:col-span-2">
                <label className="block text-gray-400 text-sm font-medium mb-2">
                  Gender Preference
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserCheck size={18} className="text-emerald-500" />
                  </div>
                  <select
                    name="genderPreference"
                    value={formData.genderPreference}
                    onChange={handleChange}
                    className="block w-full bg-gray-900 border border-gray-700 rounded-lg py-3 pl-10 pr-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                  >
                    <option value="all">Open to all genders</option>
                    <option value="female_only" disabled={userGender !== 'female'}>Female passengers only{userGender !== 'female' ? ' (available only to female drivers)' : ''}</option>
                    <option value="male_only" disabled={userGender !== 'male'}>Male passengers only{userGender !== 'male' ? ' (available only to male drivers)' : ''}</option>
                  </select>
                </div>
                <p className="mt-2 text-sm text-gray-400">
                  {userGender === '' && "Set your gender in your profile to enable gender-specific rides."}
                </p>
              </div>
            </div>
            {/* Description */}
            <div className="mt-6">
              <label className="block text-gray-400 text-sm font-medium mb-2">
                Additional Information
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="block w-full bg-gray-900 border border-gray-700 rounded-lg py-3 px-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                placeholder="Add details like exact meeting point, vehicle details, or any special instructions"
              ></textarea>
            </div>
            {/* Terms and Notice */}
            <div className="mt-8 p-4 bg-gray-900/70 rounded-lg border border-gray-700">
              <div className="flex items-start gap-3">
                <Info size={20} className="text-emerald-400 flex-shrink-0 mt-1" />
                <p className="text-sm text-gray-400">
                  By offering a ride, you agree to our community guidelines. You are responsible
                  for observing traffic rules and ensuring passenger safety. FASTpool helps connect
                  riders, but the final responsibility for the journey lies with you.
                </p>
              </div>
            </div>
            {/* Submit Button */}
            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white py-3 px-6 rounded-xl font-medium transition-all shadow-lg disabled:opacity-70"
              >
                {loading ? "Creating..." : "Offer Ride"}
                {!loading && <ArrowRight size={18} />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 