importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: self.location.origin.includes("localhost") ? "YOUR_API_KEY" : self.FIREBASE_CONFIG?.apiKey,
  authDomain: self.location.origin.includes("localhost") ? "YOUR_PROJECT.firebaseapp.com" : self.FIREBASE_CONFIG?.authDomain,
  projectId: "self.FIREBASE_CONFIG?.projectId" || "cyrano",
  messagingSenderId: "self.FIREBASE_CONFIG?.messagingSenderId",
  appId: "self.FIREBASE_CONFIG?.appId",
});

const messaging = firebase.messaging();

self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};
  self.registration.showNotification(data.title || "Cyrano", {
    body: data.body || "Nouvelle notification",
    icon: "/vite.svg",
  });
});
