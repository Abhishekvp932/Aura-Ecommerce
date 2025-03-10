    const mongoose = require('mongoose');
    const {Schema} = mongoose;

    const userSchema = new Schema({
        name:{
            type:String,
            required : false

        },
        email:{
            type:String,
            required:false,
        },
        phone:{
            type:String,
            required:false,
           sparse:true,
        },
        googleId:{
            type:String,
            
        },
        password:{
            type:String,
            required:false
        },
        isBlocked:{
            type:Boolean,
            default:false
        },
        isAdmin:{
            type:Boolean,
            default:false
        },
       orderHistory:[{
            type:Schema.Types.ObjectId,
            ref:"Order",
        }],
        createdOn:{
            type:Date,
            default:Date.now,
        },
        referalCode:{
            type:String,
        },
        referredBy: { 
            type: String, 
            default: null 
        },
        redeemedUser:[{
            type:Schema.Types.ObjectId,
            ref:"User",
          
        }],

        searchHistory:[{
            category:{
                type:Schema.Types.ObjectId,
                ref:"Category"
            },
            brand:{
                type:String
            },
            searchOn:{
                type:Date,
                default:Date.now
            }
        }]

    })

    const User = mongoose.model('User',userSchema);

    module.exports = User;