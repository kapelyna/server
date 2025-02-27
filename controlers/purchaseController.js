const db = require("../db");
const axios = require("axios");

const updateUserCardInfo = async (req, res) => {
  const { userId, cvv, date, number, balance } = req.body;

  try {
    await db.query(
      `UPDATE card SET cvv = $1, date = $2, "number" = $3, balance= $4 WHERE user_id = $5`,
      [cvv, date, number, balance, userId]
    );
    res.status(200).json({ message: "Card information updated successfully" });
  } catch (error) {
    console.error("Error updating card information:", error);
    res.status(500).json({ error: "Error updating card information" });
  }
};

const getUserCardInfo = async (req, res) => {
  const { userId, balance } = req.body;

  try {
    const result = await db.query(`SELECT * FROM card WHERE user_id = $1`, [
      userId,
    ]);
    res.status(200).json({ card: result.rows });
  } catch (error) {
    console.error("Error updating card information:", error);
    res.status(500).json({ error: "Error updating card information" });
  }
};

const addPurchase = async (req, res) => {
  const { userId, bookIds, price } = req.body;

  try {
    // Цикл по кожному bookId та створення запису про покупку
    for (const bookId of bookIds) {
      const query = `
              INSERT INTO purchase (user_id, book_id, date, price)
              VALUES ($1, $2, NOW(), $3)
          `;
      const values = [userId, bookId, price];

      await db.query(query, values); // Чекаємо завершення запиту

      // Додаємо книгу до бібліотеки користувача
      await db.query(
        `INSERT INTO user_library (book_id, user_id) VALUES ($1, $2)`,
        [bookId, userId]
      );
      await db.query(
        `UPDATE books SET num_add = num_add + 1 WHERE id = $1`,
        [bookId]
      );
    }

    res.status(201).json({ message: "Purchases added successfully" });
  } catch (error) {
    console.error("Error adding purchase:", error);
    res.status(500).json({ error: "Error adding purchase" });
  }
};

module.exports = {
  updateUserCardInfo,
  getUserCardInfo,
  addPurchase,
};
