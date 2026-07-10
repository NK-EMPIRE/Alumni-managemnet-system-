const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const token = jwt.sign(
  { userId: 19, email: 'ert@gmail.com', role: 'LEADER' },
  process.env.JWT_SECRET,
  { expiresIn: '8h' }
);
console.log("TOKEN:" + token);
console.log("USER:" + JSON.stringify({ userId: 19, first_name: 'ert', email: 'ert@gmail.com', role: 'LEADER' }));
