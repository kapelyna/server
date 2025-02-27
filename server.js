const express = require('express');
const app = express();
const port = 5002;
const userRouter = require("./routes/routes");


app.use(express.json());

app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Access-Control-Allow-Headers, Authorization');
  next();
});

const http = require('http');
const server = http.createServer(app);

app.use('/', userRouter);

server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
