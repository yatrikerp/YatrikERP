// MongoDB Script to Insert Bookings for ML Testing
// Run this from MongoDB Compass or mongosh

use yatrik_erp;

// Clear existing bookings (optional - comment out if you want to keep existing data)
// db.bookings.deleteMany({});

// Count existing bookings
const bookingCount = db.bookings.countDocuments();
print(`Current bookings: ${bookingCount}`);

if (bookingCount >= 200) {
  print("✅ Already have enough bookings for ML testing!");
} else {
  // Get existing trips
  const trips = db.trips.find().limit(50).toArray();
  
  print(`Found ${trips.length} trips`);
  
  if (trips.length > 0) {
    // Create bookings
    const bookings = [];
    const names = ['John Doe', 'Jane Smith', 'Alice Johnson', 'Bob Williams', 'Carol Davis', 'David Brown', 'Emma Wilson'];
    
    let count = 0;
    trips.forEach(trip => {
      const numBookings = Math.floor(Math.random() * 5) + 2;
      
      for (let i = 0; i < numBookings && count < (200 - bookingCount); i++) {
        const bookingId = `BK${Date.now()}${count}`;
        const bookingRef = `REF${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        const passengerName = names[Math.floor(Math.random() * names.length)];
        
        const booking = {
          bookingId: bookingId,
          bookingReference: bookingRef,
          tripId: trip._id,
          routeId: trip.route || trip.routeId,
          busId: trip.bus || trip.busId,
          depotId: trip.depot || trip.depotId,
          customer: {
            name: passengerName,
            email: `${passengerName.toLowerCase().replace(' ', '.')}@example.com`,
            phone: `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
            age: Math.floor(Math.random() * 50) + 18,
            gender: ['male', 'female'][Math.floor(Math.random() * 2)]
          },
          journey: {
            from: 'Mumbai',
            to: 'Pune',
            departureDate: trip.date || new Date(),
            departureTime: trip.startTime || '08:00',
            arrivalDate: trip.date || new Date(),
            arrivalTime: trip.endTime || '11:00'
          },
          seats: [{
            seatNumber: `A${count + 1}`,
            seatType: 'seater',
            price: trip.fare || 300
          }],
          pricing: {
            baseFare: trip.fare || 300,
            seatCharges: 0,
            taxes: 0,
            discounts: 0,
            total: trip.fare || 300
          },
          baseFare: trip.fare || 300,
          fare: trip.fare || 300,
          status: 'confirmed',
          paymentStatus: 'paid',
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          createdBy: trip.createdBy || ObjectId()
        };
        
        bookings.push(booking);
        count++;
      }
    });
    
    if (bookings.length > 0) {
      const result = db.bookings.insertMany(bookings);
      print(`✅ Inserted ${result.insertedCount} bookings`);
    } else {
      print("⚠️ No bookings created");
    }
  } else {
    print("❌ No trips found in database. Please create trips first.");
  }
}

const total = db.bookings.countDocuments();
print(`\n🎉 Total bookings: ${total}`);
print("✅ Ready to run ML models!");

