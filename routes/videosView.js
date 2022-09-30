const express = require("express");
const admin = require("firebase-admin");
let router = express.Router();

// router.get("/", (req, res) => {
//   const sessionCookie = req.cookies.session || "";

//   admin
//     .auth()
//     .verifySessionCookie(sessionCookie, true)
//     .then(() => {
//       res.render("videosView");
//     })
//     .catch((error) => {
//       res.redirect("/");
//     });
// });

// router.get("/favorites", (req, res) => {
//   res.render("favorites");
// });

// router.get("/profile", (req, res) => {
//   res.render("profile");
// });

module.exports = router;
