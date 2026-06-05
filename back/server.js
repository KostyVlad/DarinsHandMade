require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const connectDB = require('./config/db');
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');

// 1. Импортируем маршруты корзины (убедись, что файл routes/cartRoutes.js существует!)
const cartRoutes = require('./routes/cartRoutes');

const app = express();

// CORS должен стоять до всех маршрутов (он разрешает браузеру делать запросы)
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);

// 2. Подключаем корзину по нужному адресу
app.use('/api/cart', cartRoutes);

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    app.listen(process.env.PORT || 5000, () => {
      console.log('Server running on port 5000...');
    });
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

start();