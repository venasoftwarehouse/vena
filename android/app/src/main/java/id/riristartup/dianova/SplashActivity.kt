package id.riristartup.dianova

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import id.riristartup.dianova.helpers.BatteryOptimizationHelper

class SplashActivity : AppCompatActivity() {

    private val SPLASH_DELAY: Long = 2000 // 2 seconds

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Don't set a content view to avoid overlapping with the theme-based splash screen

        // Navigate to appropriate activity after delay
        Handler(Looper.getMainLooper()).postDelayed({
            if (shouldShowPermissionsActivity()) {
                val permissionsIntent = Intent(this, PermissionsActivity::class.java)
                startActivity(permissionsIntent)
            } else {
                val mainIntent = Intent(this, MainActivity::class.java)
                startActivity(mainIntent)
            }
            finish()
        }, SPLASH_DELAY)
    }

    private fun shouldShowPermissionsActivity(): Boolean {
        // Check if all required permissions are granted
        val requiredPermissions = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
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

        val allPermissionsGranted = requiredPermissions.all {
            ContextCompat.checkSelfPermission(this, it) == PackageManager.PERMISSION_GRANTED
        }

        // Check battery optimization
        val batteryOptimizationHelper = BatteryOptimizationHelper(this)
        val isIgnoringBatteryOptimizations = batteryOptimizationHelper.isIgnoringBatteryOptimizations()

        // Show permissions activity if any permission or optimization is missing
        return !(allPermissionsGranted && isIgnoringBatteryOptimizations)
    }
}