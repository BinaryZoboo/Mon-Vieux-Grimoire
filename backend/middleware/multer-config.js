const multer = require("multer");
const sharp = require("sharp");
const fs = require("fs").promises;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).single("image");

const processImage = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    const bookObject = JSON.parse(req.body.book);
    const name = bookObject.title.split(" ").join("_");
    const filename = name + Date.now() + ".webp";

    const buffer = await sharp(req.file.buffer)
      .resize(406, 564, {
        fit: "contain",
      })
      .toFormat("webp")
      .toBuffer();

    const imagePath = `images/${filename}`;
    await fs.mkdir("images", { recursive: true });

    await fs.writeFile(imagePath, buffer);

    req.file.filename = filename;
    next();
  } catch (error) {
    console.error("Error while processing image:", error);
    return res.status(500).json({ error: "Error while processing image." });
  }
};

module.exports = [upload, processImage];
