// utils/bookingStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Booking = {
  matchId: string;
  matchName: string;
  matchDate: string;
  seatSection: string;
  seatNumber: string;
  price?: string;
  bookedAt: string;
};

export const saveBooking = async (booking: Booking, userId: string): Promise<boolean> => {
  try {
    // Use user-specific key
    const storageKey = `userBookings_${userId}`;
    
    // Get existing bookings for this user
    const bookingsStr = await AsyncStorage.getItem(storageKey);
    const bookings: Booking[] = bookingsStr ? JSON.parse(bookingsStr) : [];

    // Add new booking
    bookings.push(booking);

    // Save back to storage with user-specific key
    await AsyncStorage.setItem(storageKey, JSON.stringify(bookings));

    console.log('✅ Booking saved to AsyncStorage for user:', userId, booking);
    return true;
  } catch (err) {
    console.error('❌ Error saving booking:', err);
    return false;
  }
};

export const getBookings = async (userId: string): Promise<Booking[]> => {
  try {
    const storageKey = `userBookings_${userId}`;
    const bookingsStr = await AsyncStorage.getItem(storageKey);
    return bookingsStr ? JSON.parse(bookingsStr) : [];
  } catch (err) {
    console.error('Error loading bookings:', err);
    return [];
  }
};

export const deleteBooking = async (userId: string, index: number): Promise<boolean> => {
  try {
    const storageKey = `userBookings_${userId}`;
    const bookingsStr = await AsyncStorage.getItem(storageKey);
    
    if (bookingsStr) {
      const bookings = JSON.parse(bookingsStr);
      bookings.splice(index, 1);
      await AsyncStorage.setItem(storageKey, JSON.stringify(bookings));
      return true;
    }
    return false;
  } catch (err) {
    console.error('Error deleting booking:', err);
    return false;
  }
};