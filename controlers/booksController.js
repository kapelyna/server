const db = require("../db");
const axios = require("axios");

const fetchBooks = async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: "Query parameter is required" });
  }

  const searchUrl = `https://api.multisearch.io/?id=11908&lang=uk&m=1733494637235&q=j62y3a&query=${encodeURIComponent(
    query
  )}&s=mini&uid=a453fa16-f538-4e66-9074-4faa88847dc8`;

  try {
    const { data } = await axios.get(searchUrl);

    if (!data.results || !data.results.item_groups) {
      return res.status(404).json({ error: "No books found" });
    }

    const booksMap = new Map();

    for (const group of data.results.item_groups) {
      for (const item of group.items) {
        if (!item.name) continue; // ❗️Пропустити, якщо нема назви
    
        booksMap.set(item.id, {
          id_book: item.id,
          oldprice: item.oldprice || null,
          name: item.name,
          picture: item.picture,
          brand: item.brand,
          price: item.price,
          is_presence: item.is_presence,
          author: null,
        });
      }
    }

    const uniqueBooks = Array.from(booksMap.values());

    // 🔹 Отримання авторів через Google Books API
    for (const book of uniqueBooks) {
      if (!book.name) continue; // Пропускаємо книги без назви
    
      const googleBooksUrl = `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(book.name)}&maxResults=1`;
    
      try {
        const googleResponse = await axios.get(googleBooksUrl);
        const googleData = googleResponse.data;
    
        if (googleData.items && googleData.items.length > 0) {
          const volumeInfo = googleData.items[0].volumeInfo;
    
          book.author =
            volumeInfo.authors && volumeInfo.authors.length > 0
              ? volumeInfo.authors.join(", ")
              : "Невідомий автор";
        }
      } catch (error) {
        console.error(
          `Помилка отримання автора для книги "${book.name}":`,
          error.message
        );
      }
    }

    // 🔹 Додавання книг у базу
    const savedBooks = [];

    for (const book of uniqueBooks) {
      const result = await db.query(
        `INSERT INTO books (id_book, oldprice, name, picture, brand, price, is_presence, author, num_add)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id_book) 
         DO UPDATE SET 
            oldprice = EXCLUDED.oldprice, 
            name = EXCLUDED.name, 
            picture = EXCLUDED.picture,
            brand = EXCLUDED.brand, 
            price = EXCLUDED.price, 
            is_presence = EXCLUDED.is_presence,
            author = EXCLUDED.author
         RETURNING id`,
        [
          book.id_book,
          book.oldprice,
          book.name,
          book.picture,
          book.brand,
          book.price,
          book.is_presence,
          book.author,
          "0",
        ]
      );

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

const addBook = async (req, res)=>{
 const {name, author, price, picture, oldprice, brand, id_book, is_presence, num_page } = req.body;
 try {
  const result = await db.query(
    `INSERT INTO books (name, author, price, picture, oldprice, brand, id_book, is_presence,num_page, num_add)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, '0')`,
    [name, author, price, picture, oldprice, brand, id_book, is_presence, num_page]
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
}

const getAllBooks = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, author, price, picture, oldprice, brand, is_presence, num_add FROM books`
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

const getBook = async (req, res) => {
  const { book_id } = req.body;
  try {
    const result = await db.query(
      `SELECT id, name, author, picture, num_page, brand FROM books WHERE id=$1`,
      [book_id]
    );

    if (result.rowCount > 0) {
      res.status(200).json({ books: result.rows });
    } else {
      res.status(404).json({ message: "Error!" });
    }
  } catch (error) {
    console.error("Error getting book:", error);
    res.status(500).json({ error: "Error getting book" });
  }
};

const editBook = async (req, res) => {
  const { name, author, price, brand, id, num_page } = req.body;
  
  //console.log("Оновлення книги з ID:", id); // Додайте лог перед запитом до БД

  try {
    const result = await db.query(
      `UPDATE books 
       SET name = $1, author = $2, price = $3, brand = $4, num_page=$5
       WHERE id = $6 RETURNING *`,
      [name, author, price, brand, num_page, id]
    );

    //console.log("Результат запиту:", result); // Лог результату запиту

    if (result.rowCount > 0) {
      res.status(200).json(result.rows);
    } else {
      res.status(404).json({ message: "Book not found" });
    }
  } catch (error) {
    console.error("Error updating book:", error);
    res.status(500).json({ error: "Error updating book" });
  }
};




const addBookToLibrary = async (req, res) => {
  const { user_id, book_id } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO user_library (book_id, user_id) 
       VALUES ($1, $2) 
       ON CONFLICT (book_id, user_id) 
       DO NOTHING`,
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
      `SELECT book_id FROM user_library WHERE user_id = $1`,
      [user_id]
    );

    res.status(200).json({ library: result.rows });
  } catch (error) {
    console.error("Error fetching library:", error);
    res.status(500).json({ error: "Error fetching library" });
  }
};

const updateBook = async (req, res) => {
  const { book_id, num_page } = req.body; // Отримання ідентифікатора книги та кількості сторінок

  try {
    const result = await db.query(
      `UPDATE books SET num_page = $1 WHERE id = $2 RETURNING *`,
      [num_page, book_id]
    );

    res.status(200).json({ book: result.rows[0] });
  } catch (error) {
    console.error("Error update book:", error);
    res.status(500).json({ error: "Error update book" });
  }
};

const deleteBook = async(req,res)=>{
  const {book_id} = req.body;
  try{
    const result = await db.query(
      `DELETE from books where id = $1`,
      [book_id]
    )
    res.status(200).json({ book: result.rows[0] });
  }
  catch (error) {
    console.error("Error delete book:", error);
    res.status(500).json({ error: "Error delete book" });
  }
}
const deleteBookFromLibrary = async(req,res)=>{
  const {book_id} = req.body;
  try{
    const result = await db.query(
      `DELETE from user_library where book_id = $1`,
      [book_id]
    )
    res.status(200).json({ library: result.rows });
  }
  catch (error) {
    console.error("Error delete book:", error);
    res.status(500).json({ error: "Error delete book" });
  }
}

const getUserCalendar = async (req, res) => {
  const { userId } = req.body;

  try {
    const result = await db.query(
      `SELECT c.id, c.user_id, c.book_id, c.end_date, 
              b.name AS book_name, b.author AS author, 
              r.rating
       FROM book_calendar c
       JOIN books b ON c.book_id = b.id
       LEFT JOIN review r ON b.id = r.book_id
       WHERE c.user_id = $1`,
      [userId]
    );
    res.status(200).json({ calendar: result.rows });
  } catch (error) {
    console.error("Error getting user calendar:", error);
    res.status(500).json({ error: "Error getting user calendar" });
  }
};


module.exports = {
  fetchBooks,
  getAllBooks,
  addBookToLibrary,
  getLibrary,
  getBook,
  updateBook,
  deleteBook,
  deleteBookFromLibrary,
  editBook,
  addBook,
  getUserCalendar
};

