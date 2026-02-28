package id.riristartup.dianova

import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.MediaStore
import android.util.Log
import android.webkit.CookieManager
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.webkit.ValueCallback
import android.webkit.WebChromeClient.FileChooserParams
import android.widget.Toast
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.credentials.ClearCredentialStateRequest
import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetCredentialResponse
import androidx.credentials.exceptions.GetCredentialException
import androidx.credentials.exceptions.NoCredentialException
import androidx.lifecycle.lifecycleScope
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.firebase.messaging.FirebaseMessaging
import id.riristartup.dianova.PasskeyWebListener.PasskeyHandler
import id.riristartup.dianova.helpers.BatteryOptimizationHelper
import kotlinx.coroutines.launch
import java.io.File
import java.io.IOException
import java.security.MessageDigest
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.UUID

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var filePickerLauncher: ActivityResultLauncher<String>
    private lateinit var cameraLauncher: ActivityResultLauncher<Intent>
    private lateinit var permissionLauncher: ActivityResultLauncher<Array<String>>
    private lateinit var credentialManager: CredentialManager

    // File upload callback untuk WebView
    private var fileUploadCallback: ValueCallback<Array<Uri>>? = null
    private var capturedImageUri: Uri? = null

    private val passkeyHandler = PasskeyHandler(this)
    private lateinit var batteryOptimizationHelper: BatteryOptimizationHelper

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // Initialize battery optimization helper
        batteryOptimizationHelper = BatteryOptimizationHelper(this)
        
        // Initialize Credential Manager
        credentialManager = CredentialManager.create(this)

        webView = findViewById(R.id.webview)
        setupWebView()

        // Initialize file picker launcher - Untuk file picker manual
        filePickerLauncher = registerForActivityResult(ActivityResultContracts.GetContent()) { uri: Uri? ->
            uri?.let {
                val filePath = getPathFromUri(it)
                webView.evaluateJavascript(
                    "window.handleFileUpload && window.handleFileUpload('$filePath')",
                    null
                )
            }
        }

        // Initialize camera launcher - Untuk camera manual dan WebView file chooser
        cameraLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
            if (result.resultCode == RESULT_OK) {
                capturedImageUri?.let { uri ->
                    // Untuk WebView file chooser callback
                    fileUploadCallback?.onReceiveValue(arrayOf(uri))
                    fileUploadCallback = null
                    
                    // Untuk manual camera handling
                    webView.evaluateJavascript(
                        "window.handleCameraCapture && window.handleCameraCapture('$uri')",
                        null
                    )
                    
                    Toast.makeText(this, "Image captured successfully", Toast.LENGTH_SHORT).show()
                } ?: run {
                    // Fallback untuk camera result dari intent extras
                    val imageBitmap = result.data?.extras?.get("data") as? Bitmap
                    imageBitmap?.let {
                        Toast.makeText(this, "Image captured", Toast.LENGTH_SHORT).show()
                    }
                }
            } else {
                // Jika user cancel camera
                fileUploadCallback?.onReceiveValue(null)
                fileUploadCallback = null
            }
        }

        // Initialize permission launcher for runtime permission requests
        permissionLauncher = registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { permissions ->
            val cameraPermissionGranted = permissions[android.Manifest.permission.CAMERA] ?: false
            val storagePermissionGranted = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                permissions[android.Manifest.permission.READ_MEDIA_IMAGES] ?: false
            } else {
                permissions[android.Manifest.permission.READ_EXTERNAL_STORAGE] ?: false
            }
            val notificationPermissionGranted = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                permissions[android.Manifest.permission.POST_NOTIFICATIONS] ?: false
            } else {
                true // For older Android versions, notifications are enabled by default
            }
            
            if (cameraPermissionGranted && storagePermissionGranted && notificationPermissionGranted) {
                // All permissions granted
                Toast.makeText(this, "All permissions granted", Toast.LENGTH_SHORT).show()
            } else {
                // Some permissions denied
                val deniedPermissions = mutableListOf<String>()
                if (!cameraPermissionGranted) deniedPermissions.add("Camera")
                if (!storagePermissionGranted) deniedPermissions.add("Storage")
                if (!notificationPermissionGranted) deniedPermissions.add("Notifications")
                
                Toast.makeText(this, "Denied permissions: ${deniedPermissions.joinToString(", ")}", Toast.LENGTH_LONG).show()
            }
        }

        // Handle deep links
        handleIntent(intent)

        // Subscribe to FCM topic
        FirebaseMessaging.getInstance().subscribeToTopic("dianova_updates")
            .addOnCompleteListener { task ->
                if (task.isSuccessful) {
                    // Successfully subscribed
                } else {
                    // Failed to subscribe
                }
            }

        // Handle back button press
        val onBackPressedCallback = object : androidx.activity.OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (webView.canGoBack()) {
                    webView.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        }
        onBackPressedDispatcher.addCallback(this, onBackPressedCallback)
    }

    override fun onResume() {
        super.onResume()
        // Check if we still have all required permissions
        if (!hasAllRequiredPermissions()) {
            // If permissions are missing, redirect to PermissionsActivity
            val intent = Intent(this, PermissionsActivity::class.java)
            startActivity(intent)
            finish()
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        handleIntent(intent)
    }

    private fun handleIntent(intent: Intent) {
        val data: Uri? = intent.data
        data?.let {
            val url = it.toString()
            webView.loadUrl(url)
        }
    }

    private fun hasAllRequiredPermissions(): Boolean {
        // Check if all required permissions are granted
        val requiredPermissions = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            arrayOf(
                android.Manifest.permission.CAMERA,
                android.Manifest.permission.READ_MEDIA_IMAGES,
                android.Manifest.permission.POST_NOTIFICATIONS
            )
        } else {
            arrayOf(
                android.Manifest.permission.CAMERA,
                android.Manifest.permission.READ_EXTERNAL_STORAGE,
                android.Manifest.permission.WRITE_EXTERNAL_STORAGE
            )
        }

        val allPermissionsGranted = requiredPermissions.all {
            ContextCompat.checkSelfPermission(this, it) == PackageManager.PERMISSION_GRANTED
        }

        // Check battery optimization
        val isIgnoringBatteryOptimizations = batteryOptimizationHelper.isIgnoringBatteryOptimizations()

        return allPermissionsGranted && isIgnoringBatteryOptimizations
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        val webSettings = webView.settings
        webSettings.javaScriptEnabled = true
        webSettings.allowFileAccess = true
        webSettings.allowContentAccess = true
        webSettings.allowFileAccessFromFileURLs = true
        webSettings.allowUniversalAccessFromFileURLs = true
        webSettings.mediaPlaybackRequiresUserGesture = false
        
        // Add WebAppInterface for JavaScript communication
        webView.addJavascriptInterface(WebAppInterface(this), "WebAppInterface")
        
        // Add this interface for permission checks
        webView.addJavascriptInterface(object {
            @JavascriptInterface
            fun hasCameraPermission(): Boolean {
                return this@MainActivity.hasCameraPermission()
            }
            
            @JavascriptInterface
            fun hasStoragePermission(): Boolean {
                return this@MainActivity.hasStoragePermission()
            }
            
            @JavascriptInterface
            fun hasNotificationPermission(): Boolean {
                return this@MainActivity.hasNotificationPermission()
            }
            
            @JavascriptInterface
            fun requestCameraPermission() {
                this@MainActivity.requestCameraPermission()
            }
            
            @JavascriptInterface
            fun requestStoragePermission() {
                this@MainActivity.requestStoragePermission()
            }
            
            @JavascriptInterface
            fun requestNotificationPermission() {
                this@MainActivity.requestNotificationPermission()
            }
            
            @JavascriptInterface
            fun goToPermissionsScreen() {
                val intent = Intent(this@MainActivity, PermissionsActivity::class.java)
                startActivity(intent)
            }
            
            @JavascriptInterface
            fun signInWithGoogle() {
                this@MainActivity.signInWithGoogle()
            }
            
            @JavascriptInterface
            fun openCamera() {
                this@MainActivity.openCamera()
            }
            
            @JavascriptInterface
            fun openFilePicker() {
                this@MainActivity.openFilePicker()
            }
        }, "Android")
        
        webSettings.domStorageEnabled = true
        
        // Enable mixed content (HTTP and HTTPS)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            webSettings.mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
        }

        // Set custom web view client
        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView?, request: WebResourceRequest?): Boolean {
                val url = request?.url?.toString()

                // Intercept Google Sign-In & Credential Manager URLs
                if (url?.contains("accounts.google.com") == true || url?.contains("oauth2") == true || url?.contains("credential") == true) {
                    // Instead of opening in external browser, handle with Credential Manager
                    signInWithGoogle()
                    return true
                }

                // Handle passkey authentication
                if (url?.startsWith("dianova://passkey") == true) {
                    passkeyHandler.handlePasskeyRequest(url)
                    return true
                }

                // Handle file uploads
                if (url?.startsWith("dianova://file-picker") == true) {
                    openFilePicker()
                    return true
                }

                // Handle camera
                if (url?.startsWith("dianova://camera") == true) {
                    openCamera()
                    return true
                }

                // Open external URLs in browser
                if (url?.startsWith("http://") == true || url?.startsWith("https://") == true) {
                    if (url?.contains("dianova.vercel.app") == true) {
                        // Load internal URLs in webview
                        view?.loadUrl(url)
                        return true
                    } else {
                        // Open external URLs in browser
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url))
                        startActivity(intent)
                        return true
                    }
                }

                return false
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                // Inject JavaScript for handling file uploads
                injectFileUploadScript()
                // Inject JavaScript for checking permissions
                injectPermissionCheckScript()
                // Send FCM token to WebView
                sendFcmTokenToWebView()
            }
        }

        // Set web chrome client for handling file uploads - INI YANG PENTING!
        webView.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(
                webView: WebView,
                filePathCallback: ValueCallback<Array<Uri>>,
                fileChooserParams: FileChooserParams
            ): Boolean {
                // Cancel any existing callback
                fileUploadCallback?.onReceiveValue(null)
                fileUploadCallback = filePathCallback

                try {
                    val acceptTypes = fileChooserParams.acceptTypes
                    val isCameraCapture = fileChooserParams.isCaptureEnabled

                    when {
                        // Jika accept image dan camera capture enabled
                        isCameraCapture && acceptTypes.any { it.startsWith("image") } -> {
                            showImageSourceDialog()
                        }
                        // Jika hanya camera capture
                        isCameraCapture -> {
                            launchCamera()
                        }
                        // Jika accept image tapi tidak capture
                        acceptTypes.any { it.startsWith("image") } -> {
                            launchImagePicker()
                        }
                        // Default file picker
                        else -> {
                            launchFilePicker()
                        }
                    }
                    return true
                } catch (e: Exception) {
                    Log.e("MainActivity", "Error opening file chooser", e)
                    fileUploadCallback?.onReceiveValue(null)
                    fileUploadCallback = null
                    return false
                }
            }

            // Handle permission requests from WebView
            override fun onPermissionRequest(request: android.webkit.PermissionRequest) {
                lifecycleScope.launch {
                    val permissionsToRequest = mutableListOf<String>()
                    
                    // Check for camera permission
                    if (request.resources.contains(android.webkit.PermissionRequest.RESOURCE_VIDEO_CAPTURE)) {
                        if (ContextCompat.checkSelfPermission(this@MainActivity, android.Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
                            permissionsToRequest.add(android.Manifest.permission.CAMERA)
                        }
                    }
                    
                    // Check for microphone permission
                    if (request.resources.contains(android.webkit.PermissionRequest.RESOURCE_AUDIO_CAPTURE)) {
                        if (ContextCompat.checkSelfPermission(this@MainActivity, android.Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
                            permissionsToRequest.add(android.Manifest.permission.RECORD_AUDIO)
                        }
                    }

                    if (permissionsToRequest.isNotEmpty()) {
                        // Request permissions using the launcher
                        permissionLauncher.launch(permissionsToRequest.toTypedArray())
                        
                        // We need to wait for the user's response, so we can't grant immediately.
                        // For simplicity, we'll deny the request for now and let the user re-trigger the action.
                        // A more advanced implementation would involve a callback mechanism.
                        request.deny()
                    } else {
                        // Permissions are already granted
                        request.grant(request.resources)
                    }
                }
            }
        }

        // Load the initial URL
        webView.loadUrl("https://dianova.vercel.app/app")
    }

    // Dialog untuk memilih sumber gambar (camera atau gallery)
    private fun showImageSourceDialog() {
        val options = arrayOf("Camera", "Gallery")
        androidx.appcompat.app.AlertDialog.Builder(this)
            .setTitle("Select Image Source")
            .setItems(options) { _, which ->
                when (which) {
                    0 -> launchCamera()
                    1 -> launchImagePicker()
                }
            }
            .setOnCancelListener {
                fileUploadCallback?.onReceiveValue(null)
                fileUploadCallback = null
            }
            .show()
    }

    // Launch camera untuk file chooser
    private fun launchCamera() {
        if (!hasCameraPermission()) {
            Toast.makeText(this, "Camera permission required", Toast.LENGTH_SHORT).show()
            fileUploadCallback?.onReceiveValue(null)
            fileUploadCallback = null
            return
        }

        try {
            // Buat file untuk menyimpan hasil foto
            val photoFile = createImageFile()
            capturedImageUri = FileProvider.getUriForFile(
                this,
                "${packageName}.fileprovider",
                photoFile
            )

            val cameraIntent = Intent(MediaStore.ACTION_IMAGE_CAPTURE)
            cameraIntent.putExtra(MediaStore.EXTRA_OUTPUT, capturedImageUri)
            cameraLauncher.launch(cameraIntent)
        } catch (e: Exception) {
            Log.e("MainActivity", "Error launching camera", e)
            Toast.makeText(this, "Cannot open camera", Toast.LENGTH_SHORT).show()
            fileUploadCallback?.onReceiveValue(null)
            fileUploadCallback = null
        }
    }

    // Launch image picker
    private fun launchImagePicker() {
        if (!hasStoragePermission()) {
            Toast.makeText(this, "Storage permission required", Toast.LENGTH_SHORT).show()
            fileUploadCallback?.onReceiveValue(null)
            fileUploadCallback = null
            return
        }

        val intent = Intent(Intent.ACTION_GET_CONTENT)
        intent.type = "image/*"
        intent.addCategory(Intent.CATEGORY_OPENABLE)
        
        val chooser = Intent.createChooser(intent, "Select Image")
        try {
            startActivityForResult(chooser, FILE_PICKER_REQUEST_CODE)
        } catch (e: Exception) {
            Log.e("MainActivity", "Error launching image picker", e)
            Toast.makeText(this, "Cannot open image picker", Toast.LENGTH_SHORT).show()
            fileUploadCallback?.onReceiveValue(null)
            fileUploadCallback = null
        }
    }

    // Launch file picker umum
    private fun launchFilePicker() {
        val intent = Intent(Intent.ACTION_GET_CONTENT)
        intent.type = "*/*"
        intent.addCategory(Intent.CATEGORY_OPENABLE)
        
        val chooser = Intent.createChooser(intent, "Select File")
        try {
            startActivityForResult(chooser, FILE_PICKER_REQUEST_CODE)
        } catch (e: Exception) {
            Log.e("MainActivity", "Error launching file picker", e)
            Toast.makeText(this, "Cannot open file picker", Toast.LENGTH_SHORT).show()
            fileUploadCallback?.onReceiveValue(null)
            fileUploadCallback = null
        }
    }

    // Buat file untuk menyimpan hasil kamera
    @Throws(IOException::class)
    private fun createImageFile(): File {
        val timeStamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(Date())
        val imageFileName = "JPEG_${timeStamp}_"
        val storageDir = getExternalFilesDir("Pictures")
        return File.createTempFile(imageFileName, ".jpg", storageDir)
    }

    companion object {
        private const val FILE_PICKER_REQUEST_CODE = 1001
    }

    // Handle hasil dari file picker
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        
        when (requestCode) {
            FILE_PICKER_REQUEST_CODE -> {
                if (resultCode == RESULT_OK && data != null) {
                    val uri = data.data
                    if (uri != null) {
                        fileUploadCallback?.onReceiveValue(arrayOf(uri))
                    } else {
                        fileUploadCallback?.onReceiveValue(null)
                    }
                } else {
                    fileUploadCallback?.onReceiveValue(null)
                }
                fileUploadCallback = null
            }
            else -> {
                passkeyHandler.onActivityResult(requestCode, resultCode, data)
            }
        }
    }

    private fun sendFcmTokenToWebView() {
        FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
            if (!task.isSuccessful) {
                return@addOnCompleteListener
            }
            val token = task.result
            val script = "window.handleFcmToken && window.handleFcmToken('$token')"
            webView.evaluateJavascript(script, null)
        }
    }

    private fun injectFileUploadScript() {
        val script = """
            (function() {
                if (!window.handleFileUpload) {
                    window.handleFileUpload = function(filePath) {
                        const event = new CustomEvent('fileUploaded', { detail: { filePath } });
                        document.dispatchEvent(event);
                    };
                }
                
                if (!window.handleCameraCapture) {
                    window.handleCameraCapture = function(imageUri) {
                        const event = new CustomEvent('cameraCapture', { detail: { imageUri } });
                        document.dispatchEvent(event);
                    };
                }
                
                // Function untuk membuka camera dari JavaScript
                if (!window.openCamera) {
                    window.openCamera = function() {
                        Android.openCamera();
                    };
                }
                
                // Function untuk membuka file picker dari JavaScript
                if (!window.openFilePicker) {
                    window.openFilePicker = function() {
                        Android.openFilePicker();
                    };
                }
            })();
        """.trimIndent()

        webView.evaluateJavascript(script, null)
    }
    
    private fun injectPermissionCheckScript() {
        val script = """
            (function() {
                // Override getUserMedia untuk check permission
                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    const originalGetUserMedia = navigator.mediaDevices.getUserMedia;
                    navigator.mediaDevices.getUserMedia = function(constraints) {
                        if (constraints.video && !window.Android.hasCameraPermission()) {
                            window.Android.requestCameraPermission();
                            return Promise.reject(new DOMException('Permission denied', 'NotAllowedError'));
                        }
                        return originalGetUserMedia.call(navigator.mediaDevices, constraints);
                    };
                }
                
                // Override notification permission
                if ('Notification' in window) {
                    const originalRequestPermission = Notification.requestPermission;
                    Notification.requestPermission = function() {
                        if (!window.Android.hasNotificationPermission()) {
                            window.Android.requestNotificationPermission();
                            return Promise.resolve('denied');
                        }
                        return originalRequestPermission.call(Notification);
                    };
                    
                    Object.defineProperty(Notification, 'permission', {
                        get: function() {
                            return window.Android.hasNotificationPermission() ? 'granted' : 'denied';
                        }
                    });
                }
                
                window.checkStoragePermission = function() {
                    return window.Android.hasStoragePermission();
                };
                
                window.requestStoragePermission = function() {
                    window.Android.requestStoragePermission();
                };
                
                window.goToPermissionsScreen = function() {
                    window.Android.goToPermissionsScreen();
                };
                
                window.signInWithGoogle = function() {
                    window.Android.signInWithGoogle();
                };
            })();
        """.trimIndent()

        webView.evaluateJavascript(script, null)
    }

    private fun checkCameraPermission() {
        val cameraPermission = android.Manifest.permission.CAMERA
        val storagePermission = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            android.Manifest.permission.READ_MEDIA_IMAGES
        } else {
            android.Manifest.permission.READ_EXTERNAL_STORAGE
        }
        
        when {
            ContextCompat.checkSelfPermission(
                this,
                cameraPermission
            ) == PackageManager.PERMISSION_GRANTED &&
            ContextCompat.checkSelfPermission(
                this,
                storagePermission
            ) == PackageManager.PERMISSION_GRANTED -> {
                // Permissions already granted, open camera
                openCamera()
            }
            else -> {
                // Request permissions
                permissionLauncher.launch(arrayOf(cameraPermission, storagePermission))
            }
        }
    }
    
    // Method to check camera permission
    fun hasCameraPermission(): Boolean {
        val cameraPermission = android.Manifest.permission.CAMERA
        return ContextCompat.checkSelfPermission(
            this,
            cameraPermission
        ) == PackageManager.PERMISSION_GRANTED
    }
    
    // Method to check storage permission
    fun hasStoragePermission(): Boolean {
        val storagePermission = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            android.Manifest.permission.READ_MEDIA_IMAGES
        } else {
            android.Manifest.permission.READ_EXTERNAL_STORAGE
        }
        
        return ContextCompat.checkSelfPermission(
            this,
            storagePermission
        ) == PackageManager.PERMISSION_GRANTED
    }
    
    // Method to check notification permission
    fun hasNotificationPermission(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            ContextCompat.checkSelfPermission(
                this,
                android.Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
        } else {
            true // For older Android versions, notifications are enabled by default
        }
    }
    
    // Method to request camera permission (and storage)
    fun requestCameraPermission() {
        val cameraPermission = android.Manifest.permission.CAMERA
        val storagePermission = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            android.Manifest.permission.READ_MEDIA_IMAGES
        } else {
            android.Manifest.permission.READ_EXTERNAL_STORAGE
        }
        val permissionsToRequest = mutableListOf<String>()
        if (ContextCompat.checkSelfPermission(this, cameraPermission) != PackageManager.PERMISSION_GRANTED) {
            permissionsToRequest.add(cameraPermission)
        }
        if (ContextCompat.checkSelfPermission(this, storagePermission) != PackageManager.PERMISSION_GRANTED) {
            permissionsToRequest.add(storagePermission)
        }
        if (permissionsToRequest.isNotEmpty()) {
            permissionLauncher.launch(permissionsToRequest.toTypedArray())
        }
    }
    
    // Method to request storage permission
    fun requestStoragePermission() {
        val storagePermission = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            android.Manifest.permission.READ_MEDIA_IMAGES
        } else {
            android.Manifest.permission.READ_EXTERNAL_STORAGE
        }
        
        if (ContextCompat.checkSelfPermission(
                this,
                storagePermission
            ) != PackageManager.PERMISSION_GRANTED) {
            // Request permissions
            permissionLauncher.launch(arrayOf(storagePermission))
        }
    }
    
    // Method to request notification permission
    fun requestNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(
                    this,
                    android.Manifest.permission.POST_NOTIFICATIONS
                ) != PackageManager.PERMISSION_GRANTED) {
                // Request notification permission
                permissionLauncher.launch(arrayOf(android.Manifest.permission.POST_NOTIFICATIONS))
            }
        }
    }
    
    // Method to get WebAppInterface instance
    private fun getWebAppInterface(): WebAppInterface {
        return WebAppInterface(this)
    }

    // Public method untuk membuka camera (bisa dipanggil dari JavaScript)
    fun openCamera() {
        if (!hasCameraPermission()) {
            requestCameraPermission()
            return
        }
        
        try {
            val photoFile = createImageFile()
            capturedImageUri = FileProvider.getUriForFile(
                this,
                "${packageName}.fileprovider",
                photoFile
            )

            val intent = Intent(MediaStore.ACTION_IMAGE_CAPTURE)
            intent.putExtra(MediaStore.EXTRA_OUTPUT, capturedImageUri)
            cameraLauncher.launch(intent)
        } catch (e: Exception) {
            Toast.makeText(this, "Camera not available: ${e.message}", Toast.LENGTH_SHORT).show()
        }
    }

    // Public method untuk membuka file picker (bisa dipanggil dari JavaScript)
    fun openFilePicker() {
        if (!hasStoragePermission()) {
            requestStoragePermission()
            return
        }
        
        filePickerLauncher.launch("*/*")
    }

    private fun getPathFromUri(uri: Uri): String {
        var path = ""
        try {
            val projection = arrayOf(MediaStore.Images.Media.DATA)
            val cursor = contentResolver.query(uri, projection, null, null, null)
            cursor?.let {
                val columnIndex = it.getColumnIndexOrThrow(MediaStore.Images.Media.DATA)
                it.moveToFirst()
                path = it.getString(columnIndex)
                it.close()
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return path
    }


    
    // Method to handle Google Sign-In using Credential Manager
    fun signInWithGoogle() {
        val googleClientId = getString(R.string.default_web_client_id)
        if (googleClientId.isEmpty()) {
            Log.e("MainActivity", "Google Client ID not found")
            Toast.makeText(this, "Google Sign-In configuration error", Toast.LENGTH_SHORT).show()
            return
        }
        
        val nonce = generateNonce()
        val googleIdOption: GetGoogleIdOption = GetGoogleIdOption.Builder()
            .setServerClientId(googleClientId)
            .setNonce(nonce)
            .setFilterByAuthorizedAccounts(false)
            .build()
            
        val request: GetCredentialRequest = GetCredentialRequest.Builder()
            .addCredentialOption(googleIdOption)
            .build()
            
        lifecycleScope.launch {
            try {
                val result = credentialManager.getCredential(this@MainActivity, request)
                handleSignInResult(result, nonce)
            } catch (e: GetCredentialException) {
                if (e is NoCredentialException) {
                    // No credentials found, try with authorized accounts only
                    val googleIdOptionWithAuth: GetGoogleIdOption = GetGoogleIdOption.Builder()
                        .setServerClientId(googleClientId)
                        .setNonce(nonce)
                        .setFilterByAuthorizedAccounts(true)
                        .build()
                        
                    val requestWithAuth: GetCredentialRequest = GetCredentialRequest.Builder()
                        .addCredentialOption(googleIdOptionWithAuth)
                        .build()
                        
                    try {
                        val resultWithAuth = credentialManager.getCredential(this@MainActivity, requestWithAuth)
                        handleSignInResult(resultWithAuth, nonce)
                    } catch (e2: GetCredentialException) {
                        Log.e("MainActivity", "Failed to get credential with authorized accounts", e2)
                        Toast.makeText(this@MainActivity, "Google Sign-In failed: ${e2.message}", Toast.LENGTH_SHORT).show()
                        sendGoogleAuthErrorToWebView("Failed to get credential: ${e2.message}")
                    }
                } else {
                    Log.e("MainActivity", "Failed to get credential", e)
                    Toast.makeText(this@MainActivity, "Google Sign-In failed: ${e.message}", Toast.LENGTH_SHORT).show()
                    sendGoogleAuthErrorToWebView("Failed to get credential: ${e.message}")
                }
            }
        }
    }
    
    // Generate a nonce for Google Sign-In
    private fun generateNonce(): String {
        val rawNonce = UUID.randomUUID().toString()
        val bytes = rawNonce.toByteArray()
        val md = MessageDigest.getInstance("SHA-256")
        val digest = md.digest(bytes)
        return digest.fold("") { str, it -> str + "%02x".format(it) }
    }
    
    // Handle the sign-in result from Credential Manager
    private fun handleSignInResult(result: GetCredentialResponse, nonce: String) {
        val credential = result.credential
        val googleIdTokenCredential = GoogleIdTokenCredential
            .createFrom(credential.data)
            
        val googleIdToken = googleIdTokenCredential.idToken
        
        // Send the ID token to the WebView for processing
        sendGoogleAuthTokenToWebView(googleIdToken)
        
        // Clear credential state for privacy
        lifecycleScope.launch {
            try {
                credentialManager.clearCredentialState(ClearCredentialStateRequest())
            } catch (e: Exception) {
                Log.e("MainActivity", "Failed to clear credential state", e)
            }
        }
    }
    
    // Send Google Auth token to WebView
    private fun sendGoogleAuthTokenToWebView(token: String) {
        val script = "if (window.handleGoogleAuth) { window.handleGoogleAuth('$token'); }"
        webView.evaluateJavascript(script, null)
    }
    
    // Send Google Auth error to WebView
    private fun sendGoogleAuthErrorToWebView(error: String) {
        val script = "if (window.handleGoogleAuthError) { window.handleGoogleAuthError('$error'); }"
        webView.evaluateJavascript(script, null)
    }
}