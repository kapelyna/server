const Router = require('express');
const router = new Router();
const UserController = require("../controlers/userController");
const BooksController = require ('../controlers/booksController')
const PurchaseController = require ("../controlers/purchaseController")

// Маршрути для операцій з користувачами
router.post('/addUser', UserController.addUser);
router.post('/findUserByEmail', UserController.findUserByEmail);
router.post('/updateUserPhoto',UserController.updateUserPhoto);
router.post('/getPhoto', UserController.getPhoto);

// Маршрути для операцій з покупками
router.put('/updateUserCardInfo', PurchaseController.updateUserCardInfo);
router.post('/getUserCardInfo', PurchaseController.getUserCardInfo)
router.post('/addPurchase', PurchaseController.addPurchase)

// Маршрути для операцій з книгами
router.post('/addBook', BooksController.fetchBooks)
router.get('/getAllBooks', BooksController.getAllBooks)
router.post('/addBookToLibrary', BooksController.addBookToLibrary)
router.post('/getLibrary',BooksController.getLibrary)

module.exports = router;
