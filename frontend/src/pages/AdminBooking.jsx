import { useEffect, useState } from 'react';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';

const AdminBooking = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await axiosInstance.get('/api/bookings', {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setBookings(response.data);
      } catch (error) {
        console.error(error);
        alert(error.response?.data?.message || 'Failed to fetch bookings.');
      }
    };

    if (user?.token) {
      fetchBookings();
    }
  }, [user]);

  const handleDeleteBooking = async (id) => {
    try {
      await axiosInstance.delete(`/api/bookings/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      setBookings(bookings.filter((booking) => booking._id !== id));
      alert('Booking deleted successfully');
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || 'Failed to delete booking.');
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const response = await axiosInstance.put(
        `/api/bookings/${id}`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      setBookings(
        bookings.map((booking) =>
          booking._id === id ? response.data : booking
        )
      );

      alert('Status updated successfully');
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || 'Failed to update status.');
    }
  };

  return (
    <div className="container mx-auto p-6">
        <h2 className="text-3xl font-bold mb-6">Admin Management</h2>

        {bookings.length === 0 ? (
          <p>No bookings found.</p>
        ) : (
          bookings.map((booking) => (
            <div key={booking._id} className="p-4 rounded-lg border bg-white border-gray-200 mb-4">
              <p><strong>User ID:</strong> {booking.userId}</p>
              <p><strong>Service Type:</strong> {booking.serviceType}</p>
              <p><strong>Quantity:</strong> {booking.quantity}</p>
              <p><strong>Booking Date:</strong> {new Date(booking.bookingDate).toLocaleDateString()}</p>
              <p><strong>Collection Method:</strong> {booking.collectionMethod}</p>
              <p><strong>Return Method:</strong> {booking.returnMethod}</p>
              <p><strong>Status:</strong> {booking.status}</p>
              <p><strong>Total Price:</strong> ${booking.totalPrice}</p>

              <div className="mt-4 flex gap-3 items-center">
                <select
                  value={booking.status}
                  onChange={(e) => handleStatusUpdate(booking._id, e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded bg-white text-black"
                >
                  <option value="booked">booked</option>
                  <option value="waiting_pickup">waiting_pickup</option>
                  <option value="waiting_dropoff">waiting_dropoff</option>
                  <option value="laundry_received">laundry_received</option>
                  <option value="processing">processing</option>
                  <option value="ready">ready</option>
                  <option value="out_for_delivery">out_for_delivery</option>
                  <option value="completed">completed</option>
                </select>

                <button
                  onClick={() => handleDeleteBooking(booking._id)}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
  );
};

export default AdminBooking;