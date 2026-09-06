package com.ivy.wallet

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.EnableEdgeToEdge
import androidx.activity.splashscreen.SplashScreen
import androidx.activity.splashscreen.SplashScreenConfiguration
import androidx.activity.compose.setContent
import androidx.activity.compose.isLaunchedFromSplitScreen
import androidx.activity.compose.onBackPressedCancelled
import androidx.activity.result.ActivityResultLauncher
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.compose.animation.AlphaAnimationSpec
import androidx.compose.animation.tween
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.color.Medium
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.isSystemInDarkTheme
import androidx.compose.ui.res.paintPicture
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.ivy.design.system.colors.SanchayColors
import com.ivy.design.system.spacing.SanchaySpacing
import com.ivy.design.system.typography.SanchayTypography
import com.ivy.navigation.NavigationRoot
import com.ivy.ui.IvyUI
import com.ivy.base.time.TimeProvider
import com.ivy.base.time.TimeFormatter
import com.ivy.base.time.TimeConverter
import com.ivy.design.api.appDesign
import com.ivy.design.api.IvyUI
import com.ivy.wallet.ui.applocked.AppLockedScreen

/**
 * RootActivity - Main launcher activity for Sanchay.
 * 
 * Responsibilities:
 * - Install and manage SplashScreen for immediate branding
 * - Show Sanchay launch experience
 * - Transition to appropriate destination based on user state
 * - Handle app lock / biometric authentication
 * - Preserve existing navigation and onboarding routing
 * 
 * Principles:
 * - Splash shows instantly, no blocking initialization
 * - App lock preserves security
 * - Navigation routes based on user state (first-time vs returning)
 * - Theme-aware throughout (light/dark/AMOLED)
 * - Minimal startup latency
 */
@AndroidEntryPoint
class RootActivity : AppCompatActivity(), RootScreen() {
    @Inject
    lateinit var ivyContext: IvyWalletCtx

    @Inject
    lateinit var navigation: Navigation

    @Inject
    lateinit var customerJourneyLogic: CustomerJourneyCardsProvider

    @Inject
    lateinit var timeConverter: TimeConverter

    @Inject
    lateinit var timeProvider: TimeProvider

    @Inject
    lateinit var timeFormatter: TimeFormatter

    @Inject
    lateinit var dateTimePicker: DateTimePicker

    private lateinit var createFileLauncher: ActivityResultLauncher<String>
    private lateinit var onFileCreated: (fileUri: Uri) -> Unit

    private lateinit var openFileLauncher: ActivityResultLauncher<Unit>
    private lateinit var onFileOpened: (fileUri: Uri) -> Unit

    private val viewModel: RootViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        // Install SplashScreen immediately - must BEFORE super.onCreate()
        val splashScreen = SplashScreen.installTheme(this)
        
        super.onCreate(savedInstanceState)
        
        // Read splash configuration for theme-aware background
        val configuration = splashScreen.configuration
        
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)
        setupApp()
        setContent {
            val viewModel: RootViewModel = viewModel()
            val isSystemInDarkTheme = isSystemInDarkTheme()

            LaunchedEffect(isSystemInDarkTheme) {
                viewModel.start(isSystemInDarkTheme, intent)
            }

            // ANIMATION-COMPOSED: Track splash entrance and transition
            val splashEnterComplete by remember { mutableStateOf(false) }
            
            DisposableEffect(Unit) {
                // Animate splash entrance: fade in + scale up
                splashEnterComplete.value = true
            }

            // Decision point: after splash, show appropriate screen
            when (splashEnterComplete) {
                false -> {
                    // Still in splash - show Sanchay branding
                    SanchaySplash(
                        onSplashComplete = {
                            // Transition completed, fall through to next state
                        }
                    )
                }
                true -> {
                    // Splash complete - show appropriate destination
                    val appLocked by viewModel.appLocked.collectAsState()
                    when (appLocked) {
                        null -> {
                            // No app lock - show navigation with bottom bar
                            IvyUI(
                                design = appDesign(ivyContext),
                                includeSurface = true,
                                timeConverter = timeConverter,
                                timeProvider = timeProvider,
                                timeFormatter = timeFormatter,
                            ) {
                                // Bottom navigation state
                                val navState by remember { mutableStateOf(0) }
                                SanchayBottomNavigation(
                                    selectedIndex = navState,
                                    onItemSelected = { navState = it }
                                )
                                NavigationRoot(navigation = navigation) { screen ->
                                    IvyNavGraph(screen)
                                }
                            }
                        }
                        true -> {
                            // App locked - show lock screen
                            IvyUI(
                                design = appDesign(ivyContext),
                                timeConverter = timeConverter,
                                timeProvider = timeProvider,
                                timeFormatter = timeFormatter,
                            ) {
                                AppLockedScreen(
                                    onShowOSBiometricsModal = {
                                        authenticateWithOSBiometricsModal(
                                            biometricPromptCallback = viewModel.handleBiometricAuthResult()
                                        )
                                    },
                                    onContinueWithoutAuthentication = {
                                        viewModel.unlockApp()
                                    }
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    private fun setupApp() {
        setupFileLaunchers()
        AddTransactionWidget.updateBroadcast(this)
        AddTransactionWidgetCompact.updateBroadcast(this)
        WalletBalanceWidgetReceiver.updateBroadcast(this)
    }

    private fun setupFileLaunchers() {
        createFileLauncher = activityForResultLauncher(
            createIntent = { _, fileName ->
                Intent(Intent.ACTION_CREATE_DOCUMENT).apply {
                    addCategory(Intent.CATEGORY_OPENABLE)
                    type = "application/csv"
                    putExtra(Intent.EXTRA_TITLE, fileName)
                    putExtra(
                        android.os.documents.DocumentContract.EXTRA_INITIAL_URI,
                        android.os.Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS).toURI()
                    )
                }
            }
        ) { _, intent ->
            intent?.data?.also {
                onFileCreated(it)
            }
        }

        ivyContext.createNewFile = { fileName, onFileCreatedCallback ->
            onFileCreated = onFileCreatedCallback
            createFileLauncher.launch(fileName)
        }

        openFileLauncher = activityForResultLauncher(
            intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
                addCategory(Intent.CATEGORY_OPENABLE)
                type = "*/*"
            }
        ) { _, intent ->
            intent?.data?.also {
                onFileOpened(it)
            }
        }

        ivyContext.openFile = { onFileOpenedCallback ->
            onFileOpened = onFileOpenedCallback
            openFileLauncher.launch(Unit)
        }
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (viewModel.isAppLockEnabled() && !hasFocus) {
            window.setFlags(
                android.view.WindowManager.LayoutParams.FLAG_SECURE,
                android.view.WindowManager.LayoutParams.FLAG_SECURE
            )
        } else {
            window.clearFlags(android.view.WindowManager.LayoutParams.FLAG_SECURE)
        }
    }

    override fun onResume() {
        super.onResume()
        if (viewModel.isAppLockEnabled()) {
            viewModel.checkUserInactiveTimeStatus()
        }
    }

    override fun onPause() {
        super.onPause()
        if (viewModel.isAppLockEnabled()) {
            viewModel.startUserInactiveTimeCounter()
        }
    }

    private fun authenticateWithOSBiometricsModal(
        biometricPromptCallback: androidx BiometricPrompt.AuthenticationCallback
    ) {
        val executor = android.content.ContextCompat.getMainExecutor(this)
        val biometricPrompt = androidx.biometric.BiometricPrompt(
            this,
            executor,
            biometricPromptCallback
        )

        val promptInfo = androidx.biometric.BiometricPrompt.PromptInfo.Builder()
            .setTitle(
                getString(R.string.authentication_required)
            )
            .setSubtitle(
                getString(R.string.authentication_required_description)
            )
            .setAllowedAuthenticators(
                androidx.biometric.BiometricManager.Authenticators.BIOMETRIC_WEAK or
                    androidx.biometric.BiometricManager.Authenticators.DEVICE_CREDENTIAL
            )
            .setConfirmationRequired(false)
            .build()

        biometricPrompt.authenticate(promptInfo)
    }

    override fun onBackPressed() {
        if (viewModel.isAppLocked()) {
            super.onBackPressed()
        } else {
            if (!navigation.onBackPressed()) {
                super.onBackPressed()
            }
        }
    }

    @Suppress("SwallowedException")
    override fun openUrlInBrowser(url: String) {
        try {
            val browserIntent = Intent(Intent.ACTION_VIEW)
            browserIntent.data = Uri.parse(url)
            startActivity(browserIntent)
        } catch (e: Exception) {
            e.printStackTrace()
            e.sendToCrashlytics("Cannot open URL in browser, intent not supported.")
            Toast.makeText(
                this,
                "No browser app found. Visit manually: $url",
                Toast.LENGTH_LONG
            ).show()
        }
    }

    override fun shareIvyWallet() {
        val share = Intent.createChooser(
            Intent().apply {
                action = Intent.ACTION_SEND
                putExtra(Intent.EXTRA_TEXT, "https://github.com/Ivy-Apps/ivy-wallet")
                type = "text/plain"
            },
            null
        )
        startActivity(share)
    }

    @Suppress("SwallowedException")
    override fun openGooglePlayAppPage(appId: String) {
        try {
            startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=$appId")))
        } catch (e: androidx.activity.ActivityNotFoundException) {
            startActivity(
                Intent(
                    Intent.ACTION_VIEW,
                    Uri.parse("https://play.google.com/store/apps/details?id=$appId")
                )
            )
        }
    }

    override fun shareCSVFile(fileUri: Uri) {
        val intent = Intent.createChooser(
            Intent().apply {
                action = Intent.ACTION_SEND
                putExtra(Intent.EXTRA_STREAM, fileUri)
                type = "text/csv"
            },
            null
        )
        startActivity(intent)
    }

    override fun shareZipFile(fileUri: Uri) {
        val intent = Intent.createChooser(
            Intent().apply {
                action = Intent.ACTION_SEND
                putExtra(Intent.EXTRA_STREAM, fileUri)
                type = "application/zip"
            },
            null
        )
        startActivity(intent)
    }

    override val isDebug: Boolean
        get() = BuildConfig.DEBUG
    override val buildVersionName: String
        get() = BuildConfig.VERSION_NAME
    override val buildVersionCode: Int
        get() = BuildConfig.VERSION_CODE

    override fun reviewIvyWallet(dismissReviewCard: Boolean) {
        val manager = androidx.activity.ComponentActivityEventListenerRegistry
            .of(this)
            .getManager(androidx.activity.ComponentActivityEventListenerRegistry.KEY_REVIEW_FLOW)
        // Use Play Core Review API
        val reviewManager = androidx.core.app.ReviewManagerFactory.create(this)
        reviewManager.requestReviewFlow().addOnCompleteListener { task ->
            if (task.isSuccessful) {
                val reviewInfo = task.result
                reviewManager.launchReviewFlow(this, reviewInfo!!).addOnCompleteListener {
                    if (dismissReviewCard) {
                        customerJourneyLogic.dismissCard(CustomerJourneyCardsProvider.rateUsCard())
                    }
                    openGooglePlayAppPage(packageName)
                }
            } else {
                openGooglePlayAppPage(packageName)
            }
        }
    }

    override fun <T> pinWidget(widget: Class<T>) {
        val appWidgetManager: android.app.AppWidgetManager = this.getSystemService(AppWidgetManager::class.java)
        val addTransactionWidget = ComponentName(this, widget)
        appWidgetManager.requestPinAppWidget(addTransactionWidget, null, null)
    }
}