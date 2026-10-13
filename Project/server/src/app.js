
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const apiRoutes = require('./routes');
const {
  errorHandler,
  notFoundHandler
} = require('./middleware/errorHandler');

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://intelli-search-zeta.vercel.app',
  ...(process.env.CLIENT_URL
    ? [process.env.CLIENT_URL.replace(/\/$/, '')]
    : [])
];

app.use(helmet());

app.use(cors({
  origin: (origin, callback) => {
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      process.env.NODE_ENV !== 'production'
    ) {
      return callback(null, true);
    }

    return callback(new Error('Blocked by CORS policy'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-admin-key'
  ]
}));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use('/api', apiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
