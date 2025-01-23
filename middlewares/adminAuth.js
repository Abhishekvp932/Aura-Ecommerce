const adminCheck=(req,res,next)=>{
    if(req.session.admin){
        next()
    }else{
        res.redirect('/admin')
    }
}

const adminAuth = (req,res,next)=>{
    try {
        const admin = req.session.admin
        if(!admin){
            return res.redirect('/admin');
        }else{
            return res.render('dashboard');
        }
    } catch (error) {
        
    }
}

module.exports=adminCheck