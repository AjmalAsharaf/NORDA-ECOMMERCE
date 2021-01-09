var db=require('../config/connection')
var collection = require('../config/collection')

module.exports={
    addProducts:function(product){
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product).then((data)=>{
               
                resolve(data.ops[0]._id)
            })
            
        })
    },
    viewAllProducts:function(){
        return new Promise(async(resolve,reject)=>{
            let products= await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()

            resolve(products)
        })
    }
}