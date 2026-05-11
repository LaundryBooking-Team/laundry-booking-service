import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-gray-800 text-white p-4 flex justify-between items-center">
      <Link to="/" className="text-2xl font-bold">Laundry Booking Service</Link>
      <div>
        {user ? (
          <>
            <Link to="/bookings" className="mr-4">HomeService</Link>
            <Link to="/my-bookings" className="mr-4">MyBooking</Link>
            <Link to="/payment-methods" className="mr-4">Payment Methods</Link>
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
