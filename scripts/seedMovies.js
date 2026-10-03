require('dotenv').config();

const database = require('../config/database');
const movieModel = require('../models/movieModel');

async function seedMovies() {
  try {
    const insertedCount = await movieModel.seedInitialMovies();
    console.log(`Đã thêm ${insertedCount} phim mẫu vào database movie.`);
  } catch (error) {
    console.error('Không thể nhập dữ liệu phim mẫu:', error);
    process.exitCode = 1;
  } finally {
    await database.end();
  }
}

seedMovies();
