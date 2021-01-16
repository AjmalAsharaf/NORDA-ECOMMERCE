var express = require('express');
var router = express.Router();
var productHelpers=require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers');
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
    userHelpers.getAllUsers().then((userDetails)=>{
      console.log('All users',userDetails);
      res.render('admin/user-management',{admin:true,userDetails})
    })
    
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
    productHelpers.showCategory().then((category)=>{
      
      res.render('admin/add-product',{admin:true,category})
    })
   
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

router.get('/edit-product/:id',(req,res)=>{
  let proId=req.params.id
  
  if(req.session.admin){
    productHelpers.viewOnePorduct(proId).then((product)=>{
      productHelpers.showCategory().then((category)=>{
        res.render('admin/edit-product',{admin:true,product,category})
      })
     
    })
  }else{
    res.redirect('/')
  }
})

router.post('/update-product/:id',(req,res)=>{
  let proId=req.params.id
  if(req.session.admin){
    product=req.body
    productHelpers.updateProduct(proId,product).then(()=>{
      res.redirect('/admin/product-management')
      if(req.files.Image){
        image=req.files.Image
        image.mv('./assets/product-images/'+proId+'.jpg',(err,done)=>{

        })


      }
    })
    
  }else{
    res.redirect('/')
  }
})

router.get('/block-user/:id',(req,res)=>{
  if(req.session.admin){
    proId=req.params.id
    userHelpers.blockUser(proId).then(()=>{
      res.redirect('/admin/user-management')
    })
    
  }else{
    res.redirect('/')
  }

})
router.get('/unblock-user/:id',(req,res)=>{
  if(req.session.admin){
    proId=req.params.id
    userHelpers.unblockUser(proId).then(()=>{
      res.redirect('/admin/user-management')
    })
  }else{
    res.redirect('/')
  }
})

router.get('/add-category',(req,res)=>{
  if(req.session.user){
    res.render('admin/add-category',({admin:true}))
  }else{
    res.redirect('/')
  }
  
})
router.post('/add-category',(req,res)=>{
  if(req.session.admin){
    console.log('Added Category is ',req.body);
  productHelpers.insertCategory(req.body).then(()=>{
    res.json({status:true})
  }).catch(()=>{
    res.json({status:false})
  })
  }else{
    res.redirect('/')
  }
  
})

module.exports = router;
