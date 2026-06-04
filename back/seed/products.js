const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('../models/productModel');
const products = require('./productsData.json'); // ваш JSON

dotenv.config();

const start = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await Product.deleteMany();
    await Product.insertMany(products);
    console.log('Seed done');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();