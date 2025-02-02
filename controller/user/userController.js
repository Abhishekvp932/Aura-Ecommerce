const User = require('../../models/userSchema');
const env = require('dotenv').config()
const nodemailer = require('nodemailer');
const Products = require('../../models/productSchema');
const Category = require('../../models/categorySchema');
const offers = require('../../models/offerSchema');
const Address = require('../../models/addressSchema');
const Product = require('../../models/productSchema');

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
        }else if(!emailPattern.test(email)){
            req.flash('emailReq','Email pattern does not match')
            return res.redirect('/verifyEmail');
        }

        req.session.userEmail=email

        const otp = generateOtp();
        const emailSend = await sendVerificationEmail(email,otp);
        if(!emailSend){
           res.redirect('/verifyEmail');
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
        
        res.render('otpVerify',{msg:req.flash('errorMsg')})
        console.log('otp is ',otp);

    } catch (error) {
        console.log('email verification page not found')
        res.redirect('/page-404');
    }

}
const resendOTP = async(req,res)=>{
   try {
    const email=req.session.userEmail
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
            console.log('otp expired');
          },60000);
          console.log('resend otp is',otp);
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
      
      
      if (!storedOtp) {
        req.flash('errorMsg', 'OTP has expired or is missing. Please try again.');
        return res.redirect('/otpVerify'); 
      }
  
     
      const { otp } = req.body;
      console.log('Received OTP:', otp);
      console.log('Stored OTP:', storedOtp);
  
      // Validate OTP
      if (otp !== storedOtp) {
        req.flash('errorMsg', 'Invalid OTP. Please try again.');
        return res.redirect('/otpVerify'); 
      }
  
      
      req.session.userOtp = null;
    console.log(req.session.userOtp);
     
      
      return res.render('signup', {msg:req.flash('err')}); 
    } catch (error) {
      console.error('Error verifying OTP:', error);
      res.status(500).send('An error occurred. Please try again later.');
    }
  };
  
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
        const user = await User.findOne({ email: email, password: password});
        if (!user) {
            req.flash('err', 'User not found or incorrect password');
            return res.redirect('/login');
        }else if(user.isBlocked){
            req.flash('err','this user cant access the page');
            return res.redirect('/login');
        }
        req.session.userLoged = true;
        req.session.userEmail = email
        req.session.userId = user._id
        res.redirect('/'); 
    } catch (error) {
        console.error('Login page not working:', error);
        req.flash('err', 'An error occurred while processing your request');
        res.render('login', { mg: req.flash('err') });
    }
};


const signup = async(req,res)=>{    
    const email = req.session.userEmail;
     const {name,password,confirmpassword,phone  } = req.body;
    //  console.log(req.body);
     
     const passwordpattern = /^[A-Za-z0-9]{6,}$/
     if(!passwordpattern.test(password)){
        req.flash('err','password doesnt match the criteria')
        return res.render('signup',{msg:req.flash('err')})
     }else if(password !== confirmpassword){
        req.flash('err','Passwords do not match. Please ensure both fields are identical')
        return res.render('signup',{msg:req.flash('err')});
     }else if(name == ''||password == ''|| confirmpassword =='' || phone == ''){
         req.flash('err','all filed must be required')
         res.render('signup',{msg:req.flash('err')})
     }
     await User.insertMany({
        email:email,
        name:name,
        phone:phone,
        password:password,
        confirmpassword:confirmpassword
     })
     req.session.userLoged = true,
       res.render('login',{mg:req.flash('err')});
}
const loadSignup = async(req,res)=>{
    try {
        return res.render('signup',{msg:req.flash('err')});
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
const product = await Product.find()


      res.render('home',{ userLoged ,product});
    } catch (error) {
        console.log("home page not found")
        res.status(500).send('server error')
    }
} 

const logOut = async (req,res)=>{
    try {
        req.session.destroy(()=>{
            res.redirect('/')
        }); 
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
        const changePassEmail = await User.find({email:email});
        if(!email){
            req.flash('ermsg','Email required');
            return res.redirect('/repassEmail');
        }else if (!emailPattern.test(email)){
        req.flash('ermsg','Email pattern does not match')
        return res.redirect('/repassEmail');
        }else if(!changePassEmail){
    req.flash('ermsg','This Email is Not exists');
    return req.redirect('/repassEmail');
        }
        req.session.userEmail = email
        const otp = generateOtp();
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
        console.log('otp is ',otp);

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
        console.log('Received OTP:', otp);
        console.log('Stored OTP:', storedOtp);
    
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
         }else if(newPassword == ''||cnfmPassword==''){
            req.flash('ermsg','All field required')
            return res.redirect('/changePassword');
         }
         await User.updateOne(
            { email: userEmail },
            { $set: { password: cnfmPassword } }
          )
         
          req.session.userLoged= true
         res.redirect('/');
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
       console.log(email)
       const user = await User.findOne({email:email})
       console.log(user)
        const addres = await Address.findOne({userId:user._id}).populate('addresses')
        console.log('user address',addres)
        return res.render('address',{
            userLoged,
            addres:addres
        });
        console.log(addres)
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
         console.log('Request body:', req.body);

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
        console.log('edite address id is',id)

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
        console.log(id)
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
        console.log('delete address id is',id)
      
        const result = await Address.updateOne(
            { "addresses._id": id }, 
            { $pull: { addresses: { _id: id } } } 
          );
      console.log('add data',result)
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
        const findUser = await User.findById(id); 
        console.log(findUser)  
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
        console.log(newData)
        await User.updateOne({_id:id},{$set:newData})
        res.redirect('/userProfile');

    } catch (error) {
        console.log('user profile editing error',error);
        res.status(500).send('server error');
        
    }
}
const updatePassword = async(req,res)=>{
    try {
        const id = req.params.id
       

        return res.render('updatePassword',{msg:req.flash('err')})
    } catch (error) {
       console.log('change password page not found ',error)
       res.status(500).send('server error');
    }
}
const changePassword = async (req,res)=>{
    try {
        const {oldPassword,newPassword,cnfmPassword} = req.body
        const email = req.session.userEmail
        console.log('passwords is',req.body)

        const userData = await User.findOne({password:oldPassword})
        if(oldPassword == ''|| newPassword == ''|| cnfmPassword == ''){
               req.flash('err','All Fields Requierd')
               return res.render('updatePassword',{msg:req.flash('err')})
        }
        if(!userData){
            req.flash('err','Old Password Not Match');
            return res.render('updatePassword',{msg:req.flash('err')})
        }
        if(newPassword !== cnfmPassword){
               req.flash('err','Password Not Match')
               return res.render('updatePassword',{msg:req.flash('err')})
        }
        const updateData = await User.updateOne({email:email},{password:cnfmPassword})
        res.redirect('/userProfile');

    } catch (error) {
        console.log('password changing error',error);
        res.status(500).send('server error');
    }
}



const loadWallet = async(req,res)=>{
    try {
        const userLoged = req.session.userLoged
        return res.render('wallet',{
            userLoged,
        })

    } catch (error) {
        console.log('wallet page not found',error)
        res.status(500).send('server error');
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
    
}