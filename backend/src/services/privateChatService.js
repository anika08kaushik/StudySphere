// Phase 9: lets REST controllers push live socket events using the shared
// Socket.IO server (same pattern as notificationService/activityService).
let ioInstance = null

export const setPrivateChatIo = (io) => {
  ioInstance = io
}

export const getPrivateChatIo = () => ioInstance

export default { setPrivateChatIo, getPrivateChatIo }
