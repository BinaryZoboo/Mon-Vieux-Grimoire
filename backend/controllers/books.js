const Books = require("../models/books");
const path = require("path");
const fs = require("fs").promises;

exports.createBooks = async (req, res, next) => {
  try {
    const bookObject = JSON.parse(req.body.book);
    delete bookObject._id;
    delete bookObject._userId;
    const book = new Books({
      ...bookObject,
      userId: req.auth.userId,
      imageUrl: `${req.protocol}://${req.get("host")}/images/${
        req.file.filename
      }`,
    });
    await book.save();
    res.status(201).json(book);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getOneBooks = (req, res, next) => {
  Books.findOne({
    _id: req.params.id,
  })
    .then((book) => {
      res.status(200).json(book);
    })
    .catch((error) => {
      res.status(404).json({
        error: error,
      });
    });
};

exports.modifyBooks = async (req, res, next) => {
  try {
    let bookObject;
    if (!req.file) {
      bookObject = req.body;
    } else {
      bookObject = {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${
          req.file.filename
        }`,
      };
    }

    delete bookObject._userId;

    const book = await Books.findOne({ _id: req.params.id });
    if (!book) {
      return res.status(404).json({ message: "404: book not found" });
    }

    if (book.userId !== req.auth.userId) {
      return res.status(403).json({ message: "403: unauthorized request" });
    }
    if (req.file && book.imageUrl) {
      const filename = book.imageUrl.split("/images/")[1];
      await fs.unlink(`images/${filename}`);
    }
    await Books.updateOne(
      { _id: req.params.id },
      { ...bookObject, _id: req.params.id }
    );

    res.status(200).json({ message: "Objet modifié!" });
  } catch (error) {
    console.error("Error during book modification:", error);
    res.status(400).json({ error: error.message });
  }
};

exports.deleteBooks = async (req, res, next) => {
  try {
    const book = await Books.findOne({ _id: req.params.id });

    if (!book) {
      return res.status(404).json({ message: "Book not found!" });
    }

    if (book.userId != req.auth.userId) {
      return res.status(403).json({ message: "403: unauthorized request" });
    }
    if (book.imageUrl) {
      const filename = book.imageUrl.split("/images/")[1];
      const imagePath = path.join("images", filename);

      try {
        await fs.unlink(imagePath);
      } catch (err) {
        console.error("Erreur lors de la suppression de l'image :", err);
      }
    }

    await book.deleteOne({ _id: req.params.id });

    res.status(200).json({ message: "Livre supprimé avec succès !" });
  } catch (error) {
    console.error("Erreur lors de la suppression du livre :", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getAllBooks = (req, res, next) => {
  Books.find()
    .then((books) => {
      res.status(200).json(books);
    })
    .catch((error) => {
      res.status(400).json({ error: error });
    });
};

exports.getBooksByBestRating = (req, res, next) => {
  Books.find()
    .sort({ averageRating: -1 })
    .limit(3)
    .then((books) => {
      res.status(200).json(books);
    })
    .catch((error) => {
      res.status(400).json({ error: error });
    });
};

exports.rateBook = (req, res, next) => {
  const { userId, rating } = req.body;

  if (rating === undefined || rating < 0 || rating > 5) {
    return res
      .status(400)
      .json({ message: "Invalid rating. Must be between 0 and 5." });
  }

  Books.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ message: "Book not found!" });
      }

      const existingRating = book.ratings.find(
        (rating) => rating.userId === userId
      );

      if (existingRating) {
        return res
          .status(400)
          .json({ message: "User has already rated this book." });
      }
      const grade = rating;

      book.ratings.push({ userId, grade });
      if (book.ratings.length > 0) {
        const allRatings = book.ratings.map((rating) => rating.grade);
        const moyenne =
          allRatings.reduce((sum, rate) => sum + rate, 0) / allRatings.length;
        book.averageRating = moyenne;
      } else {
        book.averageRating = 0;
      }
      book
        .save()
        .then(() => {
          res.status(200).json(book);
        })
        .catch((error) => res.status(400).json({ error: error }));
    })
    .catch((error) => res.status(500).json({ error: error }));
};
