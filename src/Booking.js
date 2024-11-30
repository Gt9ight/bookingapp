import React, { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { getFirestore, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import './BookingComponent.css';

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
  const [isZoomed, setIsZoomed] = useState(false);
  const [userDetails, setUserDetails] = useState({ name: '', email: '' });
  const [formSubmitted, setFormSubmitted] = useState(false);

  const allTimes = Array.from({ length: 10 }, (_, i) => `${9 + i}:00 AM`); // 9:00 AM to 6:00 PM

  // Fetch booked times from Firestore
  useEffect(() => {
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      const q = query(collection(db, 'bookings'), where('date', '==', dateString));

      const fetchBookedTimes = async () => {
        const querySnapshot = await getDocs(q);
        const times = querySnapshot.docs.map(doc => doc.data().time);
        setBookedTimes(times);
      };

      fetchBookedTimes();
    }
  }, [selectedDate]);

  useEffect(() => {
    setAvailableTimes(allTimes.filter(time => !bookedTimes.includes(time)));
  }, [bookedTimes]);

  const handleBooking = async () => {
    if (!selectedDate || !selectedTime || !userDetails.name || !userDetails.email) {
      alert('Please fill in all fields.');
      return;
    }

    const dateString = selectedDate.toISOString().split('T')[0];

    try {
      // Save booking to Firestore with user info
      await addDoc(collection(db, 'bookings'), {
        date: dateString,
        time: selectedTime,
        name: userDetails.name,
        email: userDetails.email,
      });

      // Send booking details via Web3Forms
      sendEmail(userDetails.name, userDetails.email, selectedDate, selectedTime);

      // Update booked times
      setBookedTimes(prev => [...prev, selectedTime]);
      setSelectedTime(null);
      setFormSubmitted(true);

      // Reset state and go back to calendar view
      resetFormAndGoBack();
      
      alert('Booking confirmed!');
    } catch (error) {
      console.error('Error booking appointment: ', error);
      alert('Failed to confirm booking. Please try again.');
    }
  };

  const sendEmail = (name, email, date, time) => {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('date', date.toDateString());
    formData.append('time', time);
    formData.append('access_key', '9cf04c75-7bac-4652-9754-0effc77d6aaa'); // Replace with your actual access key

    // Send email using Web3Forms API
    fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: formData,
    })
      .then(response => response.json())
      .then(data => {
        console.log('Email sent successfully:', data);
      })
      .catch(error => {
        console.log('Error sending email:', error);
      });
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setIsZoomed(true); // Trigger zoom-in effect
  };

  const handleNavigation = (direction) => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1); // Go back one day
    } else if (direction === 'next') {
      newDate.setDate(newDate.getDate() + 1); // Go forward one day
    }
    setSelectedDate(newDate); // Update selected date
  };

  const resetFormAndGoBack = () => {
    setSelectedDate(null);
    setSelectedTime(null);
    setUserDetails({ name: '', email: '' });
    setFormSubmitted(false);
    setIsZoomed(false); // Bring back to calendar view
  };

  return (
    <div className={`booking-container ${isZoomed ? 'zoomed' : ''}`}>
      {!isZoomed ? (
        <div className="calendar-container">
          <h2>Select a Date</h2>
          <Calendar onChange={handleDateSelect} value={selectedDate} />
        </div>
      ) : (
        <div className="zoomed-view">
          <button className="back-button" onClick={resetFormAndGoBack}>
            Back to Calendar
          </button>
          <h2>{selectedDate.toDateString()}</h2>
          <div className="navigation-buttons">
            <button onClick={() => handleNavigation('prev')}>&lt; Previous</button>
            <button onClick={() => handleNavigation('next')}>Next &gt;</button>
          </div>
          <div className="times-container">
            <h3>Available Times</h3>
            <ul className="times-list">
              {availableTimes.map(time => (
                <li key={time}>
                  <button
                    onClick={() => setSelectedTime(time)}
                    className={`time-button ${selectedTime === time ? 'selected' : ''}`}
                  >
                    {time}
                  </button>
                </li>
              ))}
            </ul>
            {selectedTime && (
              <div className="form-container">
                {!formSubmitted ? (
                  <div>
                    <h3>Your Details</h3>
                    <input
                      type="text"
                      placeholder="Name"
                      value={userDetails.name}
                      onChange={(e) => setUserDetails({ ...userDetails, name: e.target.value })}
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={userDetails.email}
                      onChange={(e) => setUserDetails({ ...userDetails, email: e.target.value })}
                    />
                    <button onClick={handleBooking} className="confirm-button">
                      Confirm Booking
                    </button>
                  </div>
                ) : (
                  <div className="confirmation-message">
                    <h3>Thank you, {userDetails.name}!</h3>
                    <p>Your booking for {selectedDate.toDateString()} at {selectedTime} has been confirmed.</p>
                    <button onClick={resetFormAndGoBack} className="back-to-calendar-button">
                      Back to Calendar
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingComponent;
