const books = require("../models/books");
const Books = require("../models/books");
const fs = require("fs");

exports.createBooks = (req, res, next) => {
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

  book
    .save()
    .then(() => {
      res.status(201).json({ message: "Objet enregistré !" });
    })
    .catch((error) => {
      res.status(400).json({ error: error });
    });
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

exports.modifyBooks = (req, res, next) => {
  const bookObject = req.file
    ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get("host")}/images/${
          req.file.filename
        }`,
      }
    : { ...req.body };

  delete bookObject._userId;
  Books.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId != req.auth.userId) {
        res.status(401).json({ message: "Not authorized" });
      } else {
        Books.updateOne(
          { _id: req.params.id },
          { ...bookObject, _id: req.params.id }
        )
          .then(() => res.status(200).json({ message: "Objet modifié!" }))
          .catch((error) => res.status(401).json({ error }));
      }
    })
    .catch((error) => {
      res.status(400).json({ error });
    });
};

exports.deleteBooks = (req, res, next) => {
  Books.findOne({ _id: req.params.id })
    .then((book) => {
      if (book.userId != req.auth.userId) {
        res.status(401).json({ message: "Not authorized" });
      } else {
        const filename = book.imageUrl.split("/images/")[1];
        fs.unlink(`images/${filename}`, () => {
          book
            .deleteOne({ _id: req.params.id })
            .then(() => {
              res.status(200).json({ message: "Objet supprimé !" });
            })
            .catch((error) => res.status(401).json({ error }));
        });
      }
    })
    .catch((error) => {
      res.status(500).json({ error });
    });
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
        console.log(allRatings);
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
