const admins = require("../../models/adminSchema");
const User = require("../../models/userSchema");
const { options } = require("../../routes/userRouter");
const Category = require("../../models/categorySchema");
const Products = require("../../models/productSchema");
const Offer = require('../../models/offerSchema');
const path = require("path");
const sharp = require("sharp");
const fs = require("fs");
const Product = require("../../models/productSchema");
const router = require("../../routes/userRouter");
const Address = require('../../models/addressSchema');


const loadDashboard = async (req, res) => {
  try {
    return res.render('dashboard');
  } catch (error) {
    console.log("admin dashboard not found");
    res.status(500).send("server error");
  }
};

const loadLogin = async (req, res) => {
  try {
    if(req.session.isLogged){
      return res.redirect('/admin/dashboard')
    }
    return res.render("adminLogin", { msg: req.flash("err") });
    // return res.send("helo world")
  } catch (error) {
    console.log("page not found");
    res.status(500).send("server error");
  }
};

const adminLogin = async (req, res) => {
  const { email, password } = req.body;
  console.log(email);
  try {
    const admin = await admins.findOne({ email: email, password: password });

    if (!admin) {
      req.flash("err", "Incorrect Password or Email");
      return res.redirect("/admin");
    }
    req.session.admin = true;
    req.session.isLogged = true;
    return res.redirect("/admin/dashboard");
  } catch (error) {
    console.log("admin login is not working");
    res.status(500).send("server is not working");
  }
};


const adminLogout = async (req, res) => {
  try {
   
    req.session.destroy(() => {
      res.redirect("/admin");
    });
  
  } catch (error) {
    console.log("admin logout error");
    res.status(500).send("server erro");
  }
};

module.exports = {
  loadLogin,
  loadDashboard,
  adminLogin,
  adminLogout,
 
 
 
  

 

  
 
  
  
  
};
