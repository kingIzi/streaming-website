//imports
const express = require("express");
const PORT = process.env.PORT || 3000;
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const csurf = require("csurf");
const admin = require("firebase-admin");

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL:
    "https://history-webapp-default-rtdb.europe-west1.firebasedatabase.app/",
});

const csurfMiddleWare = csurf({ cookie: true });
const app = express();

//routes
const about = require("./routes/about");

app.use("/about", about);
//app.use("/videosView", videosView);

//static files
app.use(express.json());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(csurfMiddleWare);

app.use(express.urlencoded({ extended: true }));

app.use(express.static("public"));
app.use("/css", express.static(__dirname + "public/css"));
app.use("/js", express.static(__dirname + "public/js"));
app.use("/img", express.static(__dirname + "public/img"));

//set views
app.set("views", "./views");
app.set("view engine", "ejs");

const db = admin.firestore();

app.all("*", (req, res, next) => {
  res.cookie("XSRF-TOKEN", req.csrfToken());
  next();
});

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/videos", (req, res) => {
  const sessionCookie = req.cookies.session || "";
  admin
    .auth()
    .verifySessionCookie(sessionCookie, true)
    .then(async () => {
      let usersCollection = db.collection("videos");
      await usersCollection.get().then((snapshot) => {
        let videos = [];
        snapshot.forEach((document) => {
          const data = document.data();
          data.videoId = document.id;
          videos.push(data);
        });
        const properties = {
          videos: videos,
        };
        res.render("videos", properties);
      });
    })
    .catch((error) => {
      res.redirect("/");
    });
});

app.get("/nowStreaming/:videoId", async (req, res) => {
  let documentId = req.params.videoId;
  const document = await db.collection("videos").doc(documentId).get();
  res.render("nowStreaming", document.data());
});

app.get("/addVideo", (req, res) => {
  res.render("addVideo", { csrfToken: req.csrfToken() });
});

app.post("/addVideo", async (req, res) => {
  await db.collection("videos").doc(Date.now().toString()).set(req.body);
  res.redirect("/videos");
});

app.get("/profile", (req, res) => {
  res.render("profile");
});

app.post("/sessionLogin", (req, res) => {
  const idToken = req.body.idToken.toString();
  const expiresIn = 60 * 60 * 24 * 5 * 1000;
  admin
    .auth()
    .createSessionCookie(idToken, { expiresIn })
    .then(
      (sessionCookie) => {
        const options = { maxAge: expiresIn, httpOnly: true };
        res.cookie("session", sessionCookie, options);
        res.end(JSON.stringify({ status: "success" }));
      },
      (error) => {
        res.status(401).send("UNAUTHORIZED REQUEST!");
      }
    );
});

app.post("/sessionSignUp", (req, res) => {
  const payload = req.body;
  const idToken = payload.idToken.toString();
  const expiresIn = 60 * 60 * 24 * 5 * 1000;
  admin
    .auth()
    .createSessionCookie(idToken, { expiresIn })
    .then(
      async (sessionCookie) => {
        const userId = payload.userId;
        delete payload.idToken;
        delete payload.userId;
        await db.collection("users").doc(userId).set(payload);
        const options = { maxAge: expiresIn, httpOnly: true };
        res.cookie("session", sessionCookie, options);
        res.end(JSON.stringify({ status: "success" }));
      },
      (error) => {
        res.status(401).send("UNAUTHORIZED REQUEST!");
      }
    );
});

app.get("/sessionLogout", (req, res) => {
  res.clearCookie("session");
  res.redirect("/");
});

app.listen(PORT, () => console.info(`Listening on port ${PORT}`));
