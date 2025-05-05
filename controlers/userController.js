const db = require("../db");
const axios = require("axios");
const bcrypt = require("bcrypt");

// --- Пошук користувача (Логін) ---
const findUserByEmail = async (req, res) => {
  // Перевіряємо чи email існує і є рядком перед toLowerCase()
  if (!req.body.email || typeof req.body.email !== 'string') {
     return res.status(400).json({ message: "Email is required and must be a string" });
  }
  
  const lowerCaseEmail = req.body.email.toLowerCase(); // Перетворюємо email на нижній регістр
  const { password } = req.body;

  try {
    // Шукаємо за lowerCaseEmail
    const result = await db.query(`SELECT * FROM users WHERE email = $1`, [
      lowerCaseEmail, 
    ]);

    if (result.rows.length > 0) {
      const user = result.rows[0];
      const isMatch = await bcrypt.compare(password, user.password); 

      if (isMatch) {
        res.status(200).json({ message: "Login successful", user });
      } else {
        res.status(401).json({ message: "Incorrect password" });
      }
    } else {
      // Важливо: Не уточнюйте, чи не знайдено користувача, чи неправильний пароль
      // Це краща практика безпеки, щоб не давати підказку зловмисникам
      res.status(401).json({ message: "Invalid credentials" }); 
      // Або залишайте як було, якщо така деталізація потрібна:
      // res.status(404).json({ message: "User not found" }); 
    }
  } catch (error) {
    console.error("Error finding user:", error);
    res.status(500).json({ error: "Error finding user" });
  }
};

// --- Отримання інформації про користувача за ID (не змінюється, бо використовує ID) ---
const getUserInfo = async (req, res) => {
  const { id } = req.body;
  try {
    const result = await db.query(`SELECT * FROM users WHERE id=$1`, [id]);
    if (result.rows.length === 0) {
      res.status(404).json({ error: "User not found" });
    } else {
      const user = result.rows[0]; 
      res.status(200).json(user); 
    }
  } catch (error) {
    console.error("Error fetching user info:", error);
    res.status(500).json({ error: "Error fetching user info" });
  }
};

const saltRounds = 10;

// --- Додавання нового користувача ---
const addUser = async (req, res) => {
  const { login, email, password, fullName } = req.body;
  
  // Перевірка email
  if (!email || typeof email !== 'string') {
     return res.status(400).json({ message: "Email is required and must be a string" });
  }

  const lowerCaseEmail = email.toLowerCase(); // Перетворюємо email на нижній регістр
  const balance = Math.floor(Math.random() * (10000 - 1000 + 1)) + 1000;

  try {
    // Спочатку перевіримо, чи користувач з таким email вже існує
    const existingUser = await db.query(`SELECT id FROM users WHERE email = $1`, [lowerCaseEmail]);
    if (existingUser.rows.length > 0) {
       return res.status(409).json({ message: "User with this email already exists" }); // 409 Conflict
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds); 

    const result = await db.query(
      `INSERT INTO users (login, email, password, "fullName", role) VALUES ($1, $2, $3, $4, 'user') RETURNING id`,
      // Зберігаємо lowerCaseEmail
      [login, lowerCaseEmail, hashedPassword, fullName] 
    );

    const userId = result.rows[0].id;

    await db.query(`INSERT INTO card (user_id, balance) VALUES ($1, $2)`, [
      userId,
      balance,
    ]);

    res.status(201).json({ message: "User added successfully", userId }); // Краще повертати 201 Created і можливо ID
  } catch (error) {
    console.error("Error adding user:", error);
    // Перевірка на унікальність логіну (якщо є обмеження в БД)
    if (error.code === '23505' && error.constraint === 'users_login_key') { // Приклад для PostgreSQL
       return res.status(409).json({ message: "Login already taken" });
    }
    res.status(500).json({ error: "Error adding user" });
  }
};

// --- Оновлення фото користувача ---
const updateUserPhoto = async (req, res) => {
   // Перевірка email
  if (!req.body.email || typeof req.body.email !== 'string') {
     return res.status(400).json({ message: "Email is required and must be a string" });
  }
  
  const lowerCaseEmail = req.body.email.toLowerCase(); // Перетворюємо email на нижній регістр
  const { photoURL } = req.body;

  try {
    const result = await db.query(
      `UPDATE users SET photo = $1 WHERE email = $2`,
      // Використовуємо lowerCaseEmail для пошуку
      [photoURL, lowerCaseEmail] 
    );

    if (result.rowCount > 0) {
      res.status(200).json({ message: "Photo URL updated successfully" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Error updating photo URL:", error);
    res.status(500).json({ error: "Error updating photo URL" });
  }
};

// --- Отримання фото та імені користувача ---
const getPhoto = async (req, res) => {
   // Перевірка email
  if (!req.body.email || typeof req.body.email !== 'string') {
     return res.status(400).json({ message: "Email is required and must be a string" });
  }

  const lowerCaseEmail = req.body.email.toLowerCase(); // Перетворюємо email на нижній регістр

  try {
    const result = await db.query(
      `SELECT photo, "fullName" FROM users WHERE email=$1`,
      // Шукаємо за lowerCaseEmail
      [lowerCaseEmail] 
    );

    if (result.rowCount > 0) {
      // Перейменуємо photo на photoURL для консистентності з фронтендом, якщо потрібно
      const { photo: photoURL, fullName } = result.rows[0]; 
      res.status(200).json({ photoURL, fullName });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Error fetching photo URL:", error);
    res.status(500).json({ error: "Error fetching photo URL" });
  }
};


// --- Решта функцій (createPost, getPosts, etc.) залишаються без змін, бо вони не використовують email для пошуку ---

const createPost = async (req, res) => {
  const { rating, text, book_id, user_id } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO review (rating, text, book_id, user_id, date) VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
      [rating, text, book_id, user_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ error: "Error creating post" });
  }
};

const getPosts = async (req, res) => {
  const { user_id } = req.body;
  try {
    const result = await db.query(`SELECT * FROM review WHERE user_id=$1`, [user_id]);
    res.status(200).json(result.rows); // Повертаємо 200 OK для успішного GET
  } catch (error) {
    console.error("Error fetching posts:", error); // Змінено повідомлення
    res.status(500).json({ error: "Error fetching posts" }); // Змінено повідомлення
  }
};

const getPostsByBook = async (req, res) => {
  const { book_id } = req.body;
  try {
    const result = await db.query(`SELECT * FROM review WHERE book_id=$1`, [book_id]);
    res.status(200).json(result.rows); // Повертаємо 200 OK для успішного GET
  } catch (error) {
    console.error("Error getting posts by book:", error); // Змінено повідомлення
    res.status(500).json({ error: "Error getting posts by book" }); // Змінено повідомлення
  }
};

const getRec = async (req, res) => {
  const { user_id } = req.body;
  try {
    const result = await db.query(`
      SELECT  r.book_id,
             b.name AS book_name, b.author AS author, b.picture AS picture, b.price AS price, b.brand AS brand
      FROM recomendation r
      JOIN books b ON r.book_id = b.id
      WHERE r.user_id = $1
    `, [user_id]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error in getting recommendations:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getAllUsers = async(req,res)=>{
  try {
    const result = await db.query(`SELECT * FROM users`);
    res.status(200).json(result.rows); // Повертаємо 200 OK для успішного GET
  } catch (error) {
    console.error("Error getting all users:", error); // Змінено повідомлення
    res.status(500).json({ error: "Error getting all users" }); // Змінено повідомлення
  }
}

const createRec = async (req,res)=>{
  const {book_id, user_id} = req.body
  try {
    const result = await db.query(`INSERT INTO recomendation (book_id, user_id) VALUES ($1, $2) RETURNING *`,[book_id,user_id]);
    res.status(201).json(result.rows[0]); // Повертаємо створений запис
  } catch (error) {
    console.error("Error creating recommendation:", error); // Змінено повідомлення
    // Перевірка на foreign key constraint, якщо потрібно
    if (error.code === '23503') { // Код помилки для foreign key violation в PostgreSQL
        return res.status(400).json({ error: "Invalid book_id or user_id" });
    }
    // Перевірка на унікальність пари (якщо є обмеження)
    if (error.code === '23505') { // Код помилки для unique violation в PostgreSQL
        return res.status(409).json({ error: "Recommendation already exists" });
    }
    res.status(500).json({ error: "Error creating recommendation" }); // Змінено повідомлення
  }
}

const deleteFromRec = async(req,res)=>{
  const {book_id, user_id} = req.body
   try {
    const result = await db.query(`DELETE FROM recomendation WHERE book_id=$1 and user_id=$2 RETURNING * `,[book_id, user_id]);
    if (result.rowCount > 0) {
       res.status(200).json({ message: "Recommendation deleted successfully", deletedItem: result.rows[0] }); // Повертаємо 200 OK і видалений елемент
    } else {
       res.status(404).json({ message: "Recommendation not found" }); // Якщо нічого не було видалено
    }
  } catch (error) {
    console.error("Error deleting recommendation:", error); // Змінено повідомлення
    res.status(500).json({ error: "Error deleting recommendation" }); // Змінено повідомлення
  }
}


module.exports = {
  addUser,
  findUserByEmail,
  updateUserPhoto,
  getPhoto,
  createPost,
  getPosts,
  getPostsByBook,
  getUserInfo,
  getAllUsers,
  createRec,
  getRec,
  deleteFromRec
};