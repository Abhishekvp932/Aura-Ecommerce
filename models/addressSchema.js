const mongoose = require('mongoose')
const {Schema} = mongoose;



const addressSchema = new Schema({
    userId:{
        type:Schema.Types.ObjectId,
        ref:"User",
       
    },
    addresses:[{
        addressType:{
            type:String,
            
        },
        name:{
            type:String,
           
        },
        city:{
            type:String,
            
        },
        landMark:{
            type:String,
           
        },
        state:{
             type:String,
           
        },
        pincode:{
            type:Number,
           
        },
        phone:{
            type:String,
            

        },
        altPhone:{
           type:String,
           
        }
    }]
})

const Address = mongoose.model('Address',addressSchema)


module.exports=Address;