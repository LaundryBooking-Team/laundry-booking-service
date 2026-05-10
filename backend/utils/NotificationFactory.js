class NotificationFactory {
  static create(type, userId, bookingId, status) {
    if (type === 'booking_update') {
      return {
        userId,
        bookingId,
        message: `Your booking status has been updated to: ${status}`,
        isRead: false
      };
    }
    if (type === 'system') {
      return {
        userId,
        message: 'System: Thank you for using Laundry Booking Service',
        isRead: false
      };
    }
    throw new Error('Unknown notification type');
  }
}

module.exports = NotificationFactory;