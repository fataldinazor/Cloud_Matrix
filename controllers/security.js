// function for authenticating user
const authenticateUser = (req, res, next) => {
  if (req.session.passport === undefined) {
    res.redirect("/sign-up");
  } else {
    next();
  }
};

// function for authorizing user
const authorizeUser = (req, res, next) => {
  const profile_user_id = parseInt(req.params.user_id);
  const logged_user_id = parseInt(req.session.passport.user);
  if (profile_user_id !== logged_user_id)
    return res.status(403).send("Forbidden: Unauthorized access");
  next();
};

module.exports={
    authenticateUser,
    authorizeUser
}