const express = require("express");
const session = require("express-session");
const passport = require("passport");
const path = require("path");
require("dotenv").config({
  override: true,
  path: "./.env",
});
const PORT = process.env.PORT;
const router = require("./routes/router");
const { PrismaSessionStore } = require("@quixo3/prisma-session-store");
const { PrismaClient } = require("@prisma/client");

const app = express();
app.set("view engine", "ejs");

app.use(
  session({
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 },
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    store: new PrismaSessionStore(new PrismaClient(), {
      checkPeriod: 2 * 60 * 1000,
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }),
  })
);

app.use(passport.session());
app.use(express.static(path.resolve(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

app.use("/", router);
app.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect("/log-in");
  });
});

// To handle client entering to wrong url
// app.all("*", (req, res, next) => {
//   const err = new Error(`Can't find ${req.originalUrl} on the Server`);
//   err.statusCode = 404;
//   err.status = "fail";
//   next(err);
// });

// global error handler
// app.use((error, req, res, next)=>{
//     error.statusCode = error.statusCode || 500;
//     error.status = error.status || 'Error';
//     res.status(error.statusCode).render('error',{
//         status:error.statusCode,
//         message: error.message
//     })
// })

app.listen(PORT, () => console.log(`The server is listening at PORT ${PORT}`));
