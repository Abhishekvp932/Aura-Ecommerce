const userCheck = (req,res,next)=>{
    if(!req.session.userLoged){
        next();
    }else{
        res.redirect('/');
    }
}


module.exports = userCheck