const db = require("../db");
const axios = require("axios");

const fetchBooks = async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: "Query parameter is required" });
  }

  const url = `https://api.multisearch.io/?id=11908&lang=uk&m=1733494637235&q=j62y3a&query=${encodeURIComponent(query)}&s=mini&uid=a453fa16-f538-4e66-9074-4faa88847dc8`;

  try {
    const { data } = await axios.get(url);

    if (!data.results || !data.results.item_groups) {
      return res.status(404).json({ error: "No books found" });
    }

    // Використовуємо Map для фільтрації унікальних книг
    const booksMap = new Map();

    for (const group of data.results.item_groups) {
      for (const item of group.items) {
        const book = {
          id_book: item.id,
          oldprice: item.oldprice || null,
          name: item.name,
          picture: item.picture,
          brand: item.brand,
          price: item.price,
          is_presence: item.is_presence,
        };

        // Додаємо унікальні книги до Map (ключ - id_book)
        booksMap.set(book.id_book, book);
      }
    }

    // Отримуємо унікальні книги з Map
    const uniqueBooks = Array.from(booksMap.values());
    const savedBooks = [];

    for (const book of uniqueBooks) {
      const result = await db.query(
        `INSERT INTO books (id_book, oldprice, name, picture, brand, price, is_presence, num_add)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id_book) 
         DO UPDATE SET is_presence = EXCLUDED.is_presence 
         RETURNING id`,
        [
          book.id_book,
          book.oldprice,
          book.name,
          book.picture,
          book.brand,
          book.price,
          book.is_presence,
          "0",
        ]
      );

      // Додаємо ID із бази в об'єкт книги
      book.id = result.rows[0].id;
      savedBooks.push(book);
    }

    return res.status(200).json({
      message: "Books saved successfully",
      savedBooks,
    });
  } catch (error) {
    console.error("Error fetching or saving books:", error.message);
    return res.status(500).json({ error: "Failed to fetch or save books" });
  }
};


const getAllBooks = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, author, price, picture, oldprice, brand, is_presence FROM books`
    );

    if (result.rowCount > 0) {
      res.status(200).json({ books: result.rows });
    } else {
      res.status(404).json({ message: "Error!" });
    }
  } catch (error) {
    console.error("Error getting all books:", error);
    res.status(500).json({ error: "Error getting all books" });
  }
};

const addBookToLibrary = async (req, res) => {
  const { user_id, book_id } = req.body;
  try {
     const result = await db.query(
      `INSERT INTO user_library (book_id, user_id) VALUES ($1, $2)`,
      [book_id, user_id]
    );

    // Оновлюємо num_add у таблиці books
    await db.query(
      `UPDATE books SET num_add = num_add + 1 WHERE id_book = $1`,
      [book_id]
    );
    res.status(200).json({ library: result.rows });
  } catch (error) {
    console.error("Error adding book to library", error);
    res.status(500).json({ error: "Error adding book to library" });
  }
};

const getLibrary = async (req, res) => {
  const { user_id } = req.body;
  try {
    const result = await db.query(
      `SELECT * FROM user_library WHERE user_id = $1`,
      [user_id]
    );
    res.status(200).json({ library: result.rows });
  } catch (error) {
    console.error("Error fetching library:", error);
    res.status(500).json({ error: "Error fetching library" });
  }
};

module.exports = {
  fetchBooks,
  getAllBooks,
  addBookToLibrary,
  getLibrary,
};
