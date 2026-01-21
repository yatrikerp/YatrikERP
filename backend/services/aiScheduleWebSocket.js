// AI Schedule WebSocket Service
let ioInstance = null;

function initializeAIScheduleWebSocket(io) {
  ioInstance = io;
  console.log('✅ AI Schedule WebSocket server initialized');
  
  // Note: Connection handlers are already set up in server.js
  // This service just provides utility functions for emitting events
}

function emitAIProgress(jobId, progress) {
  if (ioInstance) {
    ioInstance.to(`ai-job-${jobId}`).emit('ai-schedule-progress', progress);
  }
}

function emitAIComplete(jobId, result) {
  if (ioInstance) {
    ioInstance.to(`ai-job-${jobId}`).emit('ai-schedule-complete', result);
  }
}

function emitAIError(jobId, error) {
  if (ioInstance) {
    ioInstance.to(`ai-job-${jobId}`).emit('ai-schedule-error', error);
  }
}

module.exports = {
  initializeAIScheduleWebSocket,
  emitAIProgress,
  emitAIComplete,
  emitAIError
};
