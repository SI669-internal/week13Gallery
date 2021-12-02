import { initializeApp, getApps } from 'firebase/app';
import { 
  initializeFirestore, setDoc, getDoc, doc, collection,
  onSnapshot
} from "firebase/firestore";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } 
  from 'firebase/storage';
  import { getAuth } from "firebase/auth";

import { firebaseConfig } from './Secrets';

let app;
if (getApps().length == 0){
  app = initializeApp(firebaseConfig);
} 
const storage = getStorage(app);
const db = initializeFirestore(app, {
  useFetchStreams: false
});
const auth = getAuth(); 

class DataModel {
  constructor() {
    this.users = [];
    this.userSnapshotUnsub = undefined; 
    this.userSnapshotListeners = [];
  }

  initOnAuth() {
    if (this.userSnapshotUnsub) {
      this.userSnapshotUnsub();
    }
    this.userSnapshotUnsub = onSnapshot(collection(db, 'users'), qSnap => {
      let updatedUsers = [];
      qSnap.forEach(docSnap => {
        let user = docSnap.data();
        user.key = docSnap.id;
        updatedUsers.push(user);
      });
      this.users = updatedUsers;
      this.notifyUserSnapshotListeners();
    });
  }

  disconnectOnSignout() {
    if (this.userSnapshotUnsub) {
      this.userSnapshotUnsub();
      this.userSnapshotUnsub = undefined;
    }
  }

  addUserSnapshotListener(callback) {
    const id = Date.now();
    this.userSnapshotListeners.push({
      callback: callback,
      id: id
    });
    callback();
    return id;
  }

  removeUserSnapshotListener(id) {
    const idx = this.userSnapshotListeners.findIndex(elem => elem.id === id);
    if (idx !== -1) {
      this.userSnapshotListeners.splice(idx, 1);
    }
  }

  notifyUserSnapshotListeners() {
    for (usl of this.userSnapshotListeners) {
      usl.callback();
    }
  }

  createUser(authUser, displayName) {
    setDoc(doc(db, 'users', authUser.uid), {displayName: displayName});
  }

  async getCurrentUserDisplayName() {
    const authUser = auth.currentUser;
    const userDocSnap = await getDoc(doc(db, 'users', authUser.uid));
    const user = userDocSnap.data();
    return user.displayName;
  }
}

// the singleton pattern, same as before
let theDataModel = undefined;
export function getDataModel() {
  if (!theDataModel) {
    theDataModel = new DataModel();
  }
  return theDataModel;
}