const express = require('express');
const router = express.Router();   
const userController = require('../controller/user/userController');
const passport = require('passport');
// const adminCheck = require('../middlewares/adminAuth');
const userAuth = require('../middlewares/userAuth')
const productController = require('../controller/user/productConteroller');
const cartController = require('../controller/user/cartController');
const checkoutController = require('../controller/user/checkoutController');
const orderController = require('../controller/user/orderConteroller');
const couponController = require('../controller/user/couponController')
const wishlistController = require('../controller/user/wishlistController')



router.post('/resendOtp',userController.resendOTP);
router.get('/otpVerify',userAuth.userAuth,userController.otpPage);
router.get('/logout',userController.logOut)
router.post('/userLogin',userController.loginUser);
router.post('/emailVerify',userController.verifyOtp);
router.post('/signup-otp',userController.sendOTP)
router.get('/verifyEmail',userAuth.userAuth,userController.signupEmail);
router.get('/login',userAuth.userAuth,userController.loadLogin);
router.post('/signup-details',userController.signup)
router.get('/',userAuth.userCheck,userController.loadHome);
router.get('/signup',userAuth.userAuth,userController.loadSignup);
router.get('/pageNotFound',userAuth.userAuth,userController.pageNotFound);
router.get('/repassEmail',userAuth.userAuth,userController.changePassEmail);
router.get('/repassOtp',userAuth.userAuth,userController.changePassOTP);
router.post('/repass-otp',userController.sendForgotPassOTP);
router.post('/repassOtp-verify',userController.forgotOtpVerify);
router.get('/changePassword',userAuth.userAuth,userController.loadchangePassword);
router.post('/updatePassword',userController.updateOldPassword);
router.get('/shopping',userAuth.userCheck,productController.shoppingPage);
router.get('/product-details/:id',userAuth.userCheck,productController.loadProductDetails);
router.get('/category/:id',userAuth.userCheck,productController.eachCategory)
router.get('/userProfile',userAuth.userCheck,userController.loadUserProfile);
router.get('/address',userAuth.userCheck,userController.loadAddress);
router.get('/addAddress',userAuth.userCheck,userController.loadAddAddress);
router.post('/addressAdd',userController.addressAdd);
router.get('/addressEdite/:id',userAuth.userCheck,userController.loadEditeAddress);
router.post('/editAddress/:id',userController.editAddress)
router.get('/addressDelete/:id',userController.deleteAddress);
router.get('/userOrders',userAuth.userCheck,orderController.loadOrdersPage);
router.get('/profileEdite/:id',userAuth.userCheck,userController.profileEdite)
router.post('/editeProfile/:id',userController.editeProfile);
router.post('/addToCart/:productId',cartController.addToCart);
router.get('/cart',userAuth.userCheck,cartController.loadCart);
router.get('/deleteCart/:cartId/:productId',cartController.deleteCart)
router.post('/review/:id',productController.reviewAdding);
router.get('/checkout',userAuth.userCheck,checkoutController.loadCheckout);
router.get('/payments',userAuth.userCheck,checkoutController.loadPaymentSuccess);
router.post('/placeOrder',checkoutController.placeOrder);

router.get('/orderSummary/:id',userAuth.userCheck,orderController.orderSummary);
router.get('/cancel/:id/product/:productId',orderController.orderCancel);
router.post('/search',productController.searchProducts);
router.get('/updatePassword/:id',userController.updatePassword);
router.post('/changePassword',userController.changePassword)
router.post('/update-cart-quantity',cartController.updateCart);

router.get('/wallet',userAuth.userCheck,userController.loadWallet);

router.get('/orderReturn',userAuth.userCheck,orderController.returnRequest)

router.post('/couponApply',userAuth.userCheck,couponController.couponApply)
router.get('/wishlist',userAuth.userCheck,wishlistController.loadWishlist)
router.post('/addToWishlist',wishlistController.addToWishlist);
router.post('/cartAdd',wishlistController.addToCart);

router.get('/removeWishlist/:id/:productId',userAuth.userCheck,wishlistController.removeWishlist);

router.get('/allCoupon',userAuth.userCheck,couponController.findAllCoupon)

router.get('/get-address/:id',userAuth.userCheck,checkoutController.getAddrss);
router.post('/update-address/:id',userAuth.userCheck,checkoutController.updateAddress)
router.post('/verify-payment',orderController.verifyPayment);
router.post('/addCart',cartController.addCart)
router.post('/placeFieldOrders',orderController.placeFieldOrders)
router.post('/retry-payment',userAuth.userCheck,orderController.retryPayment)
router.post('/verifyPayment',orderController.retryPaymentVerify)
router.get('/downloadInvoice',orderController.downloadInvoice)
router.get('/about',userAuth.userCheck,userController.loadAbout)

router.get('/auth/google',passport.authenticate('google'));
router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/login'}),(req,res)=>{

         req.session.userId = req.user._id


         req.session.userEmail = req.user.email;
    
    req.session.userLoged=true
    res.redirect('/');
})

module.exports = router