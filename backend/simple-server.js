const express = require('express');
const app = express();

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    message: 'Simple server is running'
  });
});

app.get('/api/test', (req, res) => {
  res.json({
    message: 'Test endpoint working',
    buses: [
      { id: 1, busNumber: 'BUS001', status: 'active' },
      { id: 2, busNumber: 'BUS002', status: 'inactive' }
    ]
  });
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Simple server running on port ${PORT}`);
  console.log(`Health endpoint: http://localhost:${PORT}/api/health`);
});
