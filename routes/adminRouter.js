const express = require('express')
const router = express.Router();
const adminController = require('../controller/admin/adminController');
const adminCheck=require('../middlewares/adminAuth');
const { route } = require('./userRouter');
const upload = require('../middlewares/upload');
const adminUserController = require('../controller/admin/adminUserControler');
const offerController = require('../controller/admin/offerController');
const categoryController = require('../controller/admin/categoryController');
const productsController = require('../controller/admin/productsController');
const orderController = require('../controller/admin/orderController');



router.post('/adminVerify',adminController.adminLogin);
router.get('/',adminController.loadLogin);
router.post('/adminLogout',adminCheck,adminController.adminLogout);
router.get('/dashboard',adminCheck,adminController.loadDashboard);
router.get('/products',adminCheck,productsController.loadProducts);
router.get('/orders',adminCheck,orderController.loadAdminOrders);
router.get('/users',adminCheck,adminUserController.loadUsers);
router.get('/categories',adminCheck,categoryController.loadCategory);
router.get('/offers',adminCheck,offerController.loadOffer);
router.get('/blocked',adminCheck,adminUserController.userBlocked);
router.get('/unBlocked',adminCheck,adminUserController.userUnBlocked);
router.get('/addCategory',adminCheck,categoryController.categoryAdd);
router.post('/categoryAdd',categoryController.CategoryAdding);
router.get('/editeCategory/:id',adminCheck,categoryController.categoryEdite);
router.post('/categoryEdite/:id',adminCheck,categoryController.editeCategory)
router.get('/addProducts',adminCheck,productsController.addProductForm);
router.get('/list',adminCheck,categoryController.categoryListed)
router.get('/unList',adminCheck,categoryController.categoryUnList);
router.post('/add-product',adminCheck,upload.array('productImage', 4),productsController.productsAdd);
router.post('/productEdite/:id',adminCheck,upload.array('productImage', 4),productsController.productEdite);
router.get('/editeProduct/:id',adminCheck,productsController.editeProduct);
router.get('/productBlocked/:id',adminCheck,productsController.productBlock);
router.get('/productUnBlock/:id',adminCheck,productsController.productUnBlock)
router.get('/addOffers',adminCheck,offerController.offerAdd);
router.post('/offerAdd',adminCheck,offerController.addOffer);
router.get('/offerList/:id',adminCheck,offerController.offerList);
router.get('/offerUnList/:id',adminCheck,offerController.offerUnList);
router.get('/editeOffer/:id',adminCheck,offerController.editeOffer);
router.post('/offerEdite/:id',adminCheck,offerController.offerEdite);

module.exports = router