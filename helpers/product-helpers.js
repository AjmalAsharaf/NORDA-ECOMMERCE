var db=require('../config/connection')
var collection = require('../config/collection')

var objId=require('mongodb').ObjectID
const { ObjectId } = require('mongodb')
const { response } = require('express')

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
    },
    deleteProduct:function(proId){
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).removeOne({_id:objId(proId)})
            resolve()
        })
    },
    viewOnePorduct:function(proId){
        return new Promise(async(resolve,reject)=>{
            let product=await db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objId(proId)})
            resolve(product)
        })
    },
    updateProduct:function(proId,product){
        console.log(product,'mongo');
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objId(proId)},{
                $set:{
                    productName:product.productName,
                    productCategory:product.productCategory,
                    productSubCat:product.productSubCat,
                    productPrice:product.productPrice,
                    productQty:product.productQty,
                    productDes:product.productDes
                }
            }).then((response)=>{
                resolve()
            })
            
        })
    }
}