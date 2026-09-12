const dotenv = require('dotenv');
const connectDB = require('../db/connect');
const Product = require('../models/productModel.js');
const products = require('./productsData.json');

dotenv.config();

const start = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    await Product.deleteMany();
    await Product.insertMany(products);
    console.log('Seed done');
    process.exit(0);
  } catch (error) {
    console.log(error.message);
    process.exit(1);
  }
};

start();