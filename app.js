const cookieParser = require('cookie-parser');
const express=require('express');
const app = express();
const userModel=require("./models/user")
const postModel=require("./models/post")
const bcrypt=require('bcrypt')
const jwt = require('jsonwebtoken');

app.set('view engine',"ejs")
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser())

app.get('/',(req,res)=>{
    res.render("index")
});





app.get('/login',(req,res)=>{
    res.render("login")
    
});

app.get("/profile",isLoggedIn,async (req,res)=>{
   let user=await userModel.findOne({email:req.user.email}).populate("posts")
    res.render("profile",{user})
});

app.get("/like/:_id",isLoggedIn,async (req,res)=>{
    let post = await postModel.findOne({id : req.params._id}).populate("user");
    // if(post.likes.indexOf(req.params._id)===-1){
    //     console.log(req.params._id)
    // }
    // post.likes.push(req.params)
    // console.log(req.params)
    // console.log(post)
   
    // if(post.likes.indexOf(0)===-1){
    //     // post.likes.push(req.params)
    //     // await post.save();
    // }
    // else{
    //     post.likes.splice(post.likes.indexOf(req.user.userid),1)
    //     await post.save();
    // }
    // await post.save();fjfj
    console.log(req.params._id)
    // console.log(post.likes.length)
    
    res.redirect("/profile");
 });

 app.get("/edit/:_id",isLoggedIn,async (req,res)=>{
    console.log("hello babes",req.params)

    let post = await postModel.findOne({_id : req.params});
    console.log(post);
    res.render("edit",{post});

    
 });

 app.post("/update/:_id",isLoggedIn,async (req,res)=>{
    let post = await postModel.findOneAndUpdate({_id : req.params},{content:req.body.content});
    res.redirect("/profile");
 });

app.post("/post",isLoggedIn,async (req,res)=>{
    let user=await userModel.findOne({email:req.user.email})
    let {content}=req.body;
    
    let post=await postModel.create({
        user:user._id,
        content
    })

    user.posts.push(post._id);
    await user.save();
    res.redirect("/profile")
 });

app.get('/logout',(req,res)=>{
    res.cookie("token","");
    res.redirect("/login")
});

app.post('/register',async (req,res)=>{
    let {name,username,email,password,age}=req.body;
    let user=await userModel.findOne({email:email});
    if(user) return res.status(500).send("User already registered");

    bcrypt.genSalt(10,(err,salt)=>{
        bcrypt.hash(password,salt,async (err,hash)=>{
            let user = await userModel.create({
                name,
                username,
                email,
                age,
                password:hash
            })
            let token=jwt.sign({email:email,userid:user._id},"shhhh")
            res.cookie("token",token);
            res.send("registered")
        })
    })
   
});

app.post('/login',async (req,res)=>{
    let {email,password}=req.body;
    let user=await userModel.findOne({email:email});
    if(!user) return res.status(500).send("Something went worng");

   bcrypt.compare(password,user.password,function(err,result){
    if(result) {
        let token=jwt.sign({email:email,userid:user._id},"shhhh")
        res.cookie("token",token);
        res.status(200).redirect("/profile")
    }
    else res.redirect("./login")    
   })
    
});

function isLoggedIn(req, res, next) {
    const token = req.cookies.token; // Correctly access the token from cookies
    if (!token) {
        return res.redirect('/login'); // Redirect to login if token is not present
    }
    try {
        const data = jwt.verify(token, 'shhhh'); // Verify the token
        req.user = data; // Attach user data to request object
        next(); // Proceed to next middleware or route handler
    } catch (error) {
        res.clearCookie('token'); // Clear the cookie if token verification fails
        res.redirect('/login'); // Redirect to login if token is invalid
    }
}




app.listen(3000);