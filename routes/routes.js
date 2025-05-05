const Router = require('express');
const router = new Router();
const UserController = require("../controlers/userController");
const BooksController = require ('../controlers/booksController')
const PurchaseController = require ("../controlers/purchaseController")
const TrackingController = require ("../controlers/trackingController")

// Маршрути для операцій з користувачами
router.post('/addUser', UserController.addUser);
router.post('/findUserByEmail', UserController.findUserByEmail);
router.post('/updateUserPhoto',UserController.updateUserPhoto);
router.post('/getPhoto', UserController.getPhoto);
router.post('/createPost', UserController.createPost)
router.post('/getPosts', UserController.getPosts)
router.post('/getBookPost', UserController.getPostsByBook)
router.post('/getUserInfo', UserController.getUserInfo),
router.get('/getAllUsers', UserController.getAllUsers)
router.post('/getRec', UserController.getRec)
router.post('/deleteFromRec', UserController.deleteFromRec)
// Маршрути для операцій з покупками
router.put('/updateUserCardInfo', PurchaseController.updateUserCardInfo);
router.post('/getUserCardInfo', PurchaseController.getUserCardInfo)
router.post('/addPurchase', PurchaseController.addPurchase)
router.post('/getUserPurchase', PurchaseController.getUserPurchase)

// Маршрути для операцій з книгами
router.post('/addBook', BooksController.fetchBooks)
router.get('/getAllBooks', BooksController.getAllBooks)
router.post('/addBookToLibrary', BooksController.addBookToLibrary)
router.post('/getLibrary',BooksController.getLibrary)
router.post('/getBook',BooksController.getBook)
router.post('/updateBook', BooksController.updateBook)
router.post('/deleteBook', BooksController.deleteBook)
router.post('/deleteBookFromLibrary', BooksController.deleteBookFromLibrary)
router.put('/editBook', BooksController.editBook)
router.post('/createBook', BooksController.addBook)
router.post('/getUserCalendar', BooksController.getUserCalendar)
router.post('/createRec', UserController.createRec)

// Маршрути для операцій з трекінгом чтання
router.post('/saveReading', TrackingController.saveRead)
router.post('/getLastTrackingRecord',TrackingController.getLastTrackingRecord)
router.post('/getTrackingRecord',TrackingController.getTrackingRecord)
router.post('/addToCalendar', TrackingController.addToCalendar)
router.post('/getCalendar', TrackingController.getCalendar)

module.exports = router;
