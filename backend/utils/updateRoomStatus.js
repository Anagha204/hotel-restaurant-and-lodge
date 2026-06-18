
import Room from "../models/lodge/Rooms.js";
import Booking from "../models/lodge/Booking.js";
/**
 * Updates room status based on booking changes
 * @param {string} roomId - Room ObjectId
 * @param {string} bookingId - Booking ObjectId (for exclusion)
 * @param {string} newBookingStatus - 'Confirmed', 'Cancelled', etc.
 * @param {Date} checkInDate - Booking check-in date
 * @param {Date} checkOutDate - Booking check-out date
 * @param {boolean} isDeleted - true if booking is being deleted
 */
async function updateRoomStatusForBooking(roomId, bookingId, newBookingStatus, checkInDate, checkOutDate, isDeleted = false) {
    const room = await Room.findById(roomId);
    if (!room) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    // If booking is cancelled or deleted
    if (isDeleted || newBookingStatus === 'Cancelled') {
        // Find any other active booking (Confirmed or Checked-In) that overlaps today
        const overlapping = await Booking.findOne({
            room: roomId,
            _id: { $ne: bookingId },
            status: { $in: ['Confirmed', 'Checked-In'] },
            checkIn: { $lte: checkOut },
            checkOut: { $gte: checkIn }
        });
        if (!overlapping && room.status !== 'Occupied') {
            room.status = 'Available';
            await room.save();
            console.log(`Room ${room.roomNumber} status updated to Available (booking cancelled/deleted)`);
        }
        return;
    }

    // For new or updated booking with status 'Confirmed'
    if (newBookingStatus === 'Confirmed') {
        if (room.status !== 'Occupied') { // Don't override Occupied
            room.status = 'Reserved';
            await room.save();
            console.log(`Room ${room.roomNumber} status updated to Reserved (booking confirmed)`);
        }
    }
}

export default updateRoomStatusForBooking;