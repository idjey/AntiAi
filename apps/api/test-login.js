const http = require('http');

const data = JSON.stringify({
  email: 'djkanjaria@gmail.com',
  password: 'wrongpassword' // just to see what error we get first
});

const req = http.request('http://localhost:4000/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('Response:', res.statusCode, body));
});

req.on('error', console.error);
req.write(data);
req.end();
