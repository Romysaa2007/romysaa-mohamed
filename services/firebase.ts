
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// =================================================================
// 🛑 منطقة التعديل: قم بمسح الكائن بالأسفل واستبداله بكود Firebase الخاص بك
// =================================================================

const firebaseConfig = {
   apiKey: "AIzaSyCc13P1wHrWDc2QBGZIrXXDpwMrCTFKtuM",
  authDomain: "system-8747d.firebaseapp.com",
  projectId: "system-8747d",
  storageBucket: "system-8747d.firebasestorage.app",
  messagingSenderId: "954924619075",
  appId: "1:954924619075:web:f898f0e3f5987a3e4a0bf6"
};

// =================================================================
// لا تقم بتعديل أي شيء أسفل هذا الخط
// =================================================================

// التحقق من أن المفاتيح تم وضعها بشكل صحيح
const isConfigured = firebaseConfig.apiKey !== "PLACEHOLDER_API_KEY";

let app;
let db: any = null;
let auth: any = null;

if (isConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    console.log("✅ تم الاتصال بقاعدة البيانات السحابية بنجاح");
  } catch (error) {
    console.error("❌ فشل الاتصال بـ Firebase:", error);
  }
} else {
  console.log("⚠️ النظام يعمل في الوضع المحلي (لم يتم وضع مفاتيح الربط بعد)");
}

export { db, auth, isConfigured };
