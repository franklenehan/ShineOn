(function(){
  if(!window.FIREBASE_CONFIG){console.warn('Firebase config not found. Skipping Firebase init.');return;}
  if(!window.firebase){console.error('Firebase SDK not loaded');return;}
  const app = firebase.initializeApp(window.FIREBASE_CONFIG);
  const auth = firebase.auth();
  const db = firebase.firestore();
  try{firebase.firestore().enablePersistence({synchronizeTabs:true});}catch(e){}
  auth.onAuthStateChanged(function(u){
    if(!u){ auth.signInAnonymously().catch(function(){}) }
  });
  // Expose helpers
  window.firebaseApp = app;
  window.firebaseAuth = auth;
  window.firebaseFirestore = db;
  window.getAuthToken = async function(){
    const user = auth.currentUser;
    if(!user){
      // wait for auth state
      await new Promise(resolve => {
        const unsub = auth.onAuthStateChanged(() => { unsub(); resolve(); });
      });
    }
    return auth.currentUser ? auth.currentUser.getIdToken(/* forceRefresh */ false) : null;
  };
})();
