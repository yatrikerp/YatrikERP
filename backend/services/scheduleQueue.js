// Schedule Queue WebSocket Service
let ioInstance = null;

function setWebSocketServer(io) {
  ioInstance = io;
  console.log('✅ Schedule Queue WebSocket server initialized');
}

function getWebSocketServer() {
  return ioInstance;
}

function emitScheduleUpdate(jobId, data) {
  if (ioInstance) {
    ioInstance.to(`job-${jobId}`).emit('schedule-update', data);
  }
}

module.exports = {
  setWebSocketServer,
  getWebSocketServer,
  emitScheduleUpdate
};
