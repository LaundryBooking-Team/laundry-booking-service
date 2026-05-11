const sinon = require('sinon');
const { expect } = require('chai');

// Import controller functions
const {
    createBooking,
    getBookings,
    updateBooking,
    deleteBooking
} = require('../controllers/bookingController');

// Import Booking model to stub its methods
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');

// ─────────────────────────────────────────────
// Helper: fake req/res objects
// ─────────────────────────────────────────────
const mockRes = () => {
    const res = {};
    res.status = sinon.stub().returns(res);  // allows chaining: res.status(201).json(...)
    res.json = sinon.stub().returns(res);
    return res;
};

// ─────────────────────────────────────────────
// TEST SUITE
// ─────────────────────────────────────────────
describe('Booking Controller - Unit Tests', () => {

    afterEach(() => {
        sinon.restore(); // reset all stubs after each test
    });

    // ─────────────────────────────────────────────
    // 1. CREATE
    // ─────────────────────────────────────────────
    describe('createBooking', () => {

        it('should create a booking and return 201', async () => {
            // Fake request data
            const req = {
                user: { id: 'user123' },
                body: {
                    serviceType: 'Wash & Fold',
                    quantity: 2,
                    bookingDate: '2026-04-01',
                    collectionMethod: 'Drop off at store',
                    returnMethod: 'Pick up at store'
                }
            };
            const res = mockRes();

            // Fake booking that "database" returns
            const fakeBooking = {
                _id: 'booking123',
                userId: 'user123',
                serviceType: 'Wash & Fold',
                quantity: 2,
                totalPrice: 8, // 4*2 + 0 + 0
                status: 'booked'
            };

            // Stub Booking.create to return fakeBooking (no real DB call)
            sinon.stub(Booking, 'create').resolves(fakeBooking);

            await createBooking(req, res);

            // Check response
            expect(res.status.calledWith(201)).to.be.true;
            expect(res.json.calledWith(fakeBooking)).to.be.true;
        });

        it('should return 500 if creation fails', async () => {
            const req = {
                user: { id: 'user123' },
                body: {
                    serviceType: 'Wash & Fold',
                    quantity: 2,
                    bookingDate: '2026-04-01',
                    collectionMethod: 'Drop off at store',
                    returnMethod: 'Pick up at store'
                }
            };
            const res = mockRes();

            // Stub to throw an error
            sinon.stub(Booking, 'create').rejects(new Error('DB error'));

            await createBooking(req, res);

            expect(res.status.calledWith(500)).to.be.true;
        });
    });

    // ─────────────────────────────────────────────
    // 2. READ
    // ─────────────────────────────────────────────
    describe('getBookings', () => {

        it('should return bookings for a normal user', async () => {
            const req = { user: { id: 'user123', role: 'user' } };
            const res = mockRes();

            const fakeBookings = [
                { _id: 'b1', serviceType: 'Wash & Fold', totalPrice: 8 },
                { _id: 'b2', serviceType: 'Ironing', totalPrice: 6 }
            ];

            // Stub Booking.find().sort() chain
            sinon.stub(Booking, 'find').returns({
                sort: sinon.stub().resolves(fakeBookings)
            });

            await getBookings(req, res);

            expect(res.status.calledWith(200)).to.be.true;
            expect(res.json.calledWith(fakeBookings)).to.be.true;
        });

        it('should return all bookings for admin', async () => {
            const req = { user: { id: 'admin1', role: 'admin' } };
            const res = mockRes();

            const allBookings = [
                { _id: 'b1', userId: 'user123' },
                { _id: 'b2', userId: 'user456' }
            ];

            sinon.stub(Booking, 'find').returns({
                sort: sinon.stub().resolves(allBookings)
            });

            await getBookings(req, res);

            expect(res.status.calledWith(200)).to.be.true;
            expect(res.json.calledWith(allBookings)).to.be.true;
        });
    });

    // ─────────────────────────────────────────────
    // 3. UPDATE
    // ─────────────────────────────────────────────
    describe('updateBooking', () => {

        it('should update booking status and return 200 (admin only)', async () => {
            const req = {
                user: { id: 'admin1', role: 'admin' },
                params: { id: 'booking123' },
                body: { status: 'processing' }
            };
            const res = mockRes();

            const fakeBooking = {
                _id: 'booking123',
                status: 'booked',
                save: sinon.stub().resolves({ _id: 'booking123', status: 'processing' })
            };

            sinon.stub(Booking, 'findById').resolves(fakeBooking);
            sinon.stub(Notification, 'create').resolves({});

            await updateBooking(req, res);

            expect(res.status.calledWith(200)).to.be.true;
        });

        it('should return 403 if non-admin tries to update', async () => {
            const req = {
                user: { id: 'user123', role: 'user' },
                params: { id: 'booking123' },
                body: { status: 'processing' }
            };
            const res = mockRes();

            await updateBooking(req, res);

            expect(res.status.calledWith(403)).to.be.true;
        });

        it('should return 404 if booking not found', async () => {
            const req = {
                user: { id: 'admin1', role: 'admin' },
                params: { id: 'notexist' },
                body: { status: 'processing' }
            };
            const res = mockRes();

            sinon.stub(Booking, 'findById').resolves(null);

            await updateBooking(req, res);

            expect(res.status.calledWith(404)).to.be.true;
        });
    });

    // ─────────────────────────────────────────────
    // 4. DELETE
    // ─────────────────────────────────────────────
    describe('deleteBooking', () => {

        it('should delete booking and return 200', async () => {
            const req = {
                user: { id: 'user123', role: 'user' },
                params: { id: 'booking123' }
            };
            const res = mockRes();

            const fakeBooking = {
                _id: 'booking123',
                userId: { toString: () => 'user123' },
                deleteOne: sinon.stub().resolves()
            };

            sinon.stub(Booking, 'findById').resolves(fakeBooking);

            await deleteBooking(req, res);

            expect(res.status.calledWith(200)).to.be.true;
            expect(res.json.calledWith({ message: 'Booking cancelled successfully' })).to.be.true;
        });

        it('should return 404 if booking not found', async () => {
            const req = {
                user: { id: 'user123', role: 'user' },
                params: { id: 'notexist' }
            };
            const res = mockRes();

            sinon.stub(Booking, 'findById').resolves(null);

            await deleteBooking(req, res);

            expect(res.status.calledWith(404)).to.be.true;
        });

        it('should return 403 if user tries to delete another user booking', async () => {
            const req = {
                user: { id: 'user999', role: 'user' },
                params: { id: 'booking123' }
            };
            const res = mockRes();

            const fakeBooking = {
                _id: 'booking123',
                userId: { toString: () => 'user123' }, // belongs to different user
                deleteOne: sinon.stub().resolves()
            };

            sinon.stub(Booking, 'findById').resolves(fakeBooking);

            await deleteBooking(req, res);

            expect(res.status.calledWith(403)).to.be.true;
        });
    });
});
