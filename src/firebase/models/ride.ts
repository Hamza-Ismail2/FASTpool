import { db } from '../clientApp';
import { 
  collection, doc, addDoc, getDoc, getDocs, 
  updateDoc, deleteDoc, query, where, orderBy, 
  limit, Timestamp, DocumentReference, DocumentData 
} from 'firebase/firestore';

export type RideStatus = 'upcoming' | 'completed' | 'cancelled';
export type GenderPreference = 'all' | 'female_only' | 'male_only';

export interface Ride {
  id?: string;
  driverId: string;
  driver?: {
    id: string;
    name: string;
    avatar: string;
    gender?: string;
  };
  pickup: string;
  pickupLat: number;
  pickupLng: number;
  destination: string;
  destinationLat: number;
  destinationLng: number;
  date: Date | Timestamp;
  time: string;
  totalSeats: number;
  availableSeats: number;
  price: number;
  status: RideStatus;
  description?: string;
  genderPreference: GenderPreference;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

// Create a new ride
export async function createRide(ride: Omit<Ride, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const now = Timestamp.now();
  
  const rideData = {
    ...ride,
    createdAt: now,
    updatedAt: now
  };
  
  const docRef = await addDoc(collection(db, 'rides'), rideData);
  return docRef.id;
}

// Get a ride by ID
export async function getRideById(id: string): Promise<Ride | null> {
  const rideRef = doc(db, 'rides', id);
  const rideSnap = await getDoc(rideRef);
  
  if (rideSnap.exists()) {
    const data = rideSnap.data();
    return { 
      id: rideSnap.id, 
      ...data,
      date: data.date.toDate() // Convert Timestamp to Date
    } as Ride;
  }
  
  return null;
}

// Update a ride
export async function updateRide(id: string, rideData: Partial<Ride>): Promise<void> {
  const rideRef = doc(db, 'rides', id);
  
  // Add updated timestamp
  const dataToUpdate = {
    ...rideData,
    updatedAt: Timestamp.now()
  };
  
  await updateDoc(rideRef, dataToUpdate);
}

// Delete a ride
export async function deleteRide(id: string): Promise<void> {
  const rideRef = doc(db, 'rides', id);
  await deleteDoc(rideRef);
}

// Get upcoming rides (available for booking)
export async function getUpcomingRides(limitCount: number = 10): Promise<Ride[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Simplify the query to avoid multiple inequality filters
  // that require complex indexes
  const ridesQuery = query(
    collection(db, 'rides'),
    where('status', '==', 'upcoming'),
    where('date', '>=', today),
    orderBy('date', 'asc'),
    limit(limitCount)
  );
  
  const querySnapshot = await getDocs(ridesQuery);
  const rides: Ride[] = [];
  
  // Filter for available seats in memory after fetching
  querySnapshot.forEach(doc => {
    const data = doc.data();
    if (data.availableSeats > 0) {
      rides.push({
        id: doc.id,
        ...data,
        date: data.date.toDate() // Convert Timestamp to Date
      } as Ride);
    }
  });
  
  return rides;
}

// Get rides offered by a specific user
export async function getRidesByDriver(driverId: string): Promise<Ride[]> {
  const ridesQuery = query(
    collection(db, 'rides'),
    where('driverId', '==', driverId),
    orderBy('date', 'desc')
  );
  
  const querySnapshot = await getDocs(ridesQuery);
  const rides: Ride[] = [];
  
  querySnapshot.forEach(doc => {
    const data = doc.data();
    rides.push({
      id: doc.id,
      ...data,
      date: data.date.toDate() // Convert Timestamp to Date
    } as Ride);
  });
  
  return rides;
}

// Cancel a ride
export async function cancelRide(id: string): Promise<void> {
  await updateRide(id, { status: 'cancelled' });
}

// Complete a ride
export async function completeRide(id: string): Promise<void> {
  await updateRide(id, { status: 'completed' });
} 