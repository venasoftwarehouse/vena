import admin from "firebase-admin";

if (!admin.apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "{}");
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
    console.log("success")
}

export const firestore = admin.firestore();
export const auth = admin.auth();
export const db = admin.firestore();

export default admin;