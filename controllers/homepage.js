const homepage = (req, res)=>{
    if(!req.user){
        res.redirect("/sign-up")
    }
    else{
        res.redirect(`users/${req.user.user_id}`)
    }
}

module.exports= homepage