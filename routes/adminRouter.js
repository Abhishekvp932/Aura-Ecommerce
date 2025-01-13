const express = require('express')
const router = express.Router();
const adminController = require('../controller/adminController');
const adminCheck=require('../middlewares/adminAuth');
const { route } = require('./userRouter');
const upload = require('../middlewares/upload');

router.post('/adminVerify',adminController.adminLogin);
router.get('/',adminController.loadLogin);
router.post('/adminLogout',adminCheck,adminController.adminLogout);
router.get('/dashboard',adminCheck,adminController.loadDashboard);
router.get('/products',adminCheck,adminController.loadProducts);
router.get('/orders',adminCheck,adminController.loadOrders);
router.get('/users',adminCheck,adminController.loadUsers);
router.get('/categories',adminCheck,adminController.loadCategory);
router.get('/offers',adminCheck,adminController.loadOffer);
router.get('/blocked',adminCheck,adminController.userBlocked);
router.get('/unBlocked',adminCheck,adminController.userUnBlocked);
router.get('/addCategory',adminCheck,adminController.categoryAdd);
router.post('/categoryAdd',adminController.CategoryAdding);
router.get('/editeCategory/:id',adminCheck,adminController.categoryEdite);
router.post('/categoryEdite/:id',adminCheck,adminController.editeCategory)
router.get('/addProducts',adminCheck,adminController.addProductForm);
router.get('/list',adminCheck,adminController.categoryListed)
router.get('/unList',adminCheck,adminController.categoryUnList);
router.post('/add-product',adminCheck,upload.array('productImage', 2),adminController.productsAdd);


module.exports = router