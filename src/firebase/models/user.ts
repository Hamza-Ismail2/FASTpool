import { db } from '../clientApp';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';

// User profile structure in Firestore
export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  gender: string; // 'male', 'female', 'other', or empty string
  phone: string;
  address: string;
  preferredPickupPoints: string;
  bio: string;
  createdAt: Date;
  updatedAt: Date;
  ridesOffered: number;
  ridesJoined: number;
  totalSavings: number;
  co2Saved: number;
}

// Create a new user document or update if exists
export async function createOrUpdateUser(user: User): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);
  
  const now = new Date();
  
  if (!userSnap.exists()) {
    // Create new user
    const newUser: UserProfile = {
      uid: user.uid,
      displayName: user.displayName || '',
      email: user.email || '',
      photoURL: user.photoURL || '',
      gender: '', // Default to empty, will be set in profile
      phone: '',
      address: '',
      preferredPickupPoints: '',
      bio: '',
      createdAt: now,
      updatedAt: now,
      ridesOffered: 0,
      ridesJoined: 0,
      totalSavings: 0,
      co2Saved: 0
    };
    
    await setDoc(userRef, newUser);
    return newUser;
  } else {
    // Update existing user
    const userData = userSnap.data() as UserProfile;
    
    // Only update auth-related fields that might have changed
    const updatedFields = {
      displayName: user.displayName || userData.displayName,
      email: user.email || userData.email,
      photoURL: user.photoURL || userData.photoURL,
      updatedAt: now
    };
    
    await updateDoc(userRef, updatedFields);
    return { ...userData, ...updatedFields };
  }
}

// Get user profile by uid
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    return userSnap.data() as UserProfile;
  }
  
  return null;
}

// Update user profile
export async function updateUserProfile(uid: string, profileData: Partial<UserProfile>): Promise<void> {
  const userRef = doc(db, 'users', uid);
  
  // Add updated timestamp
  const dataToUpdate = {
    ...profileData,
    updatedAt: new Date()
  };
  
  await updateDoc(userRef, dataToUpdate);
} 