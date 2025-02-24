const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    balance: {
        type: Number,
        required: true,
        default: 0
    },
    currency: {
        type: String,
        required: true,
        default: 'INR'
    },
    walletData:[{
        orderId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Order',
        },
        createdOn: {
            type: Date,
            default: Date.now,
            required: true,
        },
        status:{
            type:String,
            enum: ['Credit','Debit'],
        },
        price:{
            type:Number
        },
        productName:{
            type:String
        },
        orderStatus:{
            type:String
        }
    }]
    ,
    transactions: [
        {
            amount: Number,
            type: {
                type: String,
                enum: ['credit','debit'],
                required: true
            },
            timestamp: {
                type: Date,
                default: Date.now
            },
            reference: String
        }
    ]
}, { timestamps: true });

const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = Wallet;
