import { initializeApp, getApps } from 'firebase/app';
import { 
  initializeFirestore, setDoc, getDoc, doc, collection,
  onSnapshot, query, orderBy
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } 
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

  async savePicture(picData) {

    const response = await fetch(picData.uri);
    const imageBlob = await response.blob();

    const userID = auth.currentUser.uid;
    const timestamp = new Date();
    const timeString = timestamp.toISOString();
    const fileName = userID + '_' + timeString + '.jpg';
    const fileRef = ref(storage, 'images/' + fileName);

    await uploadBytes(fileRef, imageBlob);

    // get the download URL
    const downloadURL = await getDownloadURL(fileRef);
    console.log(downloadURL);
    
    // put the downloadURL, along with other into, into Firestore
    const userDoc = doc(db, 'users', userID);
    const picturesColl = collection(userDoc, 'pictures');
    const pictureDoc = doc(picturesColl, fileName);
    const pictureData = {
      timestamp: timestamp,
      uri: downloadURL
    };
    setDoc(pictureDoc, pictureData);

  }

  addCurrentUserGalleryListener(callback) {
    if (this.gallerySnapshotUnsub) {
      this.gallerySnapshotUnsub();
    }

    const q = query(
      collection(db, 'users', auth.currentUser.uid, 'pictures'), 
      orderBy('timestamp', 'desc'));

    console.log('adding onSnapshot for ', auth.currentUser.uid);

    this.gallerySnapshotUnsub = onSnapshot(q, qSnap => {
      console.log('onSnapshot is happening');
      let pics = [];
      qSnap.forEach(docSnap => {
        let picData = docSnap.data();
        picData.key = docSnap.id;
        pics.push(picData);
      });
      callback(pics);
    });

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