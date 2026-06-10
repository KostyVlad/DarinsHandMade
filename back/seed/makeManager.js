const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/userModel');

dotenv.config();

const start = async () => {
  const email = process.argv[2];
  const role = process.argv[3] || 'manager';

  if (!email) {
    console.error('Укажи email:  node seed/makeManager.js user@example.com');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOneAndUpdate({ email }, { role }, { new: true });
    if (!user) {
      console.error(`Пользователь с email "${email}" не найден. Сначала зарегистрируйся этим email.`);
      process.exit(1);
    }
    console.log(`Готово: ${user.email} теперь role="${user.role}"`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
