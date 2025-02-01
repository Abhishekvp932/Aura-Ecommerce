const mongoose = require('mongoose')

const {Schema} = mongoose;


const productSchema = new Schema({
    productName: {
        type: String,
    },
    description: {
        type: String,
    },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true
        
     },

    regularPrice: {
        type: Number,
    },
    salePrice: {
        type: Number,
        required: false,
        validate: {
            validator: function (value) {
                return value <= this.regularPrice;
            },
            message: "Sale price cannot be higher than regular price"
        }
    },
    productOffer: {
        type: Number,
        default: 0
    },
    quantity: {
        type: Number,
        default: 0
    },
    color: {
        type: String,
    },
    productImage: {
        type: [String],
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['Available', 'Out of Stock', 'Discontinued'],
        default: "Available"
    },
    size: {
            small: {
                type: Number,
                default: 0
            },
            medium: {
                type: Number,
                default: 0
            },
            large: {
                type: Number,
                default: 0
            },
            XL: {
                type: Number,
                default: 0
            },
            XXL: {
                type: Number,
                default: 0
            }
    },
    createdAt:{
        type:Date,
        default:Date.now
    },
    reviews: [
        {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: "User"},
            rating: { type: Number, min: 1, max: 5},
            comment: { type: String, required: false },
            date: { type: Date, default: Date.now }
        }
    ],

}, { timestamps: true });

const Product = mongoose.model('Product',productSchema);

module.exports = Product;