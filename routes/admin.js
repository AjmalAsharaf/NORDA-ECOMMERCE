var express = require('express');
var router = express.Router();
var productHelpers=require('../helpers/product-helpers')
/* GET users listing. */
router.get('/', function(req, res, next) {
  if(req.session.admin){
    res.render('admin/admin',{admin:true})
  }else{
    res.redirect('/')
  }
 
});

router.get('/user-management',function(req,res){
  if(req.session.admin){
    res.render('admin/user-management',{admin:true})
  }else{
    res.redirect('/')
  }
})

router.get('/product-management',function(req,res){
  if(req.session.admin){
    productHelpers.viewAllProducts().then((products)=>{
      
      res.render('admin/product-management',{admin:true,products})
    })
  
  }else{
    res.redirect('/')
  }
})

router.get('/add-product',(req,res)=>{
  if(req.session.admin){
    res.render('admin/add-product',{admin:true})
  }else{
    res.redirect('/')
  }
})

router.post('/add-product',(req,res)=>{
  if(req.session.admin){
   
    productHelpers.addProducts(req.body).then((id)=>{
      
      let image=req.files.Image
      
      image.mv('./assets/product-images/'+id+'.jpg',(err,done)=>{
        if(!err){
          res.redirect('/admin/product-management')
        }else{
          console.log('Image upload failed');
        }
      })
      
    })
  }else{    
    res.redirect('/')
  }
})

router.get('/delete-product/:id',(req,res)=>{
  let proId=req.params.id
  
  if(req.session.admin){
    productHelpers.deleteProduct(proId).then(()=>{
      res.redirect('/admin/product-management')
    })
  }else{
    res.redirect('/')
  }
})
module.exports = router;
