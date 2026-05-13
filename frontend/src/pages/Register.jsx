import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosConfig';

const Register = () => {
  const [formData, setFormData] = useState({ firstName: '', lastName: '', username: '', email: '', password: '', mobileNumber:'' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/api/auth/register', formData);
      alert('Registration successful. Please log in.');
      navigate('/login');
    } //catch (error) {
    //   alert('Registration failed. Please try again.');
    // }
    catch (error) {
        console.error('REGISTER ERROR:', error);
        console.error('RESPONSE DATA:', error.response?.data);
        alert(error.response?.data?.message || 'Registration failed. Please try again.');
      }
    };

    return (
      <div className="max-w-md mx-auto mt-20">
        <form onSubmit={handleSubmit} className="p-4 rounded-lg border bg-white border-gray-200">
          <h1 className="text-2xl font-bold mb-4 text-center">Register</h1>


          <input
            type="text"
            name="firstName"
            placeholder="First Name"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            className="w-full mb-4 p-2 border rounded"
          />

          <input
            type="text"
            name="lastName"
            placeholder="Last Name"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            className="w-full mb-4 p-2 border rounded"
          />

          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            className="w-full mb-4 p-2 border rounded"
          />

          <input
            type="text"
            name='mobileNumber'
            placeholder="Mobile Number"
            value={formData.mobileNumber}
            onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
            className="w-full mb-4 p-2 border rounded"
          />

          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full mb-4 p-2 border rounded"
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full mb-4 p-2 border rounded"
          />



          <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">
            Register
          </button>
        </form>
      </div>
    );
  };

  export default Register;
