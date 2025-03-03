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

const mongoose = require ('mongoose')



const loadCategory = async (req, res) => {
    try {
      let page = 1;
      if (req.query.page) {
        page = parseInt(req.query.page, 10);
      }
      let limit = 4;
  
      const category = await Category.find()
        .limit(limit * 1)
        .skip((page - 1) * limit);
      const count = await Category.countDocuments();
      const totalPage = Math.ceil(count / limit);
  
      return res.render("categories", {
        category,
        count,
        totalPage,
        currentPage: page,
      });
    } catch (error) {
      console.log("category page not found");
      res.status(500).send("server error");
    }
  };
  

  const categoryAdd = async (req, res) => {
    try {
      return res.render("addCategory",{msg:req.flash('errMsg')});
    } catch (error) {
      console.log("category page nt found");
      res.status(500).send("server error");
    }
  };


  const CategoryAdding = async (req, res) => {
    try {
      const { name, description } = req.body;
  
      if (name == "" || description == "") {
        req.flash("errMsg", "All Field Required");
        return res.redirect("/admin/addCategory");
      }
      const categoryCheck = await Category.find({name:name})
      if(categoryCheck){
        req.flash('errMsg','The Category is already exists');
        return res.redirect('/admin/addCategory');
      }
      const data = {
        name: name,
        description: description,
      };
      await Category.insertMany(data);
      res.redirect("/admin/categories");
    } catch (error) {
      console.log("category adding error");
      res.status(500).send("server error");
    }
  };


  const categoryEdite = async (req, res) => {
    try {
      const id = req.params.id;

      if(!mongoose.Types.ObjectId.isValid(id)){
        return res.status(404).redirect('/404')
      }
  
      const findCate = await Category.findById(id);
      res.render("editeCategory", { findCate });
    } catch (error) {
      console.log("edite category page not found");
      res.status(500).send("server error");
    }
  };
  

  const editeCategory = async (req, res) => {
    try {
      const { name, description } = req.body;
      const id = req.params.id;
  
      const data = {
        name: name,
        description: description,
      };
      await Category.updateOne({ _id: id }, { $set: data });
      res.redirect("/admin/categories");
    } catch (error) {
      console.log("category editeing");
      res.status(500).send("server error");
    }
  };

  const categoryListed = async (req, res) => {
    try {
      const id = req.query.id;
      await Category.updateOne({ _id: id }, { $set: { isListed: true } });
      res.redirect("/admin/categories");
    } catch (error) {
      console.log("category listing error", error);
      res.status(500).send("server error");
    }
  };

  const categoryUnList = async (req, res) => {
    try {
      const id = req.query.id;
      await Category.updateOne({ _id: id }, { $set: { isListed: false } });
      res.redirect("/admin/categories");
    } catch (error) {
      console.log("category unlisting error", error);
      res.status(500).send("server error");
    }
  };

  module.exports = {
    loadCategory,
    categoryAdd,
    CategoryAdding,
    categoryEdite,
    editeCategory,
    categoryListed,
    categoryUnList
  }