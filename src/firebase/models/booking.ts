import { db } from '../clientApp';
import { 
  collection, doc, addDoc, getDoc, getDocs, 
  updateDoc, deleteDoc, query, where, orderBy, 
  Timestamp, runTransaction 
} from 'firebase/firestore';
import { Ride, updateRide } from './ride';
import { updateUserProfile } from './user';

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Booking {
  id?: string;
  rideId: string;
  userId: string;
  driverId: string;
  seats: number;
  totalPrice: number;
  status: BookingStatus;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// Create a new booking with transaction to update ride's available seats
export async function createBooking(
  booking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt' | 'status'>,
  ride: Ride
): Promise<string | null> {
  // Validate that there are enough seats available
  if (ride.availableSeats < booking.seats) {
    throw new Error('Not enough seats available');
  }

  try {
    const bookingRef = collection(db, 'bookings');
    const rideRef = doc(db, 'rides', ride.id!);
    
    // Use a transaction to ensure atomicity
    const bookingId = await runTransaction(db, async (transaction) => {
      // Recheck available seats in transaction
      const rideDoc = await transaction.get(rideRef);
      if (!rideDoc.exists()) {
        throw new Error('Ride no longer exists');
      }
      
      const currentRide = rideDoc.data() as Ride;
      if (currentRide.availableSeats < booking.seats) {
        throw new Error('Not enough seats available');
      }
      
      // Create booking document
      const now = Timestamp.now();
      const newBooking = {
        ...booking,
        status: 'confirmed' as BookingStatus,
        createdAt: now,
        updatedAt: now
      };
      
      const newBookingRef = doc(bookingRef);
      transaction.set(newBookingRef, newBooking);
      
      // Update ride's available seats
      transaction.update(rideRef, {
        availableSeats: currentRide.availableSeats - booking.seats,
        updatedAt: now
      });
      
      return newBookingRef.id;
    });
    
    // Update user stats (ride joined and CO2 saved) - not in transaction as non-critical
    // Assuming 0.1kg CO2 saved per seat
    await updateUserProfile(booking.userId, {
      ridesJoined: 1, // Increment by 1 (simplified, should use FieldValue.increment in real implementation)
      totalSavings: booking.totalPrice, // Add the cost of this booking as savings
      co2Saved: 0.1 * booking.seats // Simplified calculation
    });
    
    return bookingId;
  } catch (error) {
    console.error('Error creating booking:', error);
    return null;
  }
}

// Get a booking by ID
export async function getBookingById(id: string): Promise<Booking | null> {
  const bookingRef = doc(db, 'bookings', id);
  const bookingSnap = await getDoc(bookingRef);
  
  if (bookingSnap.exists()) {
    const data = bookingSnap.data();
    return { 
      id: bookingSnap.id, 
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate()
    } as Booking;
  }
  
  return null;
}

// Get bookings for a specific user
export async function getBookingsByUser(userId: string): Promise<Booking[]> {
  const bookingsQuery = query(
    collection(db, 'bookings'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  const querySnapshot = await getDocs(bookingsQuery);
  const bookings: Booking[] = [];
  
  querySnapshot.forEach(doc => {
    const data = doc.data();
    bookings.push({
      id: doc.id,
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate()
    } as Booking);
  });
  
  return bookings;
}

// Get bookings for a specific ride
export async function getBookingsByRide(rideId: string): Promise<Booking[]> {
  const bookingsQuery = query(
    collection(db, 'bookings'),
    where('rideId', '==', rideId),
    orderBy('createdAt', 'asc')
  );
  
  const querySnapshot = await getDocs(bookingsQuery);
  const bookings: Booking[] = [];
  
  querySnapshot.forEach(doc => {
    const data = doc.data();
    bookings.push({
      id: doc.id,
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate()
    } as Booking);
  });
  
  return bookings;
}

// Cancel a booking with transaction to update ride's available seats
export async function cancelBooking(bookingId: string, rideId: string): Promise<boolean> {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    const rideRef = doc(db, 'rides', rideId);
    
    await runTransaction(db, async (transaction) => {
      const bookingDoc = await transaction.get(bookingRef);
      const rideDoc = await transaction.get(rideRef);
      
      if (!bookingDoc.exists() || !rideDoc.exists()) {
        throw new Error('Booking or ride no longer exists');
      }
      
      const booking = bookingDoc.data() as Booking;
      const ride = rideDoc.data() as Ride;
      
      // Only return seats to the ride if booking was confirmed
      const shouldReturnSeats = booking.status === 'confirmed';
      
      // Update booking status
      transaction.update(bookingRef, {
        status: 'cancelled',
        updatedAt: Timestamp.now()
      });
      
      // Return seats to the ride if needed
      if (shouldReturnSeats) {
        transaction.update(rideRef, {
          availableSeats: ride.availableSeats + booking.seats,
          updatedAt: Timestamp.now()
        });
      }
    });
    
    return true;
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return false;
  }
}

// Complete a booking
export async function completeBooking(bookingId: string): Promise<boolean> {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, {
      status: 'completed',
      updatedAt: Timestamp.now()
    });
    
    return true;
  } catch (error) {
    console.error('Error completing booking:', error);
    return false;
  }
} 