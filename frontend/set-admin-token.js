// Set admin token in localStorage for testing
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGFhYTI2NDU2YTdmMWFlMDJjMjMxNjYiLCJyb2xlIjoiYWRtaW4iLCJlbWFpbCI6ImFkbWluQHlhdHJpay5jb20iLCJpYXQiOjE3NTcxNDA4NzMsImV4cCI6MTc1NzIyNzI3M30.QfXqzGItmAISrftw8SVvZYntvZ8npNJdz-AVyQBfCmo';

if (typeof window !== 'undefined') {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify({
    _id: '68aaa26456a7f1ae02c23166',
    name: 'Admin User',
    email: 'admin@yatrik.com',
    role: 'admin'
  }));
  console.log('✅ Admin token set in localStorage');
  console.log('Token:', token);
} else {
  console.log('Run this in browser console');
}
