const User = require('../../models/userSchema');
const env = require('dotenv').config()
const nodemailer = require('nodemailer');
const Products = require('../../models/productSchema');
const Category = require('../../models/categorySchema');
const offers = require('../../models/offerSchema');
const Address = require('../../models/addressSchema');





const shoppingPage = async (req, res) => {
  try {
    const sort = req.query.sort || ''; 
    let sortCriteria = {};
    if (sort === 'low-to-high') {
      sortCriteria = { regularPrice: 1 }; 
      sortCriteria = { regularPrice: -1 }; 
    }

    let page = parseInt(req.query.page, 10) || 1;
    let limit = 9;

    const products = await Products.find({ isBlocked: false })
      .sort(sortCriteria)
      .populate('category')
      .limit(limit)
      .skip((page - 1) * limit);

    const count = await Products.countDocuments({ isBlocked: false });
    const totalPage = Math.ceil(count / limit);

    const userLoged = req.session.userLoged;
    const categories = await Category.find({ isListed: true });
    const categoryWithIds = categories.map((category) => ({
      _id: category._id,
      name: category.name,
    }));

    let offer = null;
    if (products.length > 0) {
      offer = await offers.findOne({ category: products[0].category._id });
    }

    return res.render('shopping', {
      userLoged,
      product: products,
      category: categoryWithIds,
      page,
      count,
      totalPage,
      currentPage: page,
      offer,
      sortOption: sort, 
    });
  } catch (error) {
    console.error('Shopping page is not found', error);
    res.status(500).send('Server error');
  }
};


const loadProductDetails = async(req,res)=>{
    try {
      
        const productId = req.params.id;
        const userLoged = req.session.userLoged;
       console.log(productId)
         const product = await Products.findById(productId);
         const category = await Category.findById(product.category);
        const offer = await offers.findOne({isActive:true}) 
        const allProduct = await Products.find({category: category._id})
        console.log(allProduct);
        
    if (!product) {
      req.flash('error', 'Product not found');
      return res.redirect('/shopping');
    }
   
    
    let randomNum=new Set()
    while(randomNum.size<3){
        const num=Math.floor(Math.random() * 10)
        if(num<allProduct.length){
            randomNum.add(num)
        }
    } 
    const ranNum=Array.from(randomNum)
   
    res.render('product-details', {
        userLoged,
        product,
        offer,
        ranNum,
        allProduct
      });
    } catch (error) {
        console.log('product details page not found',error);
        res.status(500).send('server error');
        
    }
}



const eachCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { sort, priceFrom, priceTo } = req.query;
    const userLoged = req.session.userLoged;
    
    const category = await Category.find({ _id: id });
    if (!category) {
      return res.redirect('/page-404');
    }
    
    const offer = await offers.findOne({ category: id, isActive: true });
    const offerActive = await offers.find({ isActive: true });
    const allCategory = await Category.find();

    let query = { category: id };
    
    if (priceFrom && priceTo) {
      query.regularPrice = {
        $gte: parseInt(priceFrom),
        $lte: parseInt(priceTo)
      };
    }
    
    let sortOptions = {};
    switch (sort) {
      case 'low-to-high':
        sortOptions = { regularPrice: 1 };
        break;
      case 'high-to-low':
        sortOptions = { regularPrice: -1 };
        break;
      case 'a-z':
        sortOptions = { productName: 1 };
        break;
      case 'z-a':
        sortOptions = { productName: -1 };
        break;
    }
    const sortedProducts = await Products.find(query).sort(sortOptions);

    if (offerActive) {
      res.render('category', {
        category,
        product: sortedProducts,
        allCategory,
        userLoged,
        offer,
        sortOption: sort,
        priceFrom: priceFrom || '',
        priceTo: priceTo || ''
      });
    }
  } catch (error) {
    console.log('Category page is not found', error);
    res.status(500).send('Server error');
  }
};
const reviewAdding = async (req, res) => {
  try {
    const id = req.params.id;
    const { rating, comment } = req.body;
    const email = req.session.userEmail;

  
    const user = await User.findOne({ email:email});
    if (!user) {
      req.flash('err', 'User not found. Please log in to add a review.');
      return res.redirect(`/product-details/${id}`);
    }

    
    const numericRating = Number(rating);
    if (!numericRating || numericRating < 1 || numericRating > 5) {
      req.flash('err', 'Rating must be a valid number between 1 and 5.');
      return res.redirect(`/product-details/${id}`);
    }    
    const product = await Products.findById(id);
    if (!product) {
      req.flash('err', 'Product not found.');
      return res.redirect('/shopping');
    }

    
    product.reviews.push({
      userId: user._id,
      rating: numericRating,
      comment: comment.trim(),
      date: new Date(),
    });

    await product.save();

    req.flash('success', 'Review added successfully.');
    res.redirect(`/product-details/${id}`);
  } catch (error) {
    console.error('Review adding error:', error);
    res.status(500).send('Server error');
  }
};



module.exports = {
    shoppingPage, //shopping page load
    loadProductDetails, //product details page load
    eachCategory, //categorty side bar
    reviewAdding, // review adding
}