import { useEffect, useState } from 'react';
import axiosInstance from '../axiosConfig';
import { useAuth } from '../context/AuthContext';

const brandColor = {
  Visa: 'bg-blue-600',
  Mastercard: 'bg-red-500',
  Amex: 'bg-indigo-500',
  Other: 'bg-gray-500'
};

const PaymentMethodSettings = () => {
  const { user } = useAuth();
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  // New card form state
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [nickname, setNickname] = useState('');
  const [setAsDefault, setSetAsDefault] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const authHeader = { headers: { Authorization: `Bearer ${user.token}` } };

  const fetchMethods = async () => {
    try {
      const res = await axiosInstance.get('/api/payment-methods', authHeader);
      setMethods(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) fetchMethods();
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

  const handleAdd = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await axiosInstance.post(
        '/api/payment-methods',
        {
          cardNumber: cardNumber.replace(/\s/g, ''),
          expiry,
          cvv,
          cardholderName,
          nickname,
          setAsDefault
        },
        authHeader
      );
      // reset
      setCardNumber('');
      setExpiry('');
      setCvv('');
      setCardholderName('');
      setNickname('');
      setSetAsDefault(false);
      setShowAdd(false);
      fetchMethods();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add card');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this saved card?')) return;
    try {
      await axiosInstance.delete(`/api/payment-methods/${id}`, authHeader);
      fetchMethods();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await axiosInstance.put(`/api/payment-methods/${id}/default`, {}, authHeader);
      fetchMethods();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to set default');
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold mb-6">Payment Methods</h1>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className={showAdd
            ? 'border border-red-500 text-red-500 px-4 py-2 rounded hover:bg-red-50'
            : 'bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700'
          }
        >
          {showAdd ? 'Cancel' : 'Add New Card'}
        </button>
      </div>

      {/* Add card form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="p-4 rounded-lg border bg-white border-gray-200 mb-6">
          <h2 className="text-xl font-semibold mb-4">Add a new card</h2>

          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Cardholder Name</label>
            <input
              type="text"
              value={cardholderName}
              onChange={(e) => setCardholderName(e.target.value)}
              placeholder="Full Name"
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
              placeholder="•••• •••• •••• ••••"
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
                placeholder="•••"
                required
                className="w-full border rounded px-3 py-2 font-mono"
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Nickname (optional)</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. Personal Visa"
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <label className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              checked={setAsDefault}
              onChange={(e) => setSetAsDefault(e.target.checked)}
            />
            <span className="text-sm">Set as default payment method</span>
          </label>

          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 px-3 py-2 rounded mb-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className={`w-full py-3 rounded text-white ${
              saving ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {saving ? 'Saving...' : 'Save Card'}
          </button>
        </form>
      )}

      {/* Cards list */}
      {loading ? (
        <p>Loading...</p>
      ) : methods.length === 0 ? (
        <div className="text-center text-gray-500 py-10">
          No saved payment methods yet
        </div>
      ) : (
        <div className="space-y-3">
          {methods.map((m) => (
            <div
              key={m._id}
              className="p-4 rounded-lg border bg-white border-gray-200 mb-6 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div>
                  <p className="font-mono text-lg">•••• •••• •••• {m.last4}</p>
                  <p className="text-sm text-gray-500">
                    Exp {String(m.expMonth).padStart(2, '0')}/{String(m.expYear).slice(-2)}
                    {m.cardholderName && ` • ${m.cardholderName}`}
                  </p>
                  {m.nickname && <p className="text-xs text-gray-400">{m.nickname}</p>}
                </div>
                {m.isDefault && (
                  <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded font-semibold">
                    Default
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {!m.isDefault && (
                  <button
                    onClick={() => handleSetDefault(m._id)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Set default
                  </button>
                )}
                <button
                  onClick={() => handleDelete(m._id)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400 text-center mt-6">
        Only last 4 digits are stored. CVV and full card number are never saved.
      </p>
    </div>
  );
};

export default PaymentMethodSettings;
