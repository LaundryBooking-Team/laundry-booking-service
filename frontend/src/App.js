import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Bookings from './pages/bookings';
import MyBooking from './pages/MyBooking';
import AdminBooking from './pages/AdminBooking';
import bgImage from './images/background.png';

import Notifications from './pages/Notifications';

function App() {
  return (

    
   <div
      style={{
        minHeight: '100vh',
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* overlay white 80% */}
      <div style={{ minHeight: '100vh', backgroundColor: 'rgba(255,255,255,0.8)' }}>
    



    <Router>
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/my-bookings" element={<MyBooking />} />
        <Route path="/admin/bookings" element={<AdminBooking />} />
        <Route path="/notifications" element={<Notifications />} />
      </Routes>
    </Router>
</div>
</div>



  );
}

export default App;
