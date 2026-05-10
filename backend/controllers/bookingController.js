const Booking = require('../models/Booking');
const { PRICES, COLLECTION_FEE, RETURN_FEE } = require('../models/Booking');
const Notification = require('../models/Notification');
const NotificationFactory = require('../utils/NotificationFactory');

// CREATE - 
const createBooking = async (req, res) => {
    try {
        const { serviceType, quantity, bookingDate, collectionMethod, returnMethod } = req.body;

        // Auto calculate prices
        const servicePrice = PRICES[serviceType] * quantity;
        const collectionPrice = COLLECTION_FEE[collectionMethod];
        const returnPrice = RETURN_FEE[returnMethod];
        const totalPrice = servicePrice + collectionPrice + returnPrice;

        const booking = await Booking.create({
            userId: req.user.id,
            serviceType,
            quantity,
            bookingDate,
            collectionMethod,
            returnMethod,
            totalPrice
        });

        res.status(201).json(booking);

    } catch (error) {
        res.status(500).json({
            message: "Booking validation failed",
            errors: error.errors
                ? Object.values(error.errors).map(err => err.message)
                : error.message
        });
    }
};

//Get by ID
// GET by ID
const getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        //
        if (req.user.role !== 'admin' && booking.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        res.status(200).json(booking);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// const getBookingById = async (req, res) => {
//     try {
//         const booking = await Booking.findOne({
//             _id: req.params.id,
//             userId: req.user.id
//         });

//         if (!booking) {
//             return res.status(404).json({ message: 'Booking not found' });
//         }

//         res.status(200).json(booking);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };


// READ - booking of user
const getBookings = async (req, res) => {
    try {
        let bookings;

        if (req.user.role === 'admin') {
            bookings = await Booking.find().sort({ createdAt: -1 });
        } else {
            bookings = await Booking.find({ userId: req.user.id }).sort({ createdAt: -1 });
        }

        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// const getBookings = async (req, res) => {
//     try {
//         const bookings = await Booking.find({ userId: req.user.id })
//             .sort({ createdAt: -1 });
//         res.status(200).json(bookings);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

// UPDATE - 
const updateBooking = async (req, res) => {
    try {
        // admin only
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admin can update booking status' });
        }

        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        booking.status = req.body.status || booking.status;
        const updatedBooking = await booking.save();

        // Create notification for the user using Factory pattern
        const notifData = NotificationFactory.create(
          'booking_update',
          booking.userId,
          booking._id,
          updatedBooking.status
        );
        await Notification.create(notifData);

        res.status(200).json(updatedBooking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// const updateBooking = async (req, res) => {
//     try {
//         const booking = await Booking.findById(req.params.id);

//         if (!booking) {
//             return res.status(404).json({ message: 'Booking not found' });
//         }

//         booking.status = req.body.status || booking.status;
//         const updatedBooking = await booking.save();

//         res.status(200).json(updatedBooking);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };


// DELETE
// DELETE
const deleteBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Check
        if (req.user.role !== 'admin' && booking.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await booking.deleteOne();
        res.status(200).json({ message: 'Booking cancelled successfully' });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createBooking, getBookingById, getBookings, updateBooking, deleteBooking };