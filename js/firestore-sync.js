(function(){
  'use strict';
  function ready(){return !!(window.firebaseFirestore && window.firebaseAuth && window.StorageAPI);} 
  function getUid(){var u=(window.firebaseAuth&&window.firebaseAuth.currentUser)||null; return u?u.uid:null;}

  async function ensureAuth(){
    if(!window.firebaseAuth) return null;
    if(window.firebaseAuth.currentUser) return window.firebaseAuth.currentUser;
    try { await window.firebaseAuth.signInAnonymously(); return window.firebaseAuth.currentUser; } catch(e){ return null; }
  }

  function withCloud(action){
    return async function(){
      var args = Array.prototype.slice.call(arguments);
      var res = await action.local.apply(null,args);
      try {
        if(ready()) { await action.cloud.apply(null,args); }
      } catch(e){ console.warn('Cloud sync failed:', e); }
      return res;
    };
  }

  async function cloudSaveChecklist(dateString, checklistObject){
    await ensureAuth();
    var uid = getUid(); if(!uid) return;
    await window.firebaseFirestore.collection('users').doc(uid).collection('checklists').doc(dateString).set({
      date: dateString,
      ...checklistObject,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  }

  async function cloudSaveTreatment(treatmentObject){
    await ensureAuth();
    var uid = getUid(); if(!uid) return;
    var id = treatmentObject.id || String(treatmentObject.createdAt || Date.now());
    await window.firebaseFirestore.collection('users').doc(uid).collection('treatments').doc(String(id)).set({
      ...treatmentObject,
      id: id,
      createdAt: treatmentObject.createdAt || new Date().toISOString()
    }, { merge: true });
  }

  async function cloudDeleteTreatment(id){
    await ensureAuth();
    var uid = getUid(); if(!uid) return;
    await window.firebaseFirestore.collection('users').doc(uid).collection('treatments').doc(String(id)).delete();
  }

  async function cloudSaveFuturePlan(planObject){
    await ensureAuth();
    var uid = getUid(); if(!uid) return;
    var id = planObject.id || String(planObject.createdAt || Date.now());
    await window.firebaseFirestore.collection('users').doc(uid).collection('futurePlans').doc(String(id)).set({
      ...planObject,
      id: id,
      createdAt: planObject.createdAt || new Date().toISOString()
    }, { merge: true });
  }

  async function pullFromCloud(){
    if(!ready()) return;
    await ensureAuth();
    var uid = getUid(); if(!uid) return;
    var db = window.firebaseFirestore;
    try {
      // Checklists
      var clSnap = await db.collection('users').doc(uid).collection('checklists').get();
      for (var i=0;i<clSnap.docs.length;i++){
        var d = clSnap.docs[i].data();
        if(d && d.date){ await window.StorageAPI.saveChecklist(d.date, d); }
      }
    } catch(e){ console.warn('Pull checklists failed', e); }
    try {
      // Treatments
      var tSnap = await db.collection('users').doc(uid).collection('treatments').get();
      var list = tSnap.docs.map(function(doc){return doc.data();});
      for (var j=0;j<list.length;j++){ await window.StorageAPI.saveTreatment(list[j]); }
    } catch(e){ console.warn('Pull treatments failed', e); }
    try {
      // Future plans
      var pSnap = await db.collection('users').doc(uid).collection('futurePlans').get();
      var plist = pSnap.docs.map(function(doc){return doc.data();});
      for (var k=0;k<plist.length;k++){ await window.StorageAPI.saveFuturePlan(plist[k]); }
    } catch(e){ console.warn('Pull futurePlans failed', e); }
  }

  function patchStorage(){
    if(!window.StorageAPI || window.StorageAPI.__firestorePatched) return;

    var orig = {
      saveChecklist: window.StorageAPI.saveChecklist,
      saveTreatment: window.StorageAPI.saveTreatment,
      deleteTreatment: window.StorageAPI.deleteTreatment,
      saveFuturePlan: window.StorageAPI.saveFuturePlan
    };

    window.StorageAPI.saveChecklist = withCloud({
      local: orig.saveChecklist,
      cloud: cloudSaveChecklist
    });

    window.StorageAPI.saveTreatment = withCloud({
      local: orig.saveTreatment,
      cloud: cloudSaveTreatment
    });

    window.StorageAPI.deleteTreatment = withCloud({
      local: orig.deleteTreatment,
      cloud: cloudDeleteTreatment
    });

    window.StorageAPI.saveFuturePlan = withCloud({
      local: orig.saveFuturePlan,
      cloud: cloudSaveFuturePlan
    });

    window.StorageAPI.__firestorePatched = true;
  }

  document.addEventListener('DOMContentLoaded', function(){
    patchStorage();
    // Attempt an initial pull a bit after load so StorageAPI IndexedDB init is done
    setTimeout(pullFromCloud, 1200);
  });
})();
