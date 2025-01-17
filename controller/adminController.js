const admins = require("../models/adminSchema");
const User = require("../models/userSchema");
const { options } = require("../routes/userRouter");
const Category = require("../models/categorySchema");
const Products = require("../models/productSchema");
const Offer = require('../models/offerSchema');
const path = require("path");
const sharp = require("sharp");
const fs = require("fs");
const Product = require("../models/productSchema");
const router = require("../routes/userRouter");
const loadDashboard = async (req, res) => {
  try {
    res.render("dashboard");
  } catch (error) {
    console.log("admin dashboard not found");
    res.status(500).send("server error");
  }
};

const loadLogin = async (req, res) => {
  try {
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
const loadOrders = async (req, res) => {
  try {
    return res.render("orders");
  } catch (error) {
    console.log("orders page is not found");
    res.status(500).send("server error");
  }
};
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
    console.log(Users);
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
const loadOffer = async (req, res) => {
  try {
    const offers = await Offer.find().populate('category')
    console.log(offers);
    
    return res.render("offers",{
      offers
    });
  } catch (error) {
    console.log("offer page not found");
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
    console.log(req.body);

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
const addProductForm = async (req, res) => {
  try {
    const categorie = await Category.find({isListed:true});
    return res.render("addProdcuts", { categorie });
  } catch (error) {
    console.log("add product page not found");
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
const loadProducts = async (req, res) => {
  try {
    let page = 1;
    if (req.query.page) {
      page = parseInt(req.query.page, 10);
    }
    const limit = 5;
    const product = await Products.find()
      .populate("category")
      .limit(limit)
      .skip((page - 1) * limit);
    const count = await Products.countDocuments();
    const totalPage = Math.ceil(count / limit);
    return res.render("products", {
      product,
      totalPage,
      currentPage: page,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
};

const productsAdd = async (req, res) => {
  try {
    const products = req.body;
    const { category } = req.body;
    const productExists = await Products.findOne({
      productName: products.productName,
    });
    if (productExists) {
      req.flash("err", "Product already exists, please try another name");
      return res.redirect("/admin/addProducts");
    }

    const image = [];
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const originalImagePath = req.files[i].path;

        const uploadsDir = path.join(__dirname, "../public/uploads");

        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const resizedImageFilename = `resized-${req.files[i].filename}`;
        const resizedImagePath = path.join(uploadsDir, resizedImageFilename);

        await sharp(originalImagePath)
          .resize({ width: 300, height: 300 })
          .toFile(resizedImagePath);

        image.push(resizedImageFilename);
      }
    }

    const newProduct = {
      productName: products.productName,
      description: products.description,
      regularPrice: products.regularPrice,
      quantity: products.quantity,
      category: products.category,
      size: {
        sizeS: products.small,
        sizeM: products.medium,
        sizeL: products.large,
        sizeXL: products.XL,
        sizeXXL: products.XXL,
      },
      colors: products.colors,
      productImage: image,
      status: "Available",
    };

    await Products.insertMany(newProduct);

    return res.redirect("/admin/products");
  } catch (error) {
    console.log(error.message)
    console.log("Product adding Problem", error);
    res.status(500).send("Server error");
  }
};
const editeProduct = async (req,res)=>{
  try {
    const id = req.params.id;

    const product = await Product.findById(id);
    const category = await Category.find();
    res.render("editeProduct", { product,category });
  } catch (error) {
    console.log('product edite page is not found',error);
    res.status(500).send('server error');
    
  }
}
const productEdite = async (req,res)=>{
  try {
    const products = req.body;
    const id = req.params.id;

    const image = [];
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const originalImagePath = req.files[i].path;

        const uploadsDir = path.join(__dirname, "../public/uploads");

        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const resizedImageFilename = `resized-${req.files[i].filename}`;
        const resizedImagePath = path.join(uploadsDir, resizedImageFilename);

        await sharp(originalImagePath)
          .resize({ width: 300, height: 300 })
          .toFile(resizedImagePath);

        image.push(resizedImageFilename);
      }
    }

    const updatedProduct = {
      productName: products.productName,
      description: products.description,
      regularPrice: products.regularPrice,
      quantity: products.quantity,
      category:products.category,
      size: {
        sizeS: products.small,
        sizeM: products.medium,
        sizeL: products.large,
        sizeXL: products.XL,
        sizeXXL: products.XXL,
      },
      colors: products.colors,
      productImage: image.length==0? req.body.existingImages : image,
      status: "Available",
    }
    console.log(updatedProduct)
    await Products.updateOne({ _id: id }, { $set: updatedProduct });
    res.redirect("/admin/products");
  } catch (error) {
    console.log(error.message)
    console.log('products adding error',error);
    res.status(500).send('server error');
    
  }
}
const productBlock = async (req,res)=>{
  try {
    const id = req.params.id
    console.log(id);
    

    await Product.findByIdAndUpdate(id,{$set:{isBlocked:true}})
    return res.redirect('/admin/products');
  } catch (error) {
    console.log('product blocking error',error);
    res.status(500).send('server error');
    
  }
}
const productUnBlock = async (req,res)=>{
  try {
    const id = req.params.id
    await Product.findByIdAndUpdate(id,{$set:{isBlocked:false}})
    return res.redirect('/admin/products');
  } catch (error) {
    console.log('product unbloking error');
    res.status(500).send('server error');
    
  }
}
const offerAdd = async (req,res)=>{
  try {

    const category = await Category.find()    
    return res.render('addOffers',{category})
  } catch (error) {
    console.log('offer adding page not found');
    res.status(500).send('server error');
  }
}

const addOffer = async(req,res)=>{
  try {
    console.log(req.body);
    const offer = req.body;
    // const {category} = req.body
    const category = await Category.findOne({name: offer.category})
      const offerData ={
        startDate:offer.startDate,
        endDate:offer.endDate,
        minPrice:offer.minPrice,
        maxPrice:offer.maxPrice,
        category: category._id,
        offer:offer.offer
      }
      await Offer.insertMany(offerData);
     res.redirect('/admin/offers');
  } catch (error) {
    console.log('offer adding error',error);
    res.status(500).send('server error');
    
  }
}
const offerList = async(req,res)=>{
  try {
    const id = req.params.id
    await Offer.updateOne({_id:id},{$set:{isActive:true}})
    res.redirect('/admin/offers');

  } catch (error) {
    console.log('product listing error',error);
    res.status(500).send('server error');
    
    
  }
}
const offerUnList = async(req,res)=>{
  try {
    const id = req.params.id
    await Offer.updateOne({_id:id},{$set:{isActive:false}})
    res.redirect('/admin/offers');
  } catch (error) {
    console.log('offer unlisting error');
    res.status(500).send('server error');
  }
}
const editeOffer = async(req,res)=>{
  try {

    const id = req.params.id
    const offerFind = await Offer.findById(id)
    const category = await Category.find()
    res.render('editeOffer',{offerFind,
      category
    })
  } catch (error) {
    console.log('edite page is not found',error);
    res.status(500).send('server error');
    
  }
}
const offerEdite = async(req,res)=>{
  try {
   const id = req.params.id
    const offer = req.body
    const category = await Category.findOne({name: offer.category})
    const updateOfferData ={
      startDate:offer.startDate,
      endDate:offer.endDate,
      minPrice:offer.minPrice,
      maxPrice:offer.maxPrice,
      category: category._id,
      offer:offer.offer
    }
    await Offer.updateOne({_id:id},{$set:updateOfferData})
    res.redirect('/admin/offers');
  } catch (error) {
    
  }
}

module.exports = {
  loadLogin,
  loadDashboard,
  adminLogin,
  loadProducts,
  loadOrders,
  loadUsers,
  adminLogout,
  loadCategory,
  loadOffer,
  userBlocked,
  userUnBlocked,
  categoryAdd,
  CategoryAdding,
  editeCategory,
  categoryEdite,
  addProductForm,
  categoryListed,
  categoryUnList,
  productsAdd,
  productEdite,
  editeProduct,
  productBlock,
  productUnBlock,
  offerAdd,
  addOffer,
  offerList,
  offerUnList,
  editeOffer,
  offerEdite,
  
};
