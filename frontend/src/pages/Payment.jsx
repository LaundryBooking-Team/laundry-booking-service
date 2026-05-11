import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';
import PaymentForm from '../components/PaymentForm';

const Payment = () => {
  const { bookingId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await axiosInstance.get(`/api/bookings/${bookingId}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setBooking(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Could not load booking.');
      } finally {
        setLoading(false);
      }
    };
    if (user?.token) fetchBooking();
  }, [bookingId, user]);

  const handleSuccess = (payment) => {
    navigate(`/payment/success/${payment._id}`);
  };

  if (loading) return <div className="container mx-auto p-6">Loading booking...</div>;
  if (error) return <div className="container mx-auto p-6 text-red-600">{error}</div>;
  if (!booking) return null;

  return (
    <div className="container mx-auto p-6">
      <PaymentForm booking={booking} onSuccess={handleSuccess} />
    </div>
  );
};

export default Payment;
