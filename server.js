const express = require('express')
const app = express();
const env = require('dotenv').config()
const path = require('path')
const session = require('express-session')
const flash = require('connect-flash');
const nocache = require('nocache');
const passport = require('./config/passport');
const userRouter = require('./routes/userRouter');
const adminRouter = require('./routes/adminRouter');
app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(session({
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized:true,
    cookie:{
        maxAge: null
    }
}))

app.use(passport.initialize());
app.use(passport.session());


app.use(flash());
app.use(nocache());
app.use(express.static(path.join(__dirname,'public')));
app.use(express.static(path.join(__dirname,'public/uploads')));
app.set('view engine','ejs');
app.set('views',[path.join(__dirname,'views/users'),path.join(__dirname,'views/admin')])
const db=require('./config/db');
db()
app.use('/',userRouter);
app.use('/admin',adminRouter);


app.use((req,res)=>{
    res.status(404)
     res.render('404')
})

app.listen(process.env.PORT,()=>{
    console.log('server 3005 is runing');
    
})