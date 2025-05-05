const db = require("../db");
const axios = require("axios");

const saveRead = async (req, res) => {
  const { book_id, user_id, read_time, read_percentage } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO tracking (book_id, user_id, read_time, read_percentage) VALUES ($1, $2, $3, $4) RETURNING *`,
      [book_id, user_id, read_time, read_percentage]
    );

    res.status(200).json({ tracking: result.rows[0] });
  } catch (error) {
    console.error("Error track reading:", error);
    res.status(500).json({ error: "Error track reading" });
  }
};
const getTrackingRecord = async (req, res) => {
  const { book_id, user_id } = req.body;
  try {
      const result = await db.query(
          `
          SELECT *
          FROM tracking
          WHERE user_id = $1 AND book_id = $2
          `,
          [user_id, book_id] // порядок параметрів у масиві має відповідати $1 і $2
      );
      return res.status(200).json(result.rows); // Відправка відповіді клієнту
  } catch (error) {
      console.error("Error fetching last tracking record:", error);
      return res.status(500).json({ error: "Internal Server Error" }); // Відправка помилки
  }
};

const getLastTrackingRecord = async (req, res) => {
  const { book_id, user_id } = req.body;
  try {
      const result = await db.query(
          `
          SELECT *
          FROM tracking
          WHERE user_id = $1 AND book_id = $2
          ORDER BY id DESC
          LIMIT 1;
          `,
          [user_id, book_id] // порядок параметрів у масиві має відповідати $1 і $2
      );
      return res.status(200).json(result.rows[0]); // Відправка відповіді клієнту
  } catch (error) {
      console.error("Error fetching last tracking record:", error);
      return res.status(500).json({ error: "Internal Server Error" }); // Відправка помилки
  }
};

const addToCalendar = async(req,res)=>{
  const { book_id, user_id, end_date } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO book_calendar (book_id, user_id, end_date) VALUES ($1, $2, NOW()) RETURNING *`,
      [book_id, user_id]
    );

    res.status(200).json({ tracking: result.rows[0] });
  } catch (error) {
    console.error("Error track reading:", error);
    res.status(500).json({ error: "Error track reading" });
  }
}


const getCalendar = async (req, res) => {
  const { user_id } = req.body;
  
  try {
    const result = await db.query(
      `
        SELECT 
          bc.end_date,
          bc.book_id,
          b.name AS book_title,
          b.author AS book_author,
          b.picture AS book_picture,
          r.rating
        FROM book_calendar bc
        JOIN books b ON bc.book_id = b.id
        LEFT JOIN review r ON b.id = r.book_id
        WHERE bc.user_id = $1
      `,
      [user_id]
    );
    
     // Форматування дати
     const formattedData = result.rows.map(entry => ({
      ...entry,
      date: entry.end_date.split(" ")[0] // Вибір тільки дати
    }));

    return res.status(200).json(formattedData);
  } catch (error) {
    console.error("Error fetching last tracking record:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};





module.exports = {
  saveRead,
  getLastTrackingRecord,
  getTrackingRecord,
  addToCalendar,
  getCalendar
};
