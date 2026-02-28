package id.riristartup.dianova

import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.webkit.JavascriptInterface
import androidx.core.content.ContextCompat
import androidx.work.*
import java.util.concurrent.TimeUnit

class WebAppInterface(private val context: Context) {
    @JavascriptInterface
    fun openCustomTab(url: String) {
        val intent = android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse(url))
        intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
        context.startActivity(intent)
    }

    private fun checkNotificationPermission(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ContextCompat.checkSelfPermission(
                context,
                android.Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
        } else {
            true // For older Android versions, notifications are enabled by default
        }
    }
    
    private fun checkCameraPermission(): Boolean {
        val cameraPermission = android.Manifest.permission.CAMERA
        val storagePermission = android.Manifest.permission.READ_EXTERNAL_STORAGE
        
        return ContextCompat.checkSelfPermission(
            context,
            cameraPermission
        ) == PackageManager.PERMISSION_GRANTED &&
        ContextCompat.checkSelfPermission(
            context,
            storagePermission
        ) == PackageManager.PERMISSION_GRANTED
    }

    @JavascriptInterface
    fun hasCameraPermission(): Boolean {
        return checkCameraPermission()
    }
    
    @JavascriptInterface
    fun hasNotificationPermission(): Boolean {
        return checkNotificationPermission()
    }
    
    @JavascriptInterface
    fun requestCameraPermission() {
        // Request camera permission through MainActivity
        val activity = context as? MainActivity
        activity?.requestCameraPermission()
    }
    
    @JavascriptInterface
    fun requestNotificationPermission() {
        // Request notification permission through MainActivity
        val activity = context as? MainActivity
        activity?.requestNotificationPermission()
    }
    
    @JavascriptInterface
    fun signInWithGoogle() {
        // Trigger Google Sign-In through MainActivity
        val activity = context as? MainActivity
        activity?.signInWithGoogle()
    }

    @JavascriptInterface
    fun scheduleScanReminder(hours: Int) {
        if (!checkNotificationPermission()) {
            // Request notification permission
            requestNotificationPermission()
            return
        }
        
        val workManager = WorkManager.getInstance(context)

        val data = Data.Builder()
            .putString("title", "Dianova Scan Reminder")
            .putString("message", "It's time to scan your patch!")
            .build()

        val scanReminderWork = OneTimeWorkRequestBuilder<NotificationWorker>()
            .setInitialDelay(hours.toLong(), TimeUnit.HOURS)
            .setInputData(data)
            .build()

        workManager.enqueueUniqueWork(
            "scanReminder",
            ExistingWorkPolicy.REPLACE,
            scanReminderWork
        )
    }

    @JavascriptInterface
    fun scheduleDailyReminder(hour: Int, minute: Int) {
        if (!checkNotificationPermission()) {
            // Request notification permission
            requestNotificationPermission()
            return
        }
        
        val workManager = WorkManager.getInstance(context)

        val data = Data.Builder()
            .putString("title", "Dianova Daily Reminder")
            .putString("message", "Don't forget to maintain a healthy lifestyle today!")
            .build()

        val dailyReminderWork = PeriodicWorkRequestBuilder<NotificationWorker>(1, TimeUnit.DAYS)
            .setInitialDelay(calculateInitialDelay(hour, minute), TimeUnit.MILLISECONDS)
            .setInputData(data)
            .build()

        workManager.enqueueUniquePeriodicWork(
            "dailyReminder",
            ExistingPeriodicWorkPolicy.REPLACE,
            dailyReminderWork
        )
    }

    private fun calculateInitialDelay(hour: Int, minute: Int): Long {
        val currentTime = System.currentTimeMillis()
        val calendar = java.util.Calendar.getInstance().apply {
            set(java.util.Calendar.HOUR_OF_DAY, hour)
            set(java.util.Calendar.MINUTE, minute)
            set(java.util.Calendar.SECOND, 0)
        }
        if (calendar.timeInMillis <= currentTime) {
            calendar.add(java.util.Calendar.DAY_OF_YEAR, 1)
        }
        return calendar.timeInMillis - currentTime
    }
}
