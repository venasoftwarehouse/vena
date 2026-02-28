package id.riristartup.dianova

import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.webkit.JavascriptInterface
import android.webkit.WebView
import androidx.activity.result.ActivityResultLauncher

class PasskeyWebListener(private val activity: Activity, private val webView: WebView) {
    
    @JavascriptInterface
    fun handlePasskeyRequest(passkeyData: String) {
        // Handle passkey request from JavaScript
        activity.runOnUiThread {
            // Process the passkey data
            val uri = Uri.parse(passkeyData)
            val intent = Intent(Intent.ACTION_VIEW, uri)
            activity.startActivity(intent)
        }
    }
    
    class PasskeyHandler(private val activity: Activity) {
        
        fun handlePasskeyRequest(url: String) {
            // Handle passkey request from URL
            val uri = Uri.parse(url)
            val intent = Intent(Intent.ACTION_VIEW, uri)
            activity.startActivity(intent)
        }
        
        fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
            // Handle activity result if needed
        }
    }
}