const express = require('express');
const router = express.Router();   
const userController = require('../controller/user/userController');
const passport = require('passport');
// const adminCheck = require('../middlewares/adminAuth');
const {userCheck,userAuth}= require('../middlewares/userAuth')
const productController = require('../controller/user/productConteroller');
const cartController = require('../controller/user/cartController');
const checkoutController = require('../controller/user/checkoutController');
const orderController = require('../controller/user/orderConteroller');


router.post('/resendOtp',userController.resendOTP);
router.get('/otpVerify',userAuth,userController.otpPage);
router.get('/logout',userController.logOut)
router.post('/userLogin',userController.loginUser);
router.post('/emailVerify',userController.verifyOtp);
router.post('/signup-otp',userController.sendOTP)
router.get('/verifyEmail',userAuth,userController.signupEmail);
router.get('/login',userAuth,userController.loadLogin);
router.post('/signup-details',userController.signup)
router.get('/',userCheck,userController.loadHome);
router.get('/signup',userAuth,userController.loadSignup);
router.get('/pageNotFound',userAuth,userController.pageNotFound);
router.get('/repassEmail',userAuth,userController.changePassEmail);
router.get('/repassOtp',userAuth,userController.changePassOTP);
router.post('/repass-otp',userController.sendForgotPassOTP);
router.post('/repassOtp-verify',userController.forgotOtpVerify);
router.get('/changePassword',userAuth,userController.loadchangePassword);
router.post('/updatePassword',userController.updateOldPassword);
router.get('/shopping',userCheck,productController.shoppingPage);
router.get('/product-details/:id',userCheck,productController.loadProductDetails);
router.get('/category/:id',userCheck,productController.eachCategory)
router.get('/userProfile',userCheck,userController.loadUserProfile);
router.get('/address',userCheck,userController.loadAddress);
router.get('/addAddress',userCheck,userController.loadAddAddress);
router.post('/addressAdd',userController.addressAdd);
router.get('/addressEdite/:id',userCheck,userController.loadEditeAddress);
router.post('/editAddress/:id',userController.editAddress)
router.get('/addressDelete/:id',userController.deleteAddress);
router.get('/userOrders',userCheck,orderController.loadOrdersPage);
router.get('/profileEdite/:id',userCheck,userController.profileEdite)
router.post('/editeProfile/:id',userController.editeProfile);
router.post('/addToCart/:productId',cartController.addToCart);
router.get('/cart',userCheck,cartController.loadCart);
router.get('/deleteCart/:cartId/:productId',cartController.deleteCart)
router.post('/review/:id',productController.reviewAdding);
router.get('/checkout',userCheck,checkoutController.loadCheckout);
router.get('/payments',userCheck,checkoutController.loadPaymentSuccess);
router.post('/placeOrder',checkoutController.placeOrder);

router.get('/orderSummary/:id',userCheck,orderController.orderSummary);
router.get('/cancel/:id/product/:productId',orderController.orderCancel);
router.post('/search',productController.searchProducts);
router.get('/updatePassword/:id',userController.updatePassword);
router.post('/changePassword',userController.changePassword)
router.post('/update-cart-quantity',cartController.updateCart);

router.get('/wallet',userCheck,userController.loadWallet);







router.get('/auth/google',passport.authenticate('google'));
router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/login'}),(req,res)=>{

         req.session.userId = req.user._id


         req.session.userEmail = req.user.email;
    
    req.session.userLoged=true
    res.redirect('/');
})

module.exports = router