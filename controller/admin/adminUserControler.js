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





const loadUsers = async (req, res) => {
    try {
      let page = 1;
      if (req.query.page) {
        page = parseInt(req.query.page, 10);
      }
      let limit = 4;
      const Users = await User.find()
        .limit(limit * 1)
        .skip((page - 1) * limit);
      const count = await User.countDocuments();
      const totalPages = Math.ceil(count / limit);
  
      
      return res.render("users", {
        Users,
        count,
        totalPages,
        currentPage: page,
      });
    } catch (error) {
      console.log("user page not found");
      res.status(500).send("server error");
    }
  };



  const userBlocked = async (req, res) => {
    try {
      const id = req.query.id;
  
      await User.updateOne({ _id: id }, { $set: { isBlocked: true } });
      res.redirect("/admin/users");
    } catch (error) {
      console.log("user blocking error");
      res.status(500).send("server error");
    }
  };

  const userUnBlocked = async (req, res) => {
    try {
      const id = req.query.id;
      await User.updateOne({ _id: id }, { $set: { isBlocked: false } });
      res.redirect("/admin/users");
    } catch (error) {
      console.log("user unblocking error");
      res.status(500).send("server error");
    }
  };


  module.exports = {
    loadUsers,
    userBlocked,
    userUnBlocked
  }