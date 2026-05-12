import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/notifications', {
        headers: { Authorization: `Bearer ${user.token}` }
      });

      const unread = res.data.filter(n => !n.isRead).length;
      setUnreadCount(unread);

    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
    }
  }, [user, fetchUnreadCount]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-gray-800 text-white p-4 flex justify-between items-center">
      <Link to="/" className="text-2xl font-bold">
        Laundry Booking Service
      </Link>

      <div className="flex items-center">
        {user ? (
          <>
            <Link to="/bookings" className="mr-4">
              HomeService
            </Link>

            <Link to="/my-bookings" className="mr-4">
              MyBooking
            </Link>

            <Link to="/payment-methods" className="mr-4">
              Payment Methods
            </Link>

            <Link to="/notifications" className="mr-4 relative">
              Notifications

              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                  {unreadCount}
                </span>
              )}
            </Link>

            <Link to="/profile" className="mr-4">
              MyProfile
            </Link>

            {user.role === 'admin' && (
              <Link to="/admin/bookings" className="mr-4">
                Admin
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="bg-red-500 px-4 py-2 rounded hover:bg-red-700"
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="mr-4">
              Login
            </Link>

            <Link
              to="/register"
              className="bg-green-500 px-4 py-2 rounded hover:bg-green-700"
            >
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;