const User = require("../models/userSchema")

const userCheck = async (req,res,next)=>{
    try {
        if(!req.session.userLoged){
            return next()
        }
        const user=await User.findOne({email: req.session.userEmail})
        if(user && user.isBlocked){
          
               return res.render('page-404');
        }
        next()
    } catch (error) {
        console.log('user',error);
        res.status(500).send('server error')
    }
}
const userAuth = async (req,res,next)=>{
    try {
        const userLogged = req.session.userId 
        if(!userLogged){
            next();
        }else{
            return res.redirect('/')
        }
    } catch (error) {
        
    }
}
// const block = async (req,res)=>{
//     try {
//         const email = req.session.userEmail
//         const user = await User.findOne({email:email})

//         if(user.isBlocked){
//             return res.redirect('/login')
//         }else{
//             next();
//         }
//     } catch (error) {
        
//     }
// }


const auth = async (req,res,next)=>{
    try {
        
    } catch (error) {
        
    }
}

module.exports ={ 
    userCheck,
     userAuth,
    //  block


}