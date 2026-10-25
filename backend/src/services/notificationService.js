import Notification from '../models/Notification.js'

export const createNotification = (notification) => Notification.create(notification)

export default { createNotification }
