const homepage = (req, res)=>{
    if(!req.user){
        res.redirect("/sign-up")
    }
    else{
        res.redirect(`/users`)
    }
}

module.exports= homepage