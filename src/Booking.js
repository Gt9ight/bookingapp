import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { getFirestore, collection, addDoc, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAqe11mEvXZfXAQdAkLkxmjydPOCwHiB-0",
  authDomain: "plm-lily-star.firebaseapp.com",
  projectId: "plm-lily-star",
  storageBucket: "plm-lily-star.appspot.com",
  messagingSenderId: "930008233125",
  appId: "1:930008233125:web:dfa14f65dadd4e8968494c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const BookingComponent = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [bookedTimes, setBookedTimes] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);

  const allTimes = Array.from({ length: 10 }, (_, i) => `${9 + i}:00 AM`); // 9:00 AM to 6:00 PM

  // Clear bookedTimes when a new date is selected
  useEffect(() => {
    console.log('Date Changed:', selectedDate?.toDateString());
    setBookedTimes([]); // Clear previous booked times
  }, [selectedDate]);

  // Fetch booked times for the selected date
  useEffect(() => {
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      const q = query(collection(db, 'bookings'), where('date', '==', dateString));
      
      const fetchBookedTimes = async () => {
        const querySnapshot = await getDocs(q);
        const times = querySnapshot.docs.map(doc => doc.data().time);

        console.log('Selected Date:', dateString);
        console.log('Fetched Times:', times); // Debugging output

        setBookedTimes(times);
      };

      fetchBookedTimes();
    }
  }, [selectedDate]);

  // Dynamically update availableTimes based on bookedTimes
  useEffect(() => {
    console.log('Updated Booked Times:', bookedTimes);
    setAvailableTimes(allTimes.filter(time => !bookedTimes.includes(time)));
  }, [bookedTimes]);

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime) {
      alert('Please select a date and time.');
      return;
    }
  
    const dateString = selectedDate.toISOString().split('T')[0];
  
    try {
      // Save booking to Firestore
      await addDoc(collection(db, 'bookings'), {
        date: dateString,
        time: selectedTime,
      }); 
  
      // Update local state to reflect new booking
      setBookedTimes(prev => [...prev, selectedTime]);
  
      // Reset state after booking
      setSelectedTime(null);
  
      alert('Booking confirmed!');
    } catch (error) {
      console.error('Error booking appointment: ', error);
      alert('Failed to confirm booking. Please try again.');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: 'auto' }}>
      <h2>Book a Haircut</h2>
      <Calendar onChange={setSelectedDate} value={selectedDate} />
      {selectedDate && (
        <>
          <h3>Available Times for {selectedDate.toDateString()}</h3>
          <ul>
            {availableTimes.map(time => (
              <li key={time}>
                <button
                  onClick={() => setSelectedTime(time)}
                  style={{
                    backgroundColor: selectedTime === time ? 'green' : 'lightgray',
                    margin: '5px',
                    padding: '10px',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {time}
                </button>
              </li>
            ))}
          </ul>
          <button onClick={handleBooking} style={{ marginTop: '20px' }}>
            Confirm Booking
          </button>
        </>
      )}
    </div>
  );
};

export default BookingComponent;
