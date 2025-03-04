const User = require('../../models/userSchema');
const env = require('dotenv').config()
const nodemailer = require('nodemailer');
const Products = require('../../models/productSchema');
const Category = require('../../models/categorySchema');
const offers = require('../../models/offerSchema');
const Address = require('../../models/addressSchema');
const Product = require('../../models/productSchema');
const Order = require('../../models/orderSchema');
const mongoose = require('mongoose')
const Wallet = require('../../models/walletSchema')
const {hashPassword,checkPassword} = require('../../helpers/bcrypt')

const signupEmail = async (req,res)=>{
    try {
        return res.render('verifyEmail',{msg:req.flash('emailReq')})
    } catch (error) {
        console.log('sign up email page not found')
        res.status(500).send('server error')
    }
}
function generateOtp(){
    return Math.floor(100000 + Math.random()*900000).toString();
}
async function sendVerificationEmail(email,otp){
    try {
        const transporter = nodemailer.createTransport({
            service:'gmail',
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
                user:process.env.NODEMAILER_EMAIL,
                pass:process.env.NODEMAILER_PASSWORD
            }
        })
        const info = await transporter.sendMail({
            from:process.env.NODEMAILER_EMAIL,
            to:email,
            subject:'Verify your email it is only valid for 1 minute',
            text:`Your OTP is ${otp}`,
            html:`<b> Your Otp:${otp} </b>`,
        })
        return info.accepted.length>0
    } catch (error) {
        console.error('Error sending email',error);
        return false;
        
    }
}

const sendOTP = async (req,res)=>{
    try {
        const {email} = req.body;
        const emailPattern = /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~.-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;
        if(!email){
            req.flash('emailReq','Emails is requierd')
            return res.redirect('/verifyEmail')
        }
         if(!emailPattern.test(email)){
            req.flash('emailReq','Email pattern does not match')
            return res.redirect('/verifyEmail');
        }
           const userExists = await User.findOne({ email });
     console.log('userExists',userExists)
     if (userExists) {
         req.flash('emailReq', 'Email already in use');
         return res.redirect('/verifyEmail')
     }

        req.session.userEmail=email

        const otp = generateOtp();
        console.log('otp is',otp)
        const emailSend = await sendVerificationEmail(email,otp);
        if(!emailSend){
           res.redirect('/verifyEmail');
        }
        req.session.userOtp = otp;
        req.session.Email = email

        setTimeout(()=>{
            delete req.session.userOtp
            req.session.save((err)=>{
                if(err){
                    console.log('Error deleting session');
                }
            })
            console.log('otp expired');
          },60000)
        
        res.render('otpVerify',{msg:req.flash('errorMsg')})
        

    } catch (error) {
        console.log('email verification page not found')
        res.redirect('/page-404');
    }

}

const resendOTP = async(req,res)=>{
   try {
    const email=req.session.Email
    console.log(req.session.userEmail);
    
    const otp = generateOtp();
    req.session.userOtp = otp;


        setTimeout(()=>{
            delete req.session.userOtp
            req.session.save((err)=>{
                if(err){
                    console.log('Error deleting session');
                }
            })
          },60000);
          
    await sendVerificationEmail(email,otp);
     req.flash('succesMsg','Otp resend successfully');
     res.redirect('/otpVerify');
   } catch (error) {
    console.log('resend otp is not working',error);
    res.status(500).send('server error');
   }
}


const verifyOtp = async (req, res) => {
    try {
      
      let storedOtp = req.session.userOtp;
      
      const email = req.session.Email
      
      if (!storedOtp) {
        req.flash('errorMsg', 'OTP has expired or is missing. Please try again.');
        return res.redirect('/otpVerify'); 
      }
  
     
      const { otp } = req.body;  
   
      if (otp !== storedOtp) {
        req.flash('errorMsg', 'Invalid OTP. Please try again.');
        return res.redirect('/otpVerify'); 
      }
  
      
      req.session.userOtp = null;
    console.log(req.session.userOtp);
     
      
    return res.render('signup',{msg:req.flash('err'),email});
    } catch (error) {
      console.error('Error verifying OTP:', error);
      res.status(500).send('An error occurred. Please try again later.');
    }
  };



  const forgotPassResendOtp = async(req,res)=>{
    try {
     const email=req.session.Email
     console.log(req.session.userEmail);
     
     const otp = generateOtp();
     req.session.userOtp = otp;
 
 
         setTimeout(()=>{
             delete req.session.userOtp
             req.session.save((err)=>{
                 if(err){
                     console.log('Error deleting session');
                 }
             })
           },60000);
           
     await sendVerificationEmail(email,otp);
      req.flash('succesMsg','Otp resend successfully');
      res.redirect('/repassOtp');
    } catch (error) {
     console.log('resend otp is not working',error);
     res.status(500).send('server error');
    }
 }


  
const loadLogin = async(req,res)=>{
    try {
        return res.render('login', { mg: req.flash('err') })
    } catch (error) {
        console.log('login page not found')
        res.status(500).send('server error')
    }
} 


const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        console.log('1')
     
        if(email == '' || password == ''){
            req.flash('err','Please Enter the Email id and Password')
            res.redirect('/login')
        }

        const user = await User.findOne({ email: email});
        if (!user) {
            req.flash('err', 'User not found');
            return res.redirect('/login');
        }
 const isPasswordValid = await checkPassword (password,user.password)

        if(!isPasswordValid){
            req.flash('err','password incorrect')
            return res.redirect('/login')
        }
        console.log('3')
         if(user.isBlocked){
            req.flash('err','this user cant access the page');
            return res.redirect('/login');
        }
  

        console.log('5')
        req.session.userLoged = true;
        req.session.userEmail = user.email
        req.session.userId = user._id
        console.log('6')
        res.redirect('/'); 
    } catch (error) {
        console.error('Login page not working:', error);
        req.flash('err', 'An error occurred while processing your request');
        res.render('login', { mg: req.flash('err') });
    }
};

function genarateRefferalCode(length = 8){
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let refferalCode = '';
    for(let i=0;i<length;i++){
        refferalCode  += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return refferalCode;
}


const signup = async(req,res)=>{    
    // const email = req.session.userEmail;
 const email = req.session.Email

     const {name,password,confirmpassword,phone,referralCode} = req.body;

     let refferal = genarateRefferalCode();

     const passwordpattern = /^[A-Za-z0-9]{6,}$/
     if(!passwordpattern.test(password)){
        req.flash('err','password doesnt match the criteria')
        return res.render('signup',{msg:req.flash('err'),email});
     }
      if(password !== confirmpassword){
        req.flash('err','Passwords do not match. Please ensure both fields are identical')
        return res.render('signup',{msg:req.flash('err'),email});
     }
      if(name == ''||password == ''|| confirmpassword =='' || phone == ''){
         req.flash('err','all filed must be required')
         return res.render('signup',{msg:req.flash('err'),email});
     }
     if(phone.length !== 10){
            req.flash('err','Phone Number must 10 digits')
            return res.render('signup',{msg:req.flash('err'),email});
     }

     if(referralCode){
        const refferedUser = await User.findOne({referralCode:referralCode})
    if(!refferedUser){
     req.flash('err','Invalid referral code')
     return res.render('signup',{msg:req.flash('err'),email});
    }
     }
     const hashedPassword = await hashPassword(password);
 
    const newUser =  await User.insertMany({
        email:email,
        name:name,
        phone:phone,
        password:hashedPassword,
        referalCode:refferal,
        referredBy:referralCode

     })

     let walletAmount = 0;
     if(referralCode){
        const reffer = await User.findOne({referalCode:referralCode})

        if(reffer){
            walletAmount  = 50

            let refferWallet = await Wallet.findOne({userId:reffer._id})
            if(refferWallet){
                await Wallet.updateOne({userId:reffer._id},{$inc:{balance:100}})
            }else{
                await Wallet.create({userId:reffer._id,balance:100})
            }
        }
     }
     await Wallet.create({userId:newUser[0]._id,balance:walletAmount});
     req.session.userLoged = true,

       res.render('login',{mg:req.flash('err')});
}
const loadSignup = async(req,res)=>{
    try {
        const email = req.session.Email
        return res.render('signup',{msg:req.flash('err'),email});
    } catch (error) {
        console.log('signUp page not found')
        res.status(500).send('server error')
    }
}


const pageNotFound = async(req,res)=>{
    try {
        res.render('page-404');
    } catch (error) {
        res.redirect('/pageNotFound');
    }
}

const loadHome = async (req,res)=>{
    try {
      const userLoged = req.session.userLoged
const product = await Product.find().sort({createdAt:-1}).limit(8)

const categories = await Category.find({ isListed: true });
    const categoryWithIds = categories.map((category) => ({
      _id: category._id,
      name: category.name,
    }));
    const idd = categories.map(category=> category._id)

    const offer = await offers.find({ category: { $in: idd },isActive:true});
      res.render('home',{ userLoged ,product,category:categoryWithIds,offer});
    } catch (error) {
        console.log("home page not found")
        res.status(500).send('server error')
    }
} 

const logOut = async (req,res)=>{
    try {
      if(req.session.userId){
        delete req.session.userId
        delete req.session.userLoged
        delete req.session.userEmail
      } 
      res.redirect('/login')
    } catch (error) {
        console.error('logout error');
        res.status(500).send('server error');
    }
}
const otpPage = async (req,res)=>{
    try {
        return res.render('otpVerify',{msg:req.flash('errorMsg')})
    } catch (error) {
        console.error('otp page is not working')
        res.status(500).send('server is not working');
    }
}
const changePassEmail = async(req,res)=>{
    try {
        return res.render('repassEmail',{msg:req.flash('ermsg')});
    } catch (error) {
        console.log('forgot password verification email is not working',error);
        res.status(500).send('server error');
        
    }
}
const changePassOTP = async(req,res)=>{
    try {
        return res.render('repassOtp');
    } catch (error) {
        console.log('forgot pass otp page not found',error);
        res.status(500).send('server error');        
    }
}

const sendForgotPassOTP =async (req,res)=>{
    try {
        const {email} = req.body;
        const emailPattern = /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~.-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;
        const changePassEmail = await User.findOne({email:email});
        if(!email){
            req.flash('ermsg','Email required');
            return res.redirect('/repassEmail');
        }
        if (!emailPattern.test(email)){
        req.flash('ermsg','Email pattern does not match')
        return res.redirect('/repassEmail');
        }
         if(!changePassEmail){
    req.flash('ermsg','This Email is Not exists');
     return res.redirect('/repassEmail');
        }
        req.session.Email = email
        const otp = generateOtp();
        console.log('password change otp',otp)
        const emailSend = await sendVerificationEmail(email,otp);
        if(!emailSend){
           res.redirect('/repassEmail');
        }
        req.session.userOtp = otp;
        req.session.userEmail = email

        setTimeout(()=>{
            delete req.session.userOtp
            req.session.save((err)=>{
                if(err){
                    console.log('Error deleting session');
                }
            })
            console.log('otp expired');
          },60000)
        
        res.render('repassOtp')

    } catch (error) {
        console.log('forgot password otp is not working',error);
        res.status(500).send('server error');
        
    }
}
const loadchangePassword = async (req,res)=>{
    try {
        return res.render('changePassword',{msg:req.flash('ermsg')});
    } catch (error) {
        console.log('confrim password page not found');
        res.status(500).send('server error');
        
    }
}
const forgotOtpVerify = async(req,res)=>{
    try {
      
        let storedOtp = req.session.userOtp;
        
        
        if (!storedOtp) {
          req.flash('errorMsg', 'OTP has expired or is missing. Please try again.');
          return res.redirect('/repassOtp'); 
        }
    
       
        const { otp } = req.body;

    
        // Validate OTP
        if (otp !== storedOtp) {
          req.flash('errorMsg', 'Invalid OTP. Please try again.');
          return res.redirect('/repassOtp'); 
        }
    
        
        req.session.userOtp = null;
    //   console.log(req.session.userOtp);
       
        
        return res.render('changePassword',{msg:req.flash('ermsg')}); 
      } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).send('An error occurred. Please try again later.');
      }
    
}
const updateOldPassword = async(req,res)=>{
    try {
        const {newPassword,cnfmPassword} =req.body
         const userEmail = req.session.userEmail;
         if(newPassword!==cnfmPassword){
            req.flash('ermsg','Password does not match')
            return res.redirect('/changePassword'); 
         }
          if(newPassword == ''||cnfmPassword==''){
            req.flash('ermsg','All field required')
            return res.redirect('/changePassword');
         }
         const hashedPassword = await hashPassword(cnfmPassword)
         await User.updateOne(
            { email: userEmail },
            { $set: { password: hashedPassword } }
          )
         
          req.session.userLoged= true
         res.redirect('/login');
    } catch (error) {
        console.log('Change password error',error);
        res.status(500).send('server error');
    }
}




const loadUserProfile = async(req,res)=>{
    try {
        const userLoged = req.session.userLoged
        const userId =   req.session.userId 
        const user = await User.findById(userId)
      if(userLoged){
        return res.render('userProfile',{userLoged,userData:user});
    }else{
        res.redirect('/login')
    }
    } catch (error) {
        console.log('User Profile page not found',error);
        res.status(500).send('server error');
    }
}

const loadAddress = async(req,res)=>{
    try {
        const userLoged = req.session.userLoged
       const email =  req.session.userEmail 
       const user = await User.findOne({email:email})
        const addres = await Address.findOne({userId:user._id}).populate('addresses')
            return res.render('address',{
            userLoged,
            addres:addres
        });
    } catch (error) {
        console.log('address page not found',error);
        res.status(500).send('server error');
        
        
    }
}
const loadAddAddress = async(req,res)=>{
    try {
        const userLoged = req.session.userLoged
        return res.render('addAddress',{
            userLoged,
            msg:req.flash('err')
        });
    } catch (error) {
        console.log('add address page not found',error);
        res.status(500).send('server error');
        
    }
}
const addressAdd = async(req,res)=>{
    try {
         const {name, addressType,landMark,city,pincode,phone,altPhone,state} = req.body

         if(name == ''|| addressType==''||landMark==''||city==''||pincode==''||phone==''||altPhone==''||state==''){
            req.flash('err','All field required');
            return res.redirect('/addAddress');
         }

         const email = req.session.userEmail
         const user = await User.findOne({email:email})
        const addressData = {  
            name: name,
            addressType: addressType,
            landMark: landMark,
            city: city,
            state:state,
            pincode: pincode,
            phone: phone,
            altPhone: altPhone,
        };
        
        await Address.updateOne(
            { userId: user._id },
            { $push: { addresses: addressData } },
            { upsert: true } 
        );
         res.redirect('/address');
    } catch (error) {
        console.log('address adding error',error);
        res.status(500).send('server error');
        
    }
}
const loadEditeAddress = async(req,res)=>{
    try {
        const userLoged = req.session.userLoged
        const id = req.params.id


        if(!mongoose.Types.ObjectId.isValid(id)){
            return res.status(404).redirect('/404')
          }

        const addressDocument = await Address.findOne({
            "addresses._id": id,
          });
    
          const address = addressDocument.addresses.find((item) => item._id.toString() === id);

        return res.render('addressEdite',{address,userLoged});
    } catch (error) {
        console.log('edite address page not found',error);
        res.status(500).send('server error');
                
    }
}
const editAddress = async(req,res)=>{
    try {
        const {name,addressType,landMark,city,pincode,phone,altPhone,state} = req.body
        const email = req.session.userEmail
        const id = req.params.id
        const user = await User.findOne({email:email})
        const addressData = {  
            name: name,
            state:state,
            addressType: addressType,
            landMark: landMark,
            city: city,
            pincode: pincode,
            phone: phone,
            altPhone: altPhone,
        };
        
        await Address.updateOne(
            { userId: user._id },
            { $set: { addresses: addressData } },
            { upsert: true } 
        );
        res.redirect('/address');

    } catch (error) {
        console.log('edite address page error',error);
        res.status(500).send('server error');
        
    }
}
const deleteAddress = async(req,res)=>{
    try {
        const id = req.params.id
      
        const result = await Address.updateOne(
            { "addresses._id": id }, 
            { $pull: { addresses: { _id: id } } } 
          );
        res.redirect('/address');
    } catch (error) {
        console.log('address deleting error',error);
        res.status(500).send('server error');
        
    }
}

const profileEdite = async(req,res)=>{
    try {
        const userLoged = req.session.userLoged
        const id = req.params.id 

        if(!mongoose.Types.ObjectId.isValid(id)){
            return res.status(404).redirect('/404')
          }

        const findUser = await User.findById(id); 
        return res.render('profileEdite',{
            findUser,
            userLoged
        });
    } catch (error) {
        console.log('profile edite page is not found',error);
        res.status(500).send('server error');
        
    }
}
const editeProfile = async(req,res)=>{
    try {
        const {name,phone,email} = req.body
        const id = req.params.id
        const newData = {
            name:name,
            phone:phone,
            email:email,
        }
        await User.updateOne({_id:id},{$set:newData})
        res.redirect('/userProfile');

    } catch (error) {
        console.log('user profile editing error',error);
        res.redirect('/page-404')
        
    }
}
const updatePassword = async(req,res)=>{
    try {
        const id = req.params.id
       if(!mongoose.Types.ObjectId.isValid(id)){
          return res.status(404).redirect('/404')
        }
        return res.render('updatePassword',{msg:req.flash('err')})
    } catch (error) {
       console.log('change password page not found ',error)
       res.redirect('/page-404')
    }
}
const changePassword = async (req,res)=>{
    try {
        const {oldPassword,newPassword,cnfmPassword} = req.body
        const email = req.session.userEmail
      console.log('wich user is here',email)

        const userData = await User.findOne({email:email})
        if(oldPassword == ''|| newPassword == ''|| cnfmPassword == ''){
               req.flash('err','All Fields Requierd')
               return res.render('updatePassword',{msg:req.flash('err')})
        }
        const isPasswordValid = await checkPassword(oldPassword,userData.password)

        if(!isPasswordValid){
            req.flash('err','Old Password Not Match');
            return res.render('updatePassword',{msg:req.flash('err')})
        }
        if(newPassword !== cnfmPassword){
               req.flash('err','Password Not Match')
               return res.render('updatePassword',{msg:req.flash('err')})
        }
        const hashedPassword = await hashPassword(cnfmPassword)
        const updateData = await User.updateOne({email:email},{password:hashedPassword})
        res.redirect('/userProfile');

    } catch (error) {
        console.log('password changing error',error);
        res.redirect('/page-404')
    }
}



const loadWallet = async (req, res) => {
    try {
        let page = parseInt(req.query.page, 10) || 1;
        let limit = 4;
        let skip = (page - 1) * limit;

        const userLoged = req.session.userLoged;
        const email = req.session.userEmail;

        const user = await User.findOne({ email: email });
        if (!user) {
            req.flash('err', 'User not found');
            return res.redirect('/login');
        }

        // First, get the total count of walletData transactions
        const wallet = await Wallet.findOne({ userId: user._id }).populate('walletData').populate('userId');
        
        if (!wallet) {
            return res.render('wallet', {
                userLoged,
                wallet:{walletData:[]},
                totalPage: 0,
                currentPage: page, 
                data:0,
            });
        }

        const totalRecords = wallet.walletData.length;
        const totalPage = Math.ceil(totalRecords / limit);

        const paginatedWalletData = wallet.walletData.slice(skip, skip + limit);
       const balance = await Wallet.findOne({userId:user._id})
      
        

        res.render('wallet', {
            wallet: { ...wallet, walletData: paginatedWalletData },
            userLoged,
            data:wallet,
            totalPage,
            currentPage: page
        });
    } catch (error) {
        console.log('Wallet page not found', error);
        res.redirect('/page-404')
    }
};



const loadAbout = async (req,res)=>{
    try {
        const userLoged = req.session.userLoged
        return res.render('about',{
            userLoged
        });
    } catch (error) {
        console.log('load about page error',error);
        res.redirect('/page-404')
    }
}


module.exports ={
    loadHome,  //home page loading
    pageNotFound, //page not found page
    loadSignup, //sign up page loading
    signup,  //sign up page post
    loadLogin, // login page loading
    sendOTP,  //email verification
    signupEmail, //load email verification page
    verifyOtp,  //otp verification
    loginUser, // login post 
    logOut, //logout 
    otpPage, //otp page loading
    resendOTP,  //resend otp 
    changePassEmail, // change password email
    changePassOTP,  // change password otp page
    sendForgotPassOTP, // send otp in email
    forgotOtpVerify, //otp verification
    loadchangePassword, // change password page
    updateOldPassword, // updating old password and enter new password
    
    loadUserProfile ,// user profile page load
    loadAddress, // load address page
    loadAddAddress,  // load add address page
    addressAdd, // add address page post methods
    loadEditeAddress, // edite address page
    editAddress,  // edite address post method
    deleteAddress, //address deleteing
    profileEdite, // profile edite page load
    editeProfile,//edite profile post method

    updatePassword, // password updateing
    changePassword , // user password changing 
    loadWallet,
    loadAbout,
    forgotPassResendOtp
    
}