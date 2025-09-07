// === Імпорт Firebase ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-storage.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-analytics.js";

// === Firebase конфіг ===
const firebaseConfig = {
  apiKey: "AIzaSyAtnxR3AbGppbKM_vnxsXcyglrjg-Fz9gA",
  authDomain: "leonlogo77.firebaseapp.com",
  projectId: "leonlogo77",
  storageBucket: "leonlogo77.appspot.com", // виправлено
  messagingSenderId: "481729836793",
  appId: "1:481729836793:web:fbba92dd5d3a82be4cd428",
  measurementId: "G-00PFFBH0JM"
};

// === Ініціалізація Firebase ===
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// === Елементи ===
const signupBtn = document.getElementById("signup-btn");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const userEmailSpan = document.getElementById("user-email");
const balanceSpan = document.getElementById("balance");
const addProductSection = document.getElementById("add-product-section");
const productsContainer = document.getElementById("products");

// === Реєстрація користувача ===
signupBtn.onclick = async () => {
  try {
    const userCred = await createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
    await setDoc(doc(db, "users", userCred.user.uid), {
      email: emailInput.value,
      balance: 100, // стартовий бонус
      purchases: []
    });
    alert("Реєстрація успішна!");
  } catch (e) {
    alert("Помилка: " + e.message);
  }
};

// === Логін користувача ===
loginBtn.onclick = async () => {
  try {
    await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
  } catch (e) {
    alert("Помилка: " + e.message);
  }
};

// === Логаут ===
logoutBtn.onclick = async () => {
  await signOut(auth);
};

// === Відстеження стану користувача ===
onAuthStateChanged(auth, async (user) => {
  if (user) {
    userEmailSpan.textContent = user.email;
    logoutBtn.style.display = "inline";
    addProductSection.style.display = "block";

    // Отримуємо баланс
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      balanceSpan.textContent = userDoc.data().balance;
    }

  } else {
    userEmailSpan.textContent = "Гість";
    logoutBtn.style.display = "none";
    addProductSection.style.display = "none";
  }
});

// === Додавання товару ===
document.getElementById("add-product-btn").onclick = async () => {
  const name = document.getElementById("product-name").value;
  const price = parseFloat(document.getElementById("product-price").value);
  const file = document.getElementById("product-image").files[0];
  const type = document.getElementById("product-type").value;

  if (!file) {
    alert("Оберіть файл!");
    return;
  }

  // Завантаження у Firebase Storage
  const fileRef = ref(storage, "products/" + Date.now() + "-" + file.name);
  await uploadBytes(fileRef, file);
  const url = await getDownloadURL(fileRef);

  // Збереження у Firestore
  await addDoc(collection(db, "products"), {
    name, price, url, type, owner: auth.currentUser.uid
  });

  alert("Товар додано!");
  loadProducts();
};

// === Завантаження товарів ===
async function loadProducts() {
  productsContainer.innerHTML = "";
  const querySnapshot = await getDocs(collection(db, "products"));
  querySnapshot.forEach((docSnap) => {
    const p = docSnap.data();
    productsContainer.innerHTML += `
      <div class="product-card">
        <img src="${p.url}" alt="${p.name}" width="150">
        <h3>${p.name}</h3>
        <p>Тип: ${p.type}</p>
        <p>Ціна: $${p.price}</p>
        <button onclick="buyProduct('${docSnap.id}', ${p.price})">Купити</button>
      </div>
    `;
  });
}

// === Покупка товару ===
window.buyProduct = async (productId, price) => {
  const user = auth.currentUser;
  if (!user) {
    alert("Спочатку увійдіть!");
    return;
  }

  const userRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userRef);

  let balance = userDoc.data().balance;
  if (balance < price) {
    alert("Недостатньо грошей!");
    return;
  }

  balance -= price;
  await updateDoc(userRef, { balance });

  balanceSpan.textContent = balance;
  alert("Покупка успішна!");
};

// === Завантаження товарів при старті ===
loadProducts();
