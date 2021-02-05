var db = require('../config/connection')
var collection = require('../config/collection')

var objId = require('mongodb').ObjectID
const { ObjectId } = require('mongodb')
const { response } = require('express')
const moment = require('moment')

module.exports = {
    addProducts: function (product) {

        product.productPrice = parseInt(product.productPrice)
        product.productQty = parseInt(product.productQty)

        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product).then((data) => {

                resolve(data.ops[0]._id)
            })

        })
    },
    viewAllProducts: function () {
        return new Promise(async (resolve, reject) => {
            
           
            let currentDate=moment(new Date).format('L')
            currentDate=Date.parse(currentDate)
            console.log('current date',currentDate);
            let fromDate
            let toDate
            
            let offerProducts=await db.get().collection(collection.PRODUCT_COLLECTION).aggregate([
                {
                    $match:{offer:{$exists:true}}
                }
            ]).toArray()
            console.log('offer products',offerProducts)
            offerProducts.forEach(element => {
                fromDate=Date.parse(element.startDate)
                toDate=Date.parse(element.endDate)
                console.log('number date is',fromDate);
                if(fromDate >= currentDate && currentDate <= toDate){
                    console.log('Date is ok for',element.productName)
                }else{
                    db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objId(element._id)},{
                        $set:{
                            productPrice:element.oldPrice
                        },
                        $unset:{
                            oldPrice:1,
                            startDate:1,
                            endDate:1,
                            offer:1
                        }
                    })
                    db.get().collection(collection.CATEGORY).updateOne({productSubCat:element.productSubCat},
                        {
                            $unset:{
                                offer:1,
                                startDate:1,
                                endDate:1
                            }
                        })
                    
                }
                
            });
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },
    deleteProduct: function (proId) {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).removeOne({ _id: objId(proId) })
            resolve()
        })
    },
    viewOnePorduct: function (proId) {
        return new Promise(async (resolve, reject) => {
            let product = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objId(proId) })
            resolve(product)
        })
    },
    updateProduct: function (proId, product) {
        product.productPrice = parseInt(product.productPrice)
        product.productQty = parseInt(product.productQty)

        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objId(proId) }, {
                $set: {
                    productName: product.productName,
                    productCategory: product.productCategory,
                    productSubCat: product.productSubCat,
                    productPrice: product.productPrice,
                    productQty: product.productQty,
                    productDes: product.productDes
                }
            }).then((response) => {
                resolve()
            })

        })
    },
    insertCategory: function (data) {
        return new Promise(async (resolve, reject) => {
            let category = await db.get().collection(collection.CATEGORY).findOne({ productSubCat: data.productSubCat })
            if (category) {
                reject()
            } else {
                db.get().collection(collection.CATEGORY).insertOne({ productSubCat: data.productSubCat })
                resolve()
            }
        })
    },
    showCategory: function () {
        return new Promise(async (resolve, reject) => {
            let category = await db.get().collection(collection.CATEGORY).find().toArray()
            resolve(category)
        })
    },
    deleteCategory: function (proId) {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.CATEGORY).removeOne({ _id: objId(proId) })
            resolve()
        })
    },
    showOneCategory: function (proId) {
        return new Promise(async (resolve, reject) => {
            category = await db.get().collection(collection.CATEGORY).findOne({ _id: objId(proId) })

            resolve(category)
        })
    },
    updateCategory: function (proId, subCategory) {

        return new Promise(async (resolve, reject) => {
            category = await db.get().collection(collection.CATEGORY).findOne({ productSubCat: subCategory })
            if (category) {
                reject()
            } else {

                db.get().collection(collection.CATEGORY).updateOne({ _id: objId(proId) }, {
                    $set: {
                        productSubCat: subCategory
                    }
                }).then((response) => {
                    resolve()
                })

            }
        })
    },
    productFileter: (category) => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find({ productCategory: category }).toArray()

            resolve(products)
        })
    },
    searchProduct: (data) => {
        console.log('Mongo data', data);
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find({ productName: data }).toArray()

            if (products.length > 0) {
                resolve(products)
            } else {
                reject()
            }
        })
    },
    updateOffer: (proId, data) => {
        console.log('data ', data)
        offer = parseInt(data.offer)
        price = parseInt(data.productPrice)
        offerPrice = price - ((price * offer) / 100)
        console.log('offer', offerPrice);
        return new Promise(async (resolve, reject) => {
            let product = await db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objId(proId) }, {
                $set: {
                    offer: offer,
                    productPrice: offerPrice,
                    oldPrice: price
                }
            })
            resolve()
        })
    },
    removeOffer: (proId) => {
        return new Promise(async (resolve, reject) => {
            let oldPrice = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objId(proId) })
            console.log('oldprice', oldPrice.oldPrice);
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objId(proId) }, {
                $set: {
                    productPrice: oldPrice.oldPrice
                },
                $unset: {
                    oldPrice: 1,
                    offer: 1
                }
            }).then((response) => {
                resolve()
            })
        })

    },
    updateCategoryOffer: (proId, offer) => {
        return new Promise(async (resolve, reject) => {
            let operations
            let offerPer=parseInt(offer.offer)
            let startDate=moment(offer.startDate).format('L')
            let endDate=moment(offer.endDate).format('L')
            
            console.log('date for storing',startDate,endDate);
            console.log('all data ', proId, 'offer', offer)
            let allCategoryOffers = await db.get().collection(collection.PRODUCT_COLLECTION).aggregate([
                {
                    $match: { productSubCat: offer.productName, offer: { $exists: true } }
                },
                {
                    $set: {
                        productPrice: '$oldPrice'
                    }
                },
                {
                    $unset: ['offer', 'oldPrice']
                }
            ]).toArray()
            console.log('allCate', allCategoryOffers);
            console.log('length',allCategoryOffers.length)
            if (allCategoryOffers.length > 0) {

                for (i = 0; i < allCategoryOffers.length; i++) {
                    console.log('data,',allCategoryOffers[i].productPrice);
                    db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objId(allCategoryOffers[i]._id) }, {
                        $set: {
                            productPrice: allCategoryOffers[i].productPrice,


                        },
                        $unset: {
                            oldPrice: 1,
                            offer: 1,
                            startDate:1,
                            endDate:1
                        }
                    })
                }
               

            } 
            let Allproducts=await db.get().collection(collection.PRODUCT_COLLECTION).find({productSubCat:offer.productName}).toArray()
            console.log('existing products',Allproducts);
            for(i=0;i<Allproducts.length;i++){
                
                operations=(Allproducts[i].productPrice)-((Allproducts[i].productPrice*offerPer)/100)
                db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objId(Allproducts[i]._id)},{
                    $set:{
                        productPrice:operations,
                        oldPrice:Allproducts[i].productPrice,
                        offer:offerPer,
                        startDate:startDate,
                        endDate:endDate

                    }
                })
            }
            db.get().collection(collection.CATEGORY).updateOne({_id:objId(proId)},{
                $set:{
                    offer:offerPer,
                    startDate:startDate,
                    endDate:endDate
                }
            })


            resolve()

        })
    },

    removeCategoryOffer:(name)=>{
        console.log('name',name)
        return new Promise(async(resolve,reject)=>{
            let products=await db.get().collection(collection.PRODUCT_COLLECTION).aggregate([
                {
                    $match:{productSubCat:name,offer:{$exists:true}}
                },
                {
                    $set: {
                        productPrice: '$oldPrice'
                    }
                },
                {
                    $unset: ['offer', 'oldPrice']
                }




            ]).toArray()
            console.log('produts here',products)
            products.forEach(element => {
                console.log('for each',element.productName);
                db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:ObjectId(element._id)},
                {
                    $set:{
                        productPrice:element.productPrice,

                    },
                    $unset:{
                        offer:1,
                        oldPrice:1,
                        endDate:1,
                        startDate:1
                    }
                })
            });
            db.get().collection(collection.CATEGORY).updateOne({productSubCat:name},
                {
                    $unset:{
                        offer:1,
                        endDate:1,
                        startDate:1
                    }
                }).then(()=>{
                    resolve()
                })
            
        })
    }


}