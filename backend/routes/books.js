const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const multer = require("../middleware/multer-config");

const booksCtrl = require("../controllers/books");

router.get("/", booksCtrl.getAllBooks);
router.get("/bestrating", booksCtrl.getBooksByBestRating);
router.get("/:id", booksCtrl.getOneBooks);
router.post("/", auth, multer, booksCtrl.createBooks);
router.put("/:id", auth, multer, booksCtrl.modifyBooks);
router.delete("/:id", auth, booksCtrl.deleteBooks);
router.post("/:id/rating", auth, booksCtrl.rateBook);

module.exports = router;
