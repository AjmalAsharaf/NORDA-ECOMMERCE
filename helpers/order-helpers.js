var db = require('../config/connection')
var collection = require('../config/collection')
const bcrypt = require('bcrypt')
var objId = require('mongodb').ObjectID
const { ObjectID, ObjectId } = require('mongodb')
const { response } = require('express')
const moment = require('moment')
const { ORDER_COLLECTION } = require('../config/collection')

module.exports = {
    getTotalOrderNum: () => {
        let orderNum = {}
        return new Promise(async (resolve, reject) => {
            orderNum.totalOrders = await db.get().collection(collection.ORDER_COLLECTION).find().count()
            orderNum.readyToship = await db.get().collection(collection.ORDER_COLLECTION).find({ status: 'placed', ship: 'Not Dispatched' }).count()
            orderNum.completedOrder = await db.get().collection(collection.ORDER_COLLECTION).find({ ship: 'Order Dispatched' }).count()
            orderNum.cancelOrder = await db.get().collection(collection.ORDER_COLLECTION).find({ ship: 'Order Cancelled' }).count()
            if (orderNum == null) {
                reject()
            } else {
                orderNum.readyToshipPers = ((orderNum.totalOrders - (orderNum.totalOrders - orderNum.readyToship)) / orderNum.totalOrders) * 100
                orderNum.completedOrderPers = ((orderNum.totalOrders - (orderNum.totalOrders - orderNum.completedOrder)) / orderNum.totalOrders) * 100
                orderNum.cancelOrderPers = ((orderNum.totalOrders - (orderNum.totalOrders - orderNum.cancelOrder
                )) / orderNum.totalOrders) * 100
                console.log('operations', 'alldata', orderNum);
                resolve(orderNum)
            }

        })
    },
    graphStatus: () => {
        return new Promise(async (resolve, reject) => {
            let graph = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {
                        ship: 'Order Dispatched'
                    }
                },
                {
                    $project: {
                        date: 1,
                        _id: 0,
                        totalAmount: 1
                    }
                },
                {
                    $group: {
                        _id: { month: '$date' },
                        count: { $sum: 1 },
                        total: { $sum: '$totalAmount' }
                    }
                },
                {
                    $project: {
                        _id: 1,
                        total: 1
                    }
                },
                {
                    $sort: { _id: 1 }
                }

            ]).toArray()
            console.log('My data', graph);
            let response = {
                date: [],
                total: []
            }
            for (i = 0; i < graph.length; i++) {
                response.date[i] = graph[i]._id.month
                response.total[i] = graph[i].total
            }
            console.log('response', response);
            resolve(response)

        })
    },
    getReports: (getDate) => {
        return new Promise(async (resolve, reject) => {
            console.log('date1', getDate);
            getDate.fromdate = moment(getDate.fromdate).format('L')
            getDate.todate = moment(getDate.todate).format('L')
            console.log('formate', getDate);
            let orderByDate = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { date: { $gte: getDate.fromdate, $lte: getDate.todate } }
                },
                {
                    $group: { _id: null, total: { $sum: '$totalAmount' }, data: { $push: '$$ROOT' } }

                },
                {
                    $unwind: '$data'
                },
                {
                    "$replaceRoot": {
                        "newRoot": { "$mergeObjects": ["$$ROOT", "$data"] }
                    }
                },
                {
                    $project: { _id: 1, total: 1, status: 1, ship: 1, date: 1, user: 1,paymentMethod:1 }
                },
                {
                    $lookup: {
                        from: 'user',
                        localField: 'user',
                        foreignField: '_id',
                        as: 'doc'
                    }


                },
                {
                    $unwind: '$doc'
                },
                {
                    $replaceRoot: {
                        'newRoot': { $mergeObjects: ['$$ROOT', '$doc'] }
                    }
                },
                {
                    $project: { _id: 1, total: 1, status: 1, ship: 1, date: 1, name: 1,paymentMethod:1 }
                },



            ]).toArray()
            console.log('orders', orderByDate);
            resolve(orderByDate)
        })
    }
}