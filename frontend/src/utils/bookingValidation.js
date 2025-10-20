// Professional booking validation utilities for YATRIK ERP

export const validatePassengerDetails = (passengerDetails) => {
  const errors = {};
  
  // Name validation
  if (!passengerDetails.name || passengerDetails.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters long';
  } else if (passengerDetails.name.trim().length > 50) {
    errors.name = 'Name cannot exceed 50 characters';
  } else if (!/^[a-zA-Z\s]+$/.test(passengerDetails.name.trim())) {
    errors.name = 'Name can only contain letters and spaces';
  }
  
  // Age validation
  if (!passengerDetails.age || passengerDetails.age < 1 || passengerDetails.age > 120) {
    errors.age = 'Age must be between 1 and 120 years';
  }
  
  // Gender validation
  if (!passengerDetails.gender || !['male', 'female', 'other'].includes(passengerDetails.gender)) {
    errors.gender = 'Please select a valid gender';
  }
  
  // Phone validation
  if (!passengerDetails.phone) {
    errors.phone = 'Phone number is required';
  } else if (!/^[\+]?[0-9]{10,15}$/.test(passengerDetails.phone.replace(/\s/g, ''))) {
    errors.phone = 'Please enter a valid phone number (10-15 digits)';
  }
  
  // Email validation
  if (!passengerDetails.email) {
    errors.email = 'Email address is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(passengerDetails.email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  // ID proof validation
  if (!passengerDetails.idProof || !passengerDetails.idProof.trim()) {
    errors.idProof = 'ID proof number is required';
  } else if (passengerDetails.idProof.trim().length < 5) {
    errors.idProof = 'ID proof number must be at least 5 characters';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateContactDetails = (contactDetails) => {
  const errors = {};
  
  // Email validation
  if (!contactDetails.email) {
    errors.email = 'Email address is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactDetails.email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  // Phone validation (strict Indian mobile)
  if (!contactDetails.phone) {
    errors.phone = 'Phone number is required';
  } else if (!validateIndianMobile(contactDetails.phone)) {
    errors.phone = 'Enter a valid 10-digit Indian mobile number starting with 6-9';
  }
  
  // OTP validation
  if (contactDetails.otp && contactDetails.otp.length !== 6) {
    errors.otp = 'OTP must be exactly 6 digits';
  } else if (contactDetails.otp && !/^[0-9]{6}$/.test(contactDetails.otp)) {
    errors.otp = 'OTP must contain only numbers';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateSeatSelection = (selectedSeats, trip) => {
  const errors = {};
  
  // Check if seats are selected
  if (!selectedSeats || selectedSeats.length === 0) {
    errors.seats = 'Please select at least one seat';
    return { isValid: false, errors };
  }
  
  // Check seat availability
  if (trip && trip.availableSeats) {
    const unavailableSeats = selectedSeats.filter(seat => 
      !trip.availableSeats.includes(seat)
    );
    
    if (unavailableSeats.length > 0) {
      errors.seats = `Seats ${unavailableSeats.join(', ')} are no longer available`;
    }
  }
  
  // Check maximum seats per booking
  if (selectedSeats.length > 6) {
    errors.seats = 'Maximum 6 seats can be booked in a single transaction';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateBoardingDrop = (boardingDrop) => {
  const errors = {};
  
  // Boarding point validation
  if (!boardingDrop.boardingPoint || !boardingDrop.boardingPoint.trim()) {
    errors.boardingPoint = 'Please select a boarding point';
  }
  
  // Drop point validation
  if (!boardingDrop.dropPoint || !boardingDrop.dropPoint.trim()) {
    errors.dropPoint = 'Please select a drop point';
  }
  
  // Check if boarding and drop points are different
  if (boardingDrop.boardingPoint && boardingDrop.dropPoint && 
      boardingDrop.boardingPoint === boardingDrop.dropPoint) {
    errors.dropPoint = 'Drop point must be different from boarding point';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validatePaymentDetails = (paymentDetails) => {
  const errors = {};
  
  // Payment method validation
  if (!paymentDetails.method || !['razorpay', 'upi', 'card', 'netbanking'].includes(paymentDetails.method)) {
    errors.method = 'Please select a valid payment method';
  }
  
  // Amount validation
  if (!paymentDetails.amount || paymentDetails.amount <= 0) {
    errors.amount = 'Invalid payment amount';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateTripSearch = (searchData) => {
  const errors = {};
  
  // From location validation
  if (!searchData.from || !searchData.from.trim()) {
    errors.from = 'Please select departure location';
  }
  
  // To location validation
  if (!searchData.to || !searchData.to.trim()) {
    errors.to = 'Please select destination location';
  }
  
  // Check if from and to are different
  if (searchData.from && searchData.to && searchData.from === searchData.to) {
    errors.to = 'Destination must be different from departure location';
  }
  
  // Date validation
  if (!searchData.date) {
    errors.date = 'Please select travel date';
  } else {
    const selectedDate = new Date(searchData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      errors.date = 'Travel date cannot be in the past';
    }
    
    // Check if date is not more than 30 days in future
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    
    if (selectedDate > maxDate) {
      errors.date = 'Travel date cannot be more than 30 days in future';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateBookingData = (bookingData) => {
  const errors = {};
  
  // Trip validation
  if (!bookingData.tripId) {
    errors.tripId = 'Trip selection is required';
  }
  
  // Passenger details validation
  if (!bookingData.passengers || bookingData.passengers.length === 0) {
    errors.passengers = 'At least one passenger is required';
  } else {
    bookingData.passengers.forEach((passenger, index) => {
      const passengerValidation = validatePassengerDetails(passenger);
      if (!passengerValidation.isValid) {
        errors[`passenger_${index}`] = passengerValidation.errors;
      }
    });
  }
  
  // Seat selection validation
  if (!bookingData.seats || bookingData.seats.length === 0) {
    errors.seats = 'Seat selection is required';
  }
  
  // Boarding drop validation
  const boardingDropValidation = validateBoardingDrop(bookingData.boardingDrop || {});
  if (!boardingDropValidation.isValid) {
    errors.boardingDrop = boardingDropValidation.errors;
  }
  
  // Contact details validation
  const contactValidation = validateContactDetails(bookingData.contactDetails || {});
  if (!contactValidation.isValid) {
    errors.contactDetails = contactValidation.errors;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Utility function to format validation errors for display
export const formatValidationErrors = (errors) => {
  const formattedErrors = [];
  
  const processErrors = (errorObj, prefix = '') => {
    Object.keys(errorObj).forEach(key => {
      const value = errorObj[key];
      if (typeof value === 'string') {
        formattedErrors.push(`${prefix}${key}: ${value}`);
      } else if (typeof value === 'object' && value !== null) {
        processErrors(value, `${prefix}${key}.`);
      }
    });
  };
  
  processErrors(errors);
  return formattedErrors;
};

// Utility function to check if a field has an error
export const hasFieldError = (errors, fieldPath) => {
  const pathArray = fieldPath.split('.');
  let current = errors;
  
  for (const key of pathArray) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return false;
    }
  }
  
  return typeof current === 'string' && current.length > 0;
};

// Utility function to get field error message
export const getFieldError = (errors, fieldPath) => {
  const pathArray = fieldPath.split('.');
  let current = errors;
  
  for (const key of pathArray) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return null;
    }
  }
  
  return typeof current === 'string' ? current : null;
};

// Strict Indian mobile validator
export const validateIndianMobile = (value) => {
  if (!value) return false;
  const digits = String(value).replace(/\D/g, '');
  if (!/^[6-9][0-9]{9}$/.test(digits)) return false;
  if (/^(\d)\1{9}$/.test(digits)) return false; // all same digit
  const banned = ['1234567890', '0123456789', '9876543210'];
  if (banned.includes(digits)) return false;
  return true;
};
