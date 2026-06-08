require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');


const helmet = require('helmet');
const rateLimit = require('express-rate-limit');


const connectDB = require('./config/db');
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const cartRoutes = require('./routes/cartRoutes');

const app = express();

app.use(cors());
app.use(express.json());


app.use(helmet({
  crossOriginResourcePolicy: false,
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later."
});
app.use('/api/', limiter);


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);


const start = async () => {
  try {

    await connectDB(process.env.MONGO_URI);


    app.listen(process.env.PORT || 5000, () => {
      console.log(`Server running on port ${process.env.PORT || 5000}...`);
      console.log('Security protocols: ACTIVE 🛡️');
    });
  } catch (error) {
    console.log('Database connection error:', error);
    process.exit(1);
  }
};

start();