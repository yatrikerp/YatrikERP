const AutoScheduler = require('./autoScheduler');
const cron = require('node-cron');

class ContinuousScheduler {
  constructor() {
    this.isRunning = false;
    this.job = null;
    this.interval = 5; // Run every 5 minutes by default
  }

  /**
   * Start the continuous scheduler
   */
  start() {
    if (this.isRunning) {
      console.log('🚀 Continuous scheduler is already running');
      return;
    }

    console.log(`🚀 Starting continuous scheduler (runs every ${this.interval} minutes)`);

    // Run every N minutes using cron
    this.job = cron.schedule(`*/${this.interval} * * * *`, async () => {
      await this.runScheduling();
    }, {
      scheduled: false
    });

    this.job.start();
    this.isRunning = true;

    // Run immediately on startup
    this.runScheduling();

    console.log('✅ Continuous scheduler started successfully');
  }

  /**
   * Stop the continuous scheduler
   */
  stop() {
    if (this.job) {
      this.job.stop();
      this.isRunning = false;
      console.log('🛑 Continuous scheduler stopped');
    }
  }

  /**
   * Run the scheduling process
   */
  async runScheduling() {
    try {
      console.log('🔄 Running continuous auto-scheduling...');

      const results = await AutoScheduler.runContinuousScheduling();

      console.log(`✅ Continuous scheduling completed: ${results.scheduledBuses}/${results.totalBuses} buses scheduled, ${results.totalTrips} trips created`);

      return results;

    } catch (error) {
      console.error('❌ Continuous scheduling failed:', error);
      // Continue running even if one cycle fails
    }
  }

  /**
   * Update the scheduling interval
   */
  setInterval(minutes) {
    this.interval = minutes;

    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      interval: this.interval,
      nextRun: this.job ? new Date(this.job.scheduledJobs[0]?.nextDate()) : null
    };
  }
}

// Create and export singleton instance
const continuousScheduler = new ContinuousScheduler();

module.exports = continuousScheduler;
