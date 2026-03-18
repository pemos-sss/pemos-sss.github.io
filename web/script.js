import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, where } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyAvo5tKrYQDK5UcAJsbTo5UaeDcjYdDSlo",
    authDomain: "pemos-vault.firebaseapp.com",
    projectId: "pemos-vault",
    storageBucket: "pemos-vault.firebasestorage.app",
    messagingSenderId: "664318309403",
    appId: "1:664318309403:web:37c05755424ac616eab4be"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// مراقب حالة التسجيل لتحديث الواجهة
onAuthStateChanged(auth, (user) => {
    loadPosts(); 
});

// إظهار لوحة التحكم بحرف L
window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'l') {
        document.getElementById('admin-panel').classList.remove('hidden');
    }
});

// الدخول للوحة التحكم
window.loginAdmin = async () => {
    const pass = document.getElementById('admin-pass').value;
    try {
        await signInWithEmailAndPassword(auth, "moaz5589@gmail.com", pass);
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('admin-controls').classList.remove('hidden');
    } catch (err) { alert("كلمة المرور غير صحيحة"); }
};

// إضافة تصنيف جديد
window.addCategory = async () => {
    const name = document.getElementById('new-cat-name').value;
    if(name) {
        await addDoc(collection(db, "categories"), { name });
        document.getElementById('new-cat-name').value = "";
    }
};

// إضافة مقال جديد
window.addPost = async () => {
    const title = document.getElementById('post-title').value;
    const cat = document.getElementById('post-category-select').value;
    const content = document.getElementById('post-content').value;

    if(title && content) {
        await addDoc(collection(db, "posts"), {
            title, category: cat, content, createdAt: serverTimestamp()
        });
        alert("تم النشر بنجاح!");
        document.getElementById('post-title').value = "";
        document.getElementById('post-content').value = "";
    }
};

// جلب التصنيفات للقائمة الجانبية ولوحة التحكم
onSnapshot(collection(db, "categories"), (snap) => {
    const list = document.getElementById('category-list');
    const select = document.getElementById('post-category-select');
    list.innerHTML = `<li onclick="loadPosts()">All</li>`;
    select.innerHTML = "";

    snap.forEach(docSnap => {
        const cat = docSnap.data();
        list.innerHTML += `<li onclick="loadPosts('${cat.name}')">${cat.name}</li>`;
        select.innerHTML += `<option value="${cat.name}">${cat.name}</option>`;
    });
});

// عرض المقالات (تمت إزالة زر الحذف نهائياً)
window.loadPosts = (filter = null) => {
    let q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    if(filter) q = query(collection(db, "posts"), where("category", "==", filter));

    onSnapshot(q, (snap) => {
        const container = document.getElementById('posts-container');
        container.innerHTML = "";

        snap.forEach(docSnap => {
            const post = docSnap.data();
            
            container.innerHTML += `
                <article class="post-card">
                    <div class="post-header">
                        <h2>${post.title}</h2>
                    </div>
                    <small>Category: ${post.category}</small>
                    <div class="post-body">${post.content}</div>
                </article>
            `;
        });
    });
};

// تأثير Matrix
const canvas = document.getElementById('matrix-canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const letters = "01010101ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const fontSize = 16;
const columns = canvas.width / fontSize;
const drops = Array(Math.floor(columns)).fill(1);

function drawMatrix() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#0F0";
    ctx.font = fontSize + "px monospace";
    for (let i = 0; i < drops.length; i++) {
        const text = letters.charAt(Math.floor(Math.random() * letters.length));
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
    }
}
// دالة عرض قائمة المقالات (Summary Cards)
window.loadPosts = (filter = null) => {
    // إخفاء عرض المقال الفردي وإظهار القائمة الرئيسية
    document.getElementById('posts-container').classList.remove('hidden');
    document.getElementById('single-post-view').classList.add('hidden');

    let q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    if(filter) q = query(collection(db, "posts"), where("category", "==", filter));

    onSnapshot(q, (snap) => {
        const container = document.getElementById('posts-container');
        container.innerHTML = "";

        snap.forEach(docSnap => {
            const post = docSnap.data();
            const postId = docSnap.id;
            
            // إنشاء بطاقة الملخص كما في الفيديو
            container.innerHTML += `
                <div class="post-card-summary" onclick="viewPost('${postId}')" style="cursor: pointer; margin-bottom: 20px; padding: 20px; background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="color: var(--accent); margin: 0;">${post.title}</h3>
                        <span style="font-size: 0.8rem; color: #8b949e;">2026</span>
                    </div>
                    <p style="color: #8b949e; margin-top: 10px; font-size: 0.9rem;">
                        ${post.content.replace(/<[^>]*>/g, '').substring(0, 120)}...
                    </p>
                </div>
            `;
        });
    });
};

// دالة عرض المقال الواحد بالكامل
window.viewPost = (id) => {
    const singleView = document.getElementById('single-post-view');
    const postsContainer = document.getElementById('posts-container');
    
    // جلب بيانات المقال من Firestore مرة واحدة
    const postRef = doc(db, "posts", id);
    onSnapshot(postRef, (docSnap) => {
        if (docSnap.exists()) {
            const post = docSnap.data();
            
            postsContainer.classList.add('hidden');
            singleView.classList.remove('hidden');

            singleView.innerHTML = `
                <button onclick="loadPosts()" class="btn-main" style="margin-bottom: 20px; padding: 5px 15px; font-size: 0.9rem;">← Return to homepage</button>
                <article class="post-card">
                    <h1 style="color: var(--accent); border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">${post.title}</h1>
                    <div style="margin: 10px 0; color: #8b949e; font-size: 0.8rem;">التصنيف: ${post.category}</div>
                    <div class="post-body" style="line-height: 1.8;">
                        ${post.content}
                    </div>
                </article>
            `;
        }
    });
};
setInterval(drawMatrix, 35);
