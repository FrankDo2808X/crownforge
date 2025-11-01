// firebase-messaging-sw.js
importScripts("https://www.gstatic.com/firebasejs/10.12.4/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.4/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDNy1J7zVJMLGLsyUxRT1EIaIBruI_p2G8",
  authDomain: "crownforgestudio-2581a.firebaseapp.com",
  projectId: "crownforgestudio-2581a",
  storageBucket: "crownforgestudio-2581a.appspot.com",
  messagingSenderId: "223324386293",
  appId: "1:223324386293:web:783a3e64f0d10b1ab026bc"
});


const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("📩 Received background message ", payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon || "/logo.png"
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
