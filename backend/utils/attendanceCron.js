const cron = require('node-cron');
const axios = require('axios');

// Schedule task to run every day at midnight (00:00)
// Cron format: second minute hour day month dayOfWeek
const scheduleAutoMarkAbsent = () => {
  // Run at 00:01 AM every day (1 minute past midnight to ensure day has fully ended)
  cron.schedule('1 0 * * *', async () => {
    try {
      console.log('Running auto-mark-absent cron job...');
      
      const apiUrl = process.env.API_BASE_URL || 'http://localhost:4002/api';
      const response = await axios.post(`${apiUrl}/attendance/auto-mark-absent`);
      
      console.log('Auto-mark-absent completed:', response.data);
    } catch (error) {
      console.error('Error in auto-mark-absent cron job:', error.message);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata" // Set to your timezone
  });

  console.log('✓ Attendance auto-mark cron job scheduled (runs daily at 00:01 AM)');
};

module.exports = { scheduleAutoMarkAbsent };
