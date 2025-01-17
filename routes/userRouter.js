const express = require('express');
const router = express.Router();   
const userController = require('../controller/userController');
const passport = require('passport');
const adminCheck = require('../middlewares/adminAuth');



router.post('/resendOtp',userController.resendOTP);
router.get('/otpVerify',userController.otpPage);
router.get('/logout',userController.logOut)
router.post('/userLogin',userController.loginUser);
router.post('/emailVerify',userController.verifyOtp);
router.post('/signup-otp',userController.sendOTP)
router.get('/verifyEmail',userController.signupEmail);
router.get('/login',userController.loadLogin);
router.post('/signup-details',userController.signup)
router.get('/',userController.loadHome);
router.get('/signup',userController.loadSignup);
router.get('/pageNotFound',userController.pageNotFound);
router.get('/repassEmail',userController.changePassEmail);
router.get('/repassOtp',userController.changePassOTP);
router.post('/repass-otp',userController.sendForgotPassOTP);
router.post('/repassOtp-verify',userController.forgotOtpVerify);
router.get('/changePassword',userController.loadchangePassword);
router.post('/updatePassword',userController.updateOldPassword);
router.get('/shopping',userController.shoppingPage);
router.get('/product-details/:id',userController.loadProductDetails);
router.get('/category/:id',userController.eachCategory)





router.get('/auth/google',passport.authenticate('google'));
router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/login'}),(req,res)=>{

  
    req.session.userLoged=true
    res.redirect('/');
})

module.exports = router