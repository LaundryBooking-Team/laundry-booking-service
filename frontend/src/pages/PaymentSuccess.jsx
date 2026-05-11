import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';

const PaymentSuccess = () => {
  const { paymentId } = useParams();
  const { user } = useAuth();
  const [payment, setPayment] = useState(null);

  useEffect(() => {
    const fetchPayment = async () => {
      try {
        const res = await axiosInstance.get(`/api/payments/${paymentId}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setPayment(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    if (user?.token) fetchPayment();
  }, [paymentId, user]);

  if (!payment) return <div className="container mx-auto p-6">Loading receipt...</div>;

  return (
    <div className="container mx-auto p-6 max-w-md">
      <div className="bg-white rounded-lg shadow-md p-6 text-center">
        <div className="w-16 h-16 mx-auto bg-green-100 text-green-600 rounded-full flex items-center justify-center text-3xl mb-4">
          &#10003;
        </div>
        <h1 className="text-2xl font-bold mb-2">Payment Successful</h1>
        <p className="text-gray-600 mb-6">Thank you for your booking!</p>

        <div className="text-left border-t pt-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Amount</span>
            <span className="font-semibold">${payment.amount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Method</span>
            <span className="font-semibold">
              {payment.method === 'credit_card'
                ? `${payment.cardBrand || 'Card'} ****${payment.last4}`
                : 'Apple Pay'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Status</span>
            <span className="font-semibold text-green-600 capitalize">{payment.status}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Transaction ID</span>
            <span className="font-mono text-xs">{payment.transactionId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Date</span>
            <span className="text-sm">{new Date(payment.createdAt).toLocaleString()}</span>
          </div>
        </div>

        <Link
          to="/my-bookings"
          className="block mt-6 bg-blue-600 text-white py-3 rounded font-medium hover:bg-blue-700"
        >
          Back to My Bookings
        </Link>
      </div>
    </div>
  );
};

export default PaymentSuccess;
