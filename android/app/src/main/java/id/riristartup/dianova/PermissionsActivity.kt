package id.riristartup.dianova

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.widget.Button
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.annotation.RequiresApi
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import id.riristartup.dianova.helpers.BatteryOptimizationHelper

class PermissionsActivity : AppCompatActivity() {

    private val TAG = "PermissionsActivity"
    private lateinit var batteryOptimizationHelper: BatteryOptimizationHelper
    
    private val requiredPermissions = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        arrayOf(
            Manifest.permission.CAMERA,
            Manifest.permission.READ_MEDIA_IMAGES,
            Manifest.permission.POST_NOTIFICATIONS
        )
    } else {
        arrayOf(
            Manifest.permission.CAMERA,
            Manifest.permission.READ_EXTERNAL_STORAGE,
            Manifest.permission.WRITE_EXTERNAL_STORAGE
        )
    }

    @RequiresApi(Build.VERSION_CODES.UPSIDE_DOWN_CAKE)
    private val requestPermissionsLauncher =
        registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { permissions ->
            Log.d(TAG, "Permission request results: $permissions")

            val deniedPermissions = permissions.filter { !it.value }.map { it.key }
            val allGranted = deniedPermissions.isEmpty()

            if (allGranted) {
                Log.d(TAG, "All basic permissions granted")
                checkBatteryOptimizationAndProceed()
            } else {
                Log.d(TAG, "Some basic permissions denied")
                checkWhichPermissionsAreDenied(permissions)

                deniedPermissions.forEach { permission ->
                    if (shouldShowRequestPermissionRationale(permission)) {
                        // Tampilkan rationale kenapa permission dibutuhkan
                        Toast.makeText(
                            this,
                            "Permission $permission diperlukan agar aplikasi dapat berjalan dengan baik.",
                            Toast.LENGTH_LONG
                        ).show()
                    } else {
                        // User memilih 'Don't ask again', arahkan ke pengaturan aplikasi
                        Toast.makeText(
                            this,
                            "Permission $permission ditolak secara permanen. Silakan aktifkan di pengaturan aplikasi.",
                            Toast.LENGTH_LONG
                        ).show()
                        // Buka pengaturan aplikasi
                        val intent = Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
                        intent.data = android.net.Uri.fromParts("package", packageName, null)
                        startActivity(intent)
                    }
                }
                // Jangan lanjutkan, tetap di halaman permission
            }
        }

    @RequiresApi(Build.VERSION_CODES.UPSIDE_DOWN_CAKE)
    private val batteryOptimizationLauncher =
        registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
            Log.d(TAG, "Battery optimization settings result: ${result.resultCode}")
            checkBatteryOptimizationAndProceed()
        }

    @RequiresApi(Build.VERSION_CODES.UPSIDE_DOWN_CAKE)
    override fun onCreate(savedInstanceState: Bundle?) {
        Log.d(TAG, "onCreate called")
        super.onCreate(savedInstanceState)

        // Initialize battery optimization helper
        batteryOptimizationHelper = BatteryOptimizationHelper(this)
        
        // Log all permissions declared in manifest
        logManifestPermissions()
        
        if (areAllPermissionsGranted() && batteryOptimizationHelper.isIgnoringBatteryOptimizations()) {
            Log.d(TAG, "All permissions and optimizations already granted, navigating to main app")
            navigateToMainApp()
            return
        }

        setContentView(R.layout.activity_permissions)

        val grantButton: Button = findViewById(R.id.grant_permissions_button)
            grantButton.setOnClickListener {
                Log.d(TAG, "Grant button clicked")
                Log.d(TAG, "Requesting basic permissions")
                // Cek permission yang belum granted
                val deniedPermissions = requiredPermissions.filter {
                    ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
                }
                if (deniedPermissions.isNotEmpty()) {
                    requestPermissionsLauncher.launch(deniedPermissions.toTypedArray())
                } else {
                    // Semua permission sudah granted, lanjutkan proses
                    checkBatteryOptimizationAndProceed()
                }
            }
    }

    private fun logManifestPermissions() {
        Log.d(TAG, "=== MANIFEST PERMISSIONS CHECK ===")
        val packageManager = packageManager
        val packageInfo = packageManager.getPackageInfo(packageName, PackageManager.GET_PERMISSIONS)
        val requestedPermissions = packageInfo.requestedPermissions
        
        requestedPermissions?.forEach { permission ->
            val granted = ContextCompat.checkSelfPermission(this, permission) == PackageManager.PERMISSION_GRANTED
            Log.d(TAG, "Manifest permission: $permission - Granted: $granted")
        }
        Log.d(TAG, "=== END MANIFEST PERMISSIONS CHECK ===")
    }

    private fun checkWhichPermissionsAreDenied(permissions: Map<String, Boolean>) {
        Log.d(TAG, "=== CHECKING DENIED PERMISSIONS ===")
        permissions.forEach { (permission, granted) ->
            if (!granted) {
                Log.d(TAG, "Denied permission: $permission")
            }
        }
        Log.d(TAG, "=== END CHECKING DENIED PERMISSIONS ===")
    }

    private fun areAllPermissionsGranted(): Boolean {
        val allGranted = requiredPermissions.all {
            ContextCompat.checkSelfPermission(this, it) == PackageManager.PERMISSION_GRANTED
        }
        Log.d(TAG, "Basic permissions granted: $allGranted")
        return allGranted
    }

    @RequiresApi(Build.VERSION_CODES.UPSIDE_DOWN_CAKE)
    private fun checkBatteryOptimizationAndProceed() {
        if (batteryOptimizationHelper.isIgnoringBatteryOptimizations()) {
            Log.d(TAG, "Battery optimization exemption already granted")
            navigateToMainApp()
        } else {
            Log.d(TAG, "Requesting battery optimization exemption")
            batteryOptimizationHelper.requestBatteryOptimizationExemption(
                batteryOptimizationLauncher,
                { granted ->
                    if (granted) {
                        Log.d(TAG, "Battery optimization exemption granted")
                        navigateToMainApp()
                    } else {
                        Log.d(TAG, "Battery optimization exemption denied")
                        Toast.makeText(
                            this,
                            "For best performance, please grant battery optimization exemption",
                            Toast.LENGTH_LONG
                        ).show()
                        // Still navigate to main app even if battery optimization exemption is denied
                        navigateToMainApp()
                    }
                }
            )
        }
    }

    private fun navigateToMainApp() {
        Log.d(TAG, "Starting MainActivity")
        val intent = Intent(this, MainActivity::class.java)
        startActivity(intent)
        finish()
    }
}