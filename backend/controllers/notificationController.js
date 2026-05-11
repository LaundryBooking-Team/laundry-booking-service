const Notification = require('../models/Notification');
const NotificationFactory = require('../utils/NotificationFactory');

// GET all notifications for logged-in user
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ 
      userId: req.user.id 
    }).sort({ createdAt: -1 });
    
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PATCH mark a notification as read
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Make sure the notification belongs to the logged-in user
    if (notification.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorised' });
    }

    notification.isRead = true;
    await notification.save();
    
    res.status(200).json({ message: 'Notification marked as read', notification });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// DELETE a notification
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    // Make sure the notification belongs to the logged-in user
    if (notification.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorised' });
    }

    await notification.deleteOne();
    
    res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getNotifications, markAsRead, deleteNotification };