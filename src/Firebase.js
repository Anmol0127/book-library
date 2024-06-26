import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  query,
  where,
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  listAll,
  deleteObject,
} from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyD0AHHwSWB-Af_uQuEjDDs73JUsl_KIcHo',
  authDomain: 'book-library-9f323.firebaseapp.com',
  projectId: 'book-library-9f323',
  storageBucket: 'book-library-9f323.appspot.com',
  messagingSenderId: '754560775290',
  appId: '1:754560775290:web:d2ab7f5b8525c4920af7c3',
  // measurementId: 'G-YY0S46WXFL',
};

const provider = new GoogleAuthProvider();
const app = initializeApp(firebaseConfig);

//auth logic
export const auth = getAuth(app);
export const signIn = async () => await signInWithPopup(auth, provider);
export const signOutUser = () => signOut(auth);
export const isUserSignedIn = () => Boolean(auth.currentUser);

//firestore logic
const db = getFirestore(app);
export const usersRef = collection(db, 'users');
export let booksRef;

onAuthStateChanged(auth, async user => {
  if (!user) {
    booksRef = undefined;
    return;
  }

  const userDoc = await getDoc(doc(usersRef, user.uid));
  if (!userDoc.exists()) {
    await setDoc(doc(usersRef, user.uid), {
      name: user.displayName,
      image: user.photoURL,
      private: false,
    });
  }

  booksRef = collection(usersRef, user.uid, 'books');
});

export async function getUserDoc(username) {
  const q = query(usersRef, where('name', '==', username));
  const querySnapshot = await getDocs(q);
  const userDoc = querySnapshot.docs[0];

  return userDoc;
}

export async function updateUserDoc(key, value) {
  const userRef = doc(usersRef, auth.currentUser?.uid);

  if (!userRef) return new Error("Couldn't update. Unknown error occured");

  await updateDoc(userRef, {
    [key]: value,
  });
}

export async function saveBook(id, book) {
  try {
    await setDoc(doc(booksRef, id), book);
  } catch (error) {
    alert('Error writing new message to Firebase Database', error);
  }
}

export async function getBookbyId(id) {
  const bookRef = doc(booksRef, id);
  const docSnap = await getDoc(bookRef);

  if (docSnap.exists()) {
    return docSnap.data();
  } else {
    return;
  }
}

export async function deleteBookById(id) {
  await deleteDoc(doc(booksRef, id));
}

export async function deleteAllBooks() {
  const querySnapshot = await getDocs(booksRef);
  querySnapshot.forEach(async doc => {
    await deleteDoc(doc.ref);
  });
}

//storage logic
const storage = getStorage(app);
const usersStorageRef = ref(storage, 'users');

async function uploadImage(file, folderRef) {
  //1 048 576 bytes === 1mb
  if (file.size > 1048576) {
    alert('File is too big!');
    return;
  }

  const imageRef = ref(folderRef, file.name);
  const img = await uploadBytes(imageRef, file);
  const url = await getDownloadURL(img.ref);
  return url;
}

function deleteFolderItems(folderRef) {
  listAll(folderRef).then(listResults =>
    listResults.items.forEach(itemRef => deleteObject(itemRef))
  );
}

export async function updateImageInFolder(file, folder) {
  const folderRef = ref(usersStorageRef, `${auth.currentUser.uid}/${folder}`);
  deleteFolderItems(folderRef);

  const url = await uploadImage(file, folderRef);
  return url;
}
