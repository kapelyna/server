const db = require("../db");
const axios = require("axios");

const findUserByEmail = async (req, res) => {
  const { email, password } = req.body; // Отримуємо і email, і пароль з тіла запиту

  try {
    const result = await db.query(`SELECT * FROM users WHERE email = $1`, [
      email,
    ]);

    if (result.rows.length > 0) {
      const user = result.rows[0];

      // Перевіряємо, чи введений пароль відповідає збереженому
      if (user.password === password) {
        res.status(200).json({ message: "Login successful", user }); // Пароль правильний
      } else {
        res.status(401).json({ message: "Incorrect password" }); // Пароль неправильний
      }
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Error finding user:", error);
    res.status(500).json({ error: "Error finding user" });
  }
};

const addUser = async (req, res) => {
  const { login, email, password, fullName } = req.body;

  const balance = Math.floor(Math.random() * (10000 - 1000 + 1)) + 1000;

  try {
    const result = await db.query(
      `INSERT INTO users (login, email, password, "fullName", role) VALUES ($1, $2, $3, $4, 'user') RETURNING id`,
      [login, email, password, fullName]
    );

    const userId = result.rows[0].id; // Отримуємо ID нового користувача

    // Додаємо баланс для створеного користувача
    await db.query(
      `INSERT INTO card (user_id, balance) VALUES ($1, $2)`,
      [userId, balance]
    );

    res.status(200).json({ message: "User added successfully" });
  } catch (error) {
    console.error("Error adding user:", error);
    res.status(500).json({ error: "Error adding user" });
  }
};


const updateUserPhoto = async (req, res) => {
  const { email, photoURL } = req.body;

  try {
    const result = await db.query(
      `UPDATE users SET photo = $1 WHERE email = $2`,
      [photoURL, email]
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

const getPhoto = async (req, res) => {
  const { email } = req.body;

  try {
    const result = await db.query(
      `SELECT photo, "fullName" FROM users WHERE email=$1`,
      [email]
    );

    if (result.rowCount > 0) {
      const photoURL = result.rows[0].photo;
      const fullName = result.rows[0].fullName;
      res.status(200).json({ photoURL, fullName });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Error fetching photo URL:", error);
    res.status(500).json({ error: "Error fetching photo URL" });
  }
};

module.exports = {
  addUser,
  findUserByEmail,
  updateUserPhoto,
  getPhoto
};
