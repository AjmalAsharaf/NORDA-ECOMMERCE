const mongoClient=require('mongodb').MongoClient
const state={
    db:null
}

module.exports.connect=function(done){
    
    const dbname='mygear'
    
    mongoClient.connect(process.env.MONGODB_URI,(err,data)=>{
        if(err){
            done(err)
        }
        state.db=data.db(dbname)
        done()
    })
    
}

module.exports.get=function(){
    return state.db
}