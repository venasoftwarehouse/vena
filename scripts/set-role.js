// Firebase Admin SDK - Custom Claims Script
// Install dependencies: npm install firebase-admin dotenv

require('dotenv').config();
const admin = require('firebase-admin');

// Inisialisasi Firebase Admin SDK dari environment variable
try {
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  
  console.log('✓ Firebase Admin SDK berhasil diinisialisasi\n');
} catch (error) {
  console.error('✗ Error inisialisasi Firebase Admin SDK:');
  console.error('  Pastikan FIREBASE_SERVICE_ACCOUNT ada di file .env');
  console.error('  Error:', error.message);
  process.exit(1);
}

/**
 * Buat user baru dengan email dan password
 * @param {string} email - Email user
 * @param {string} password - Password user
 * @param {string} displayName - Nama user (opsional)
 * @param {string} role - Role user (opsional)
 */
async function createUser(email, password, displayName = null, role = null) {
  try {
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: displayName,
      emailVerified: false
    });
    
    console.log(`✓ User berhasil dibuat dengan UID: ${userRecord.uid}`);
    console.log(`  Email: ${email}`);
    if (displayName) console.log(`  Nama: ${displayName}`);
    
    // Set role jika ada
    if (role && ['admin', 'doctor', 'nurse'].includes(role)) {
      await setCustomClaims(userRecord.uid, { role: role });
    }
    
    return userRecord;
  } catch (error) {
    console.error('✗ Error creating user:', error.message);
    return null;
  }
}

/**
 * Set custom claims untuk user berdasarkan UID
 * @param {string} uid - User ID dari Firebase Auth
 * @param {object} customClaims - Object berisi custom claims yang ingin diset
 */
async function setCustomClaims(uid, customClaims) {
  try {
    await admin.auth().setCustomUserClaims(uid, customClaims);
    console.log(`✓ Custom claims berhasil diset untuk user: ${uid}`);
    console.log('Claims:', JSON.stringify(customClaims, null, 2));
    
    // Verifikasi claims yang sudah diset
    const user = await admin.auth().getUser(uid);
    console.log('Custom claims user saat ini:', user.customClaims);
    
    return true;
  } catch (error) {
    console.error('✗ Error setting custom claims:', error.message);
    return false;
  }
}

/**
 * Set role untuk user (contoh: admin, doctor, nurse)
 * @param {string} uid - User ID
 * @param {string} role - Role yang ingin diset
 */
async function setUserRole(uid, role) {
  const validRoles = ['admin', 'doctor', 'nurse'];
  
  if (!validRoles.includes(role)) {
    console.error(`✗ Role tidak valid. Pilih dari: ${validRoles.join(', ')}`);
    return false;
  }
  
  return await setCustomClaims(uid, { role: role });
}

/**
 * Set multiple custom claims sekaligus
 * @param {string} uid - User ID
 * @param {object} claims - Object dengan multiple claims
 */
async function setMultipleClaims(uid, claims) {
  return await setCustomClaims(uid, claims);
}

/**
 * Hapus custom claims dari user
 * @param {string} uid - User ID
 */
async function removeCustomClaims(uid) {
  try {
    await admin.auth().setCustomUserClaims(uid, null);
    console.log(`✓ Custom claims berhasil dihapus untuk user: ${uid}`);
    return true;
  } catch (error) {
    console.error('✗ Error removing custom claims:', error.message);
    return false;
  }
}

/**
 * Get custom claims dari user
 * @param {string} uid - User ID
 */
async function getUserClaims(uid) {
  try {
    const user = await admin.auth().getUser(uid);
    console.log(`Custom claims untuk user ${uid}:`, user.customClaims);
    return user.customClaims;
  } catch (error) {
    console.error('✗ Error getting user claims:', error.message);
    return null;
  }
}

/**
 * Set claims berdasarkan email
 * @param {string} email - Email user
 * @param {object} customClaims - Custom claims
 */
async function setClaimsByEmail(email, customClaims) {
  try {
    const user = await admin.auth().getUserByEmail(email);
    return await setCustomClaims(user.uid, customClaims);
  } catch (error) {
    console.error('✗ Error finding user by email:', error.message);
    return false;
  }
}

// ============================================
// INTERACTIVE CLI
// ============================================

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

function displayMenu() {
  console.log('\n========================================');
  console.log('   FIREBASE CUSTOM CLAIMS MANAGER');
  console.log('========================================');
  console.log('1. Buat User Baru');
  console.log('2. Set Role User (admin/doctor/nurse)');
  console.log('3. Set Custom Claims (multiple)');
  console.log('4. Lihat Custom Claims User');
  console.log('5. Hapus Custom Claims User');
  console.log('6. Set Claims by Email');
  console.log('7. Keluar');
  console.log('========================================\n');
}

async function interactiveMode() {
  let running = true;
  
  while (running) {
    displayMenu();
    const choice = await question('Pilih menu (1-7): ');
    
    switch (choice.trim()) {
      case '1':
        console.log('\n--- Buat User Baru ---');
        const newEmail = await question('Email: ');
        const newPassword = await question('Password (min 6 karakter): ');
        const newDisplayName = await question('Nama Lengkap: ');
        
        console.log('\nPilih role:');
        console.log('1. admin');
        console.log('2. doctor');
        console.log('3. nurse');
        console.log('4. Tidak ada role (patient)');
        const newRoleChoice = await question('Pilih (1-4): ');
        
        const roleMap = { '1': 'admin', '2': 'doctor', '3': 'nurse', '4': null };
        const newRole = roleMap[newRoleChoice.trim()];
        
        if (newRoleChoice.trim() === '4' || newRole) {
          await createUser(newEmail.trim(), newPassword.trim(), newDisplayName.trim(), newRole);
        } else {
          console.log('✗ Pilihan tidak valid!');
        }
        break;
        
      case '2':
        const uid1 = await question('Masukkan UID user: ');
        console.log('\nPilih role:');
        console.log('1. admin');
        console.log('2. doctor');
        console.log('3. nurse');
        const roleChoice = await question('Pilih (1-3): ');
        
        const roles = { '1': 'admin', '2': 'doctor', '3': 'nurse' };
        const selectedRole = roles[roleChoice.trim()];
        
        if (selectedRole) {
          await setUserRole(uid1.trim(), selectedRole);
        } else {
          console.log('✗ Pilihan tidak valid!');
        }
        break;
        
      case '3':
        const uid2 = await question('Masukkan UID user: ');
        console.log('\nMasukkan custom claims dalam format JSON');
        console.log('Contoh: {"role":"admin","department":"IT","level":"senior"}');
        const claimsInput = await question('Custom claims: ');
        
        try {
          const claims = JSON.parse(claimsInput);
          await setMultipleClaims(uid2.trim(), claims);
        } catch (error) {
          console.log('✗ Format JSON tidak valid!');
        }
        break;
        
      case '4':
        const uid3 = await question('Masukkan UID user: ');
        await getUserClaims(uid3.trim());
        break;
        
      case '5':
        const uid4 = await question('Masukkan UID user: ');
        const confirm = await question('Yakin ingin hapus semua custom claims? (y/n): ');
        
        if (confirm.toLowerCase() === 'y') {
          await removeCustomClaims(uid4.trim());
        } else {
          console.log('Dibatalkan.');
        }
        break;
        
      case '6':
        const email = await question('Masukkan email user: ');
        console.log('\nMasukkan custom claims dalam format JSON');
        console.log('Contoh: {"role":"admin","department":"IT"}');
        const emailClaims = await question('Custom claims: ');
        
        try {
          const claims = JSON.parse(emailClaims);
          await setClaimsByEmail(email.trim(), claims);
        } catch (error) {
          console.log('✗ Format JSON tidak valid!');
        }
        break;
        
      case '7':
        console.log('\n👋 Terima kasih! Sampai jumpa.\n');
        running = false;
        rl.close();
        break;
        
      default:
        console.log('✗ Pilihan tidak valid! Silakan pilih 1-7.');
    }
    
    if (running) {
      await question('\nTekan Enter untuk melanjutkan...');
    }
  }
}

// ============================================
// JALANKAN INTERACTIVE MODE
// ============================================

console.log('🔥 Memulai Firebase Custom Claims Manager...\n');

// Jalankan mode interaktif
interactiveMode().catch(error => {
  console.error('Error:', error);
  rl.close();
});

// Export functions untuk digunakan di module lain
module.exports = {
  createUser,
  setCustomClaims,
  setUserRole,
  setMultipleClaims,
  removeCustomClaims,
  getUserClaims,
  setClaimsByEmail
};