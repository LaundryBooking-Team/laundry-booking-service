import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';

const MyBooking = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bookingRes, paymentRes] = await Promise.all([
          axiosInstance.get('/api/bookings', {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
          axiosInstance.get('/api/payments', {
            headers: { Authorization: `Bearer ${user.token}` },
          })
        ]);
        setBookings(bookingRes.data);
        setPayments(paymentRes.data);
      } catch (error) {
        console.error(error);
        alert('Failed to fetch bookings.');
      }
    };

    if (user?.token) fetchData();
  }, [user]);

  // Returns a successful payment for a given bookingId, if any
  const getPaymentForBooking = (bookingId) =>
    payments.find(
      (p) => p.bookingId === bookingId && p.status === 'succeeded'
    );

  const handleCancelBooking = async (id) => {
    try {
      await axiosInstance.delete(`/api/bookings/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setBookings(bookings.filter((booking) => booking._id !== id));
      alert('Booking cancelled successfully');
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || 'Failed to cancel booking.');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">My Bookings</h1>

      {bookings.length === 0 ? (
        <p>No bookings found.</p>
      ) : (
        bookings.map((booking) => {
          const payment = getPaymentForBooking(booking._id);
          return (
            <div key={booking._id} className="p-4 rounded-lg border bg-white border-gray-200 mb-4">
              <p><strong>Service:</strong> {booking.serviceType}</p>
              <p><strong>Quantity:</strong> {booking.quantity}</p>
              <p><strong>Date:</strong> {new Date(booking.bookingDate).toLocaleDateString()}</p>
              <p><strong>Collection:</strong> {booking.collectionMethod}</p>
              <p><strong>Return:</strong> {booking.returnMethod}</p>
              <p><strong>Total Price:</strong> ${booking.totalPrice}</p>
              <p><strong>Status:</strong> {booking.status}</p>
              <p>
                <strong>Payment:</strong>{' '}
                {payment ? (
                  <span className="text-green-600 font-semibold">
                    Paid (
                    {payment.method === 'credit_card'
                      ? `${payment.cardBrand || 'Card'} ****${payment.last4}`
                      : 'Apple Pay'}
                    )
                  </span>
                ) : (
                  <span className="text-orange-500 font-semibold">Unpaid</span>
                )}
              </p>

              <div className="mt-3 flex gap-2">
                {!payment && (
                  <Link
                    to={`/payment/${booking._id}`}
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Pay Now
                  </Link>
                )}
                <button
                  onClick={() => handleCancelBooking(booking._id)}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Cancel Booking
                </button>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default MyBooking;
