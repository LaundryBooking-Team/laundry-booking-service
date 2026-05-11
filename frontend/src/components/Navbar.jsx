import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread notification count
  const fetchUnreadCount = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/notifications', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const unread = res.data.filter(n => !n.isRead).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    if (user) fetchUnreadCount();
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-gray-800 text-white p-4 flex justify-between items-center">
      <Link to="/" className="text-2xl font-bold">Laundry Booking Service</Link>
      <div className="flex items-center">
        {user ? (
          <>
            <Link to="/bookings" className="mr-4">HomeService</Link>
            <Link to="/my-bookings" className="mr-4">MyBooking</Link>
            <Link to="/notifications" className="mr-4">Notifications</Link>
            <Link to="/profile" className="mr-4">MyProfile</Link>

            {user.role === 'admin' && (
              <Link to="/admin/bookings" className="mr-4">Admin</Link>
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
            <Link to="/login" className="mr-4">Login</Link>
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