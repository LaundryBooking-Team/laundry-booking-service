import { useEffect, useState } from 'react';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';

const brandColor = {
  Visa: 'bg-blue-600',
  Mastercard: 'bg-red-500',
  Amex: 'bg-indigo-500',
  Other: 'bg-gray-500'
};

const PaymentForm = ({ booking, onSuccess }) => {
  const { user } = useAuth();

  // method: 'credit_card' | 'apple_pay'
  const [method, setMethod] = useState('credit_card');

  // saved cards from server
  const [savedCards, setSavedCards] = useState([]);
  // selected saved card id, or 'new' for fresh card entry
  const [cardChoice, setCardChoice] = useState('new');

  // new card form
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [saveForLater, setSaveForLater] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const authHeader = { headers: { Authorization: `Bearer ${user.token}` } };

  useEffect(() => {
    const fetchSaved = async () => {
      try {
        const res = await axiosInstance.get('/api/payment-methods', authHeader);
        setSavedCards(res.data);
        // Auto-select default card if available
        const def = res.data.find((c) => c.isDefault);
        if (def) setCardChoice(def._id);
      } catch (err) {
        console.error(err);
      }
    };
    if (user?.token) fetchSaved();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const formatCardNumber = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 19);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = { bookingId: booking._id, method };

      if (method === 'credit_card') {
        if (cardChoice !== 'new') {
          // Pay with saved card
          payload.paymentMethodId = cardChoice;
        } else {
          // Pay with fresh card details
          payload.cardNumber = cardNumber.replace(/\s/g, '');
          payload.expiry = expiry;
          payload.cvv = cvv;
          payload.cardholderName = cardName;
          payload.saveForLater = saveForLater;
        }
      } else if (method === 'apple_pay') {
        payload.applePayToken = 'mock_apple_pay_token_' + Date.now();
      }

      const response = await axiosInstance.post('/api/payments', payload, authHeader);
      onSuccess && onSuccess(response.data.payment);
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const useExistingCard = method === 'credit_card' && cardChoice !== 'new';

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Payment</h2>

      {/* Booking summary */}
      <div className="bg-gray-50 p-4 rounded mb-4">
        <p className="text-sm text-gray-600">Service</p>
        <p className="font-semibold">{booking.serviceType}</p>
        <p className="text-sm text-gray-600 mt-2">Total</p>
        <p className="text-2xl font-bold text-green-600">${booking.totalPrice}</p>
      </div>

      {/* Method tabs */}
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setMethod('credit_card')}
          className={`flex-1 py-3 rounded font-medium border-2 transition ${
            method === 'credit_card'
              ? 'border-blue-500 bg-blue-50 text-blue-700'
              : 'border-gray-300 text-gray-600 hover:border-gray-400'
          }`}
        >
          Credit Card
        </button>
        <button
          type="button"
          onClick={() => setMethod('apple_pay')}
          className={`flex-1 py-3 rounded font-medium border-2 transition ${
            method === 'apple_pay'
              ? 'border-black bg-black text-white'
              : 'border-gray-300 text-gray-600 hover:border-gray-400'
          }`}
        >
          Apple Pay
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Saved cards selector */}
        {method === 'credit_card' && savedCards.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">Choose a card</p>
            <div className="space-y-2">
              {savedCards.map((c) => (
                <label
                  key={c._id}
                  className={`flex items-center gap-3 p-3 border-2 rounded cursor-pointer transition ${
                    cardChoice === c._id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="cardChoice"
                    value={c._id}
                    checked={cardChoice === c._id}
                    onChange={() => setCardChoice(c._id)}
                  />
                  <div
                    className={`${brandColor[c.cardBrand] || 'bg-gray-500'} text-white font-bold px-2 py-1 rounded text-xs w-16 text-center`}
                  >
                    {c.cardBrand}
                  </div>
                  <div className="flex-1">
                    <p className="font-mono text-sm">&middot;&middot;&middot;&middot; {c.last4}</p>
                    <p className="text-xs text-gray-500">
                      Exp {String(c.expMonth).padStart(2, '0')}/{String(c.expYear).slice(-2)}
                    </p>
                  </div>
                  {c.isDefault && (
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded">
                      Default
                    </span>
                  )}
                </label>
              ))}
              <label
                className={`flex items-center gap-3 p-3 border-2 rounded cursor-pointer transition ${
                  cardChoice === 'new' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <input
                  type="radio"
                  name="cardChoice"
                  value="new"
                  checked={cardChoice === 'new'}
                  onChange={() => setCardChoice('new')}
                />
                <span className="text-sm font-medium">+ Use a new card</span>
              </label>
            </div>
          </div>
        )}

        {/* New card form */}
        {method === 'credit_card' && !useExistingCard && (
          <>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Cardholder Name</label>
              <input
                type="text"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                placeholder="John Doe"
                required
                className="w-full border rounded px-3 py-2"
              />
            </div>

            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Card Number</label>
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                placeholder="4242 4242 4242 4242"
                required
                className="w-full border rounded px-3 py-2 font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-sm font-medium mb-1">Expiry</label>
                <input
                  type="text"
                  value={expiry}
                  onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                  placeholder="MM/YY"
                  required
                  className="w-full border rounded px-3 py-2 font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">CVV</label>
                <input
                  type="password"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="123"
                  required
                  className="w-full border rounded px-3 py-2 font-mono"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={saveForLater}
                onChange={(e) => setSaveForLater(e.target.checked)}
              />
              <span className="text-sm">Save this card for next time</span>
            </label>
          </>
        )}

        {method === 'apple_pay' && (
          <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded p-6 mb-4 text-center">
            <p className="text-gray-700 mb-2">
              You will be redirected to Apple Pay to complete this transaction.
            </p>
            <p className="text-xs text-gray-500">(This is a simulated Apple Pay flow.)</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-300 text-red-700 px-3 py-2 rounded mb-3 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded font-bold text-white transition ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : method === 'apple_pay'
              ? 'bg-black hover:bg-gray-800'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading
            ? 'Processing...'
            : method === 'apple_pay'
            ? `Pay with Apple Pay $${booking.totalPrice}`
            : `Pay $${booking.totalPrice}`}
        </button>
      </form>

      <p className="text-xs text-gray-400 text-center mt-4">
        Demo mode &middot; No real charges are made
      </p>
    </div>
  );
};

export default PaymentForm;
