const firebaseConfig = {
  apiKey: "AIzaSyBHRT1GVWHe5V0pz9K0KYAmWmOaYCxsqhA",
  authDomain: "history-webapp.firebaseapp.com",
  projectId: "history-webapp",
  storageBucket: "history-webapp.appspot.com",
  messagingSenderId: "68276540114",
  appId: "1:68276540114:web:f3acb006db313bc2ce130b",
  measurementId: "G-BQCJH3MB9S",
};

function loginFormModalDisplayNone(id) {
  document.getElementById(id).style.display = "none";
}

function loginFormModalDisplayBlock(id) {
  document.getElementById(id).style.display = "block";
}

function getLoginPasswordFromEvent(event) {
  const login = event.target.email.value;
  const password = event.target.psw.value;
  return [login, password];
}

function getSignUpFormEventData(event) {
  const fullName = event.target.fullName.value;
  const telephone = event.target.telephone.value;
  const email = event.target.email.value;
  const password = event.target.psw.value;
  return [fullName, telephone, email, password];
}

function getAddVideoFormData(event) {
  const videoTitle = event.target.videoTitle.value;
  const description = event.target.description.value;
  const thumbnail = event.target.thumbnail.files[0];
  const video = event.target.video.files[0];
  return [videoTitle, description, thumbnail, video];
}

function openNav() {
  document.getElementById("mySidenav").style.width = "100%";
}

function closeNav() {
  document.getElementById("mySidenav").style.width = "0";
}

//login user web request
function signInWithEmailPassword(email, password) {
  firebase
    .auth()
    .signInWithEmailAndPassword(email, password)
    .then(({ user }) => {
      return user.getIdToken().then((idToken) => {
        return fetch("/sessionLogin", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "CSRF-Token": Cookies.get("XSRF-TOKEN"),
          },
          body: JSON.stringify({ idToken }),
        });
      });
    })
    .then(() => {
      return firebase.auth().signOut();
    })
    .then(() => {
      document.getElementById("login-spin").style.display = "none";
      window.location.assign("/videos");
    })
    .catch((err) => {
      alert(
        "Connexion e échoué. Meka lisusu. Email Oyo to pe Mot de passe oyo esimbi te."
      );
    });
  return false;
}

//sign up user web request
function signUpWithEmailPassword(fullName, telephone, email, password) {
  firebase
    .auth()
    .createUserWithEmailAndPassword(email, password)
    .then(({ user }) => {
      const payload = {
        userId: user.uid,
        email: user.email,
        fullName: fullName,
        telephone: telephone,
      };
      return user.getIdToken().then((idToken) => {
        payload.idToken = idToken;
        return fetch("/sessionSignUp", {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            "CSRF-Token": Cookies.get("XSRF-TOKEN"),
          },
          body: JSON.stringify(payload),
        });
      });
    })
    .then(() => {
      return firebase.auth().signOut();
    })
    .then(() => {
      window.location.assign("/videos");
    })
    .catch((err) => {
      console.log(err.mess);
      alert(
        "Connexion e échoué. Meka lisusu. Email Oyo to pe Mot de passe oyo esimbi te."
      );
    });
  return false;
}

function updateProgress(snapshot, progressBarId) {
  var progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
  var uploader = document.getElementById(progressBarId);
  uploader.value = progress;
}

function uploadFile(file, progressId) {
  const promise = new Promise((resolve, reject) => {
    const storageRef = firebase.storage().ref(file.name + Date.now());
    const uploadTask = storageRef.put(file);
    uploadTask.on(
      "state_changed",
      function progress(snapshot) {
        updateProgress(snapshot, progressId);
      },

      function error(err) {
        reject(err);
        alert("error uploading file");
      },
      function complete() {
        uploadTask.snapshot.ref.getDownloadURL().then((url) => {
          let data = [uploadTask.snapshot.metadata, url];
          resolve(data);
        });
      }
    );
  });
  return promise;
}

function uploadVideoFiles(newVideo, thumbnail, video) {
  const thumbnailPromise = uploadFile(thumbnail, "thumbnailProgress");
  thumbnailPromise.then((data) => {
    const [metadata, url] = data;
    newVideo.thumbnailMetadata = metadata;
    newVideo.thumbnailUrl = url;
  });
  const videoPromise = uploadFile(video, "videoProgress");
  videoPromise.then((data) => {
    const [metadata, url] = data;
    newVideo.videoMetadata = metadata;
    newVideo.videoUrl = url;
  });
}

function postNewVideo(payload) {
  return fetch("/addVideo", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "CSRF-Token": Cookies.get("XSRF-TOKEN"),
    },
    body: JSON.stringify(payload),
  });
}

//login user event listener
function addLoginFormEventListener() {
  document.getElementById("login-form").addEventListener("submit", (e) => {
    e.preventDefault();
    document.getElementById("login-spin").style.display = "block";
    const [email, password] = getLoginPasswordFromEvent(e);
    signInWithEmailPassword(email, password);
  });
}

//sign up user event listener
function addSignUpFormEventListener() {
  document.getElementById("sign-up-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const [fullName, telephone, email, password] = getSignUpFormEventData(e);
    signUpWithEmailPassword(fullName, telephone, email, password);
  });
}

//reset all form data
function resetFormData(id) {
  document.getElementById(id).reset();
}

function loginFormLoaded(window) {
  window.addEventListener("DOMContentLoaded", () => {
    firebase.initializeApp(firebaseConfig);
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.NONE);
    addLoginFormEventListener();
  });
}

function signupFormLoaded(window) {
  window.addEventListener("DOMContentLoaded", () => {
    firebase.initializeApp(firebaseConfig);
    firebase.auth().setPersistence(firebase.auth.Auth.Persistence.NONE);
    addSignUpFormEventListener();
  });
}

function addVideoFormEventListener() {
  document.getElementById("add-video-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const [videoTitle, description, thumbnail, video] = getAddVideoFormData(e);
    const newVideo = {
      title: videoTitle,
      description: description,
    };
    const thumbnailPromise = uploadFile(thumbnail, "thumbnailProgress");
    thumbnailPromise.then((data) => {
      const [metadata, url] = data;
      newVideo.thumbnailMetadata = metadata;
      newVideo.thumbnailUrl = url;
    });
    const videoPromise = uploadFile(video, "videoProgress");
    videoPromise.then((data) => {
      const [metadata, url] = data;
      newVideo.videoMetadata = metadata;
      newVideo.videoUrl = url;
      postNewVideo(newVideo);
    });
  });
}

function addVideoPageLoaded(window) {
  window.addEventListener("DOMContentLoaded", () => {
    firebase.initializeApp(firebaseConfig);
    addVideoFormEventListener();
  });
}
