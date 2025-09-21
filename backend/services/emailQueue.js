const { sendEmail } = require('../config/email');

// Simple in-memory email queue for better performance
class EmailQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5 seconds
  }

  // Add email to queue
  enqueue(emailData) {
    this.queue.push({
      ...emailData,
      retries: 0,
      addedAt: new Date()
    });
    
    // Process queue if not already processing
    if (!this.processing) {
      this.processQueue();
    }
  }

  // Process the email queue
  async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    console.log(`📧 Processing email queue: ${this.queue.length} emails pending`);

    while (this.queue.length > 0) {
      const emailData = this.queue.shift();
      
      try {
        await this.sendEmailWithRetry(emailData);
      } catch (error) {
        console.error('❌ Failed to process email from queue:', error);
      }
    }

    this.processing = false;
    console.log('✅ Email queue processing completed');
  }

  // Send email with retry logic
  async sendEmailWithRetry(emailData) {
    const { to, template, data, retries } = emailData;
    
    try {
      const result = await sendEmail(to, template, data);
      
      if (result.success) {
        console.log(`✅ Email sent successfully: ${to} (${template})`);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error(`❌ Email send failed (attempt ${retries + 1}):`, error.message);
      
      // Retry if we haven't exceeded max retries
      if (retries < this.maxRetries) {
        emailData.retries = retries + 1;
        emailData.retryAt = new Date(Date.now() + this.retryDelay);
        
        // Add back to queue with delay
        setTimeout(() => {
          this.queue.unshift(emailData);
          this.processQueue();
        }, this.retryDelay);
      } else {
        console.error(`❌ Email permanently failed after ${this.maxRetries} retries: ${to}`);
      }
    }
  }

  // Get queue status
  getStatus() {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      pendingEmails: this.queue.map(email => ({
        to: email.to,
        template: email.template,
        retries: email.retries,
        addedAt: email.addedAt
      }))
    };
  }

  // Clear queue (for testing)
  clear() {
    this.queue = [];
    this.processing = false;
  }
}

// Create singleton instance
const emailQueue = new EmailQueue();

// Export functions for easy use
const queueEmail = (to, template, data) => {
  emailQueue.enqueue({ to, template, data });
};

const getEmailQueueStatus = () => {
  return emailQueue.getStatus();
};

const clearEmailQueue = () => {
  emailQueue.clear();
};

module.exports = {
  queueEmail,
  getEmailQueueStatus,
  clearEmailQueue,
  emailQueue
};
