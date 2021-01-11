var express = require('express');
var router = express.Router();
var userHelpers = require('../helpers/user-helpers')
var productHelpers=require('../helpers/product-helpers')
var userHelpers=require('../helpers/user-helpers')

/* GET home page. */
router.get('/', function (req, res, next) {
  if (req.session.user) {
    
    if (req.session.admin) {
      res.redirect('/admin')
    }else{
      res.redirect('/user-home')
    }
    
  } else {
    res.render('users/index');
  }


});

router.get('/login-register', function (req, res) {
  if (req.session.user) {
    if(req.session.admin){
      res.redirect('/admin')
    }else{
      
      
      res.redirect('/user-home')
    }
    
  } else {
    res.render('users/login-register')
  }

})
router.post('/register', (req, res) => {
  if (req.session.user) {
    
    if(req.session.admin){
      res.redirect('/admin')
    }else{
      res.redirect('/user-home')
    }
  }
   else {
    userData = req.body
    userHelpers.doSignup(userData).then((response) => {
      console.log(response);
      res.json(response)
    }).catch((response) => {
      res.json(response)
    })

  }


})

router.post('/login', (req, res) => {

  if (req.session.user) {
    
    if(req.session.admin){
      res.redirect('/admin')
    }else{
      res.redirect('/user-home')
    }
  } else {
    userData = req.body

    userHelpers.doLogin(userData).then((response) => {

      if (response.user.admin) {
        req.session.user = req.body
        req.session.admin = true
        res.json(response)
      } else {
        req.session.user = req.body
        res.json(response)
      }




    }).catch((response) => {
      
      res.json(response)
    })
  }




})
router.get('/user-home', (req, res) => {
  if (req.session.user) {

    if(req.session.admin){
      res.redirect('/admin')
    }else{
      let userData=req.session.user
      
      productHelpers.viewAllProducts().then((products)=>{
        userHelpers.getSingleUser(userData).then(async(user)=>{

          
            userHelpers.getCartProducts(user._id).then((cartProducts)=>{
              res.render('users/shop-no-sidebar',{products,user,cartProducts})
            }).catch(()=>{
              res.render('users/shop-no-sidebar',{products,user})
            })
          
         
        })

        
      })
      
    }
   
    
  } else {
    res.redirect('/')
  }


})

router.get('/logout', (req, res) => {
  req.session.destroy()
  res.redirect('/')
})

router.get('/view-cart',(req,res)=>{
  if (req.session.user) {

    if(req.session.admin){
      res.redirect('/admin')
    }else{
      let userData=req.session.user
      
      userHelpers.getSingleUser(userData).then((user)=>{
        
        userHelpers.getCartProducts(user._id).then((products)=>{
          res.render('users/cart',{user,products})
        }).catch(()=>{
          res.render('users/cart',{user})
        })
       
          
         
        })
      
    }
   
    
  } else {
    res.redirect('/')
  }
})
router.get('/add-to-cart/:id',(req,res)=>{
  if (req.session.user) {

    if(req.session.admin){
      res.redirect('/admin')
    }else{
      proId=req.params.id
      
      userData=req.session.user
      userHelpers.getSingleUser(userData).then((userId)=>{
        console.log('user Id is',userId._id,'product Id',proId);
        userHelpers.addToCart(proId,userId._id).then(()=>{
          res.redirect('/user-home')
        })
      })
      
    }
   
    
  } else {
    res.redirect('/')
  }
})


module.exports = router;
