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
const favicon = require("serve-favicon");
const flash = require('connect-flash');

const app = express();
app.set("view engine", "ejs");

app.use(
  session({
    cookie: { maxAge: 10 * 24 * 60 * 60 * 1000 },
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: new PrismaSessionStore(new PrismaClient(), {
      checkPeriod: 2 * 60 * 1000,
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }),
  })
);

app.use(passport.session());
app.use(favicon(path.join(__dirname, "public", "favicon.png")));
app.use(express.static(path.resolve(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(flash());

app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

app.use("/", router);

app.listen(PORT, () => console.log(`The server is listening at PORT ${PORT}`));
