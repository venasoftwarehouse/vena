package id.riristartup.dianova.helpers

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import android.util.Log
import androidx.activity.result.ActivityResultLauncher
import androidx.annotation.RequiresApi

class BatteryOptimizationHelper(private val context: Context) {
    
    private val TAG = "BatteryOptimizationHelper"
    
    /**
     * Check if the app is ignoring battery optimizations
     */
    fun isIgnoringBatteryOptimizations(): Boolean {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
            return powerManager.isIgnoringBatteryOptimizations(context.packageName)
        }
        return true // For pre-Marshmallow devices, battery optimization is not a concern
    }
    
    /**
     * Request battery optimization exemption
     */
    @RequiresApi(Build.VERSION_CODES.M)
    fun requestBatteryOptimizationExemption(
        launcher: ActivityResultLauncher<Intent>,
        callback: (Boolean) -> Unit
    ) {
        try {
            if (isIgnoringBatteryOptimizations()) {
                callback(true)
                return
            }
            
            val intent = Intent().apply {
                action = Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS
                data = Uri.parse("package:${context.packageName}")
            }
            
            // Store callback to be used when activity result is received
            (context as? Activity)?.let { activity ->
                // We'll use a different approach since we can't directly pass callback to launcher
                launcher.launch(intent)
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error requesting battery optimization exemption", e)
            callback(false)
        }
    }
    
    /**
     * Open battery optimization settings for the app
     */
    fun openBatteryOptimizationSettings() {
        try {
            val intent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
            } else {
                // For pre-Marshmallow, open general battery settings
                Intent(Settings.ACTION_BATTERY_SAVER_SETTINGS)
            }
            context.startActivity(intent)
        } catch (e: Exception) {
            Log.e(TAG, "Error opening battery optimization settings", e)
        }
    }
}