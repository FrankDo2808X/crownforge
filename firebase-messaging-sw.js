// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging.js');

// Your Firebase config
firebase.initializeApp({
  apiKey: "AIzaSyDNy1J7zVJMLGLsyUxRT1EIaIBruI_p2G8",
  authDomain: "crownforgestudio-2581a.firebaseapp.com",
  projectId: "crownforgestudio-2581a",
  storageBucket: "crownforgestudio-2581a.appspot.com",
  messagingSenderId: "223324386293",
  appId: "1:223324386293:web:783a3e64f0d10b1ab026bc"
});

// Retrieve Firebase Messaging
const messaging = firebase.messaging();

// Show notification when app is in background
messaging.onBackgroundMessage(function(payload) {
  console.log("Background message received: ", payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/icon.png"
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
