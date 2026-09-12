const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./db/connect');
const productsRoute = require('./routes/productsRoute.js');
const authRoute = require('./routes/authRoute.js');
const cartRoute = require('./routes/cartRoute.js');

const app = express();

app.use(express.json());
app.use(cors());

// Security headers. crossOriginResourcePolicy is off so the React app
// on another port can still load the product images from /uploads.
app.use(helmet({ crossOriginResourcePolicy: false }));

// General limit: 100 requests per 15 minutes from the same IP.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Stricter limit on the login routes, to block password guessing.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  message: 'Too many authentication attempts, please try again later.'
});
app.use('/api/auth/signin', authLimiter);
app.use('/api/auth/signup', authLimiter);

// Product images are served as static files.
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/products', productsRoute);
app.use('/api/auth', authRoute);
app.use('/api/cart', cartRoute);

app.get('/', (req, res) => {
  res.send('<h2>DARINS HANDMADE API</h2>');
});

// One place for errors that were thrown outside a controller, so the client
// always gets JSON back (a failed image upload would return HTML otherwise).
app.use((err, req, res, next) => {
  if (err.name === 'MulterError') {
    const message =
      err.code === 'LIMIT_FILE_SIZE' ? 'Image is too large (max 8MB)' : 'Image upload failed';
    return res.status(400).send({ message });
  }
  if (err.message === 'Only image files are allowed') {
    return res.status(400).send({ message: err.message });
  }
  console.log(err.message);
  res.status(500).send({ message: 'Server error' });
});

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(process.env.PORT || 5000, () =>
      console.log('Masad netunim connected. Server is listening on port 5000...'));
  } catch (error) {
    console.log(error);
  }
};

start();
