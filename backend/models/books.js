const mongoose = require("mongoose");

const ratingSchema = new mongoose.Schema({
  _id: false,
  userId: { type: String, required: true },
  grade: { type: Number, required: true, min: 1 },
});

const booksSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  author: { type: String, required: true },
  imageUrl: { type: String, required: true },
  year: { type: Number, required: true },
  genre: { type: String, required: true },
  ratings: { type: [ratingSchema], default: [] },
  averageRating: { type: Number },
});

module.exports = mongoose.model("book", booksSchema);
