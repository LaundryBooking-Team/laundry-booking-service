import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/notifications', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setNotifications(res.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchNotifications();
  }, [user, fetchNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      await axios.patch(
        `http://localhost:5001/api/notifications/${id}/read`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setNotifications(notifications.map(n =>
        n._id === id ? { ...n, isRead: true } : n
      ));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(
        `http://localhost:5001/api/notifications/${id}`,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setNotifications(notifications.filter(n => n._id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  if (loading) return (
    <div className="p-6 text-center text-gray-500">
      Loading notifications...
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Notifications</h1>
      {notifications.length === 0 ? (
        <div className="text-center text-gray-500 py-10">
          No notifications yet
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map(notification => (
            <div
              key={notification._id}
              className="p-4 rounded-lg border bg-white border-gray-200"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {!notification.isRead && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full inline-block"></span>
                    )}
                    <p className={`${!notification.isRead ? 'font-semibold' : ''} text-gray-800`}>
                      {notification.message}
                    </p>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  {!notification.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(notification._id)}
                      className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-700"
                    >
                      Mark as read
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(notification._id)}
                    className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;