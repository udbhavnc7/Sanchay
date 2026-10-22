package com.ivy.wallet.ui

import android.annotation.SuppressLint
import android.graphics.Bitmap
import android.view.ViewGroup
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun SanchayModernUI(
    modifier: Modifier = Modifier
) {
    var webViewRef by remember { mutableStateOf<WebView?>(null) }
    var canGoBack by remember { mutableStateOf(false) }

    BackHandler(enabled = canGoBack) {
        webViewRef?.let { wv ->
            if (wv.canGoBack()) {
                wv.goBack()
            }
        }
    }

    AndroidView(
        modifier = modifier.fillMaxSize(),
        factory = { context ->
            WebView(context).apply {
                layoutParams = ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                )

                // High-performance hardware acceleration
                setLayerType(android.view.View.LAYER_TYPE_HARDWARE, null)

                // Rich dark background matching Sanchay palette
                setBackgroundColor(0xFF07090E.toInt())

                isVerticalScrollBarEnabled = false
                isHorizontalScrollBarEnabled = false

                settings.apply {
                    javaScriptEnabled = true
                    domStorageEnabled = true
                    databaseEnabled = true
                    allowFileAccess = true
                    allowContentAccess = true
                    allowFileAccessFromFileURLs = true
                    allowUniversalAccessFromFileURLs = true
                    loadWithOverviewMode = false
                    useWideViewPort = false
                    textZoom = 100
                    builtInZoomControls = false
                    displayZoomControls = false
                    setSupportZoom(false)
                    mediaPlaybackRequiresUserGesture = false
                    cacheMode = WebSettings.LOAD_DEFAULT
                    mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
                }

                webViewClient = object : WebViewClient() {
                    override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                        super.onPageStarted(view, url, favicon)
                        canGoBack = view?.canGoBack() == true
                    }

                    override fun onPageFinished(view: WebView?, url: String?) {
                        super.onPageFinished(view, url)
                        canGoBack = view?.canGoBack() == true
                    }

                    override fun shouldInterceptRequest(
                        view: WebView?,
                        request: WebResourceRequest?
                    ): WebResourceResponse? {
                        val url = request?.url ?: return null
                        val host = url.host ?: ""
                        if (host == "sanchay.local") {
                            val path = url.path?.removePrefix("/") ?: ""
                            val assetPath = "web/" + if (path.isEmpty() || path == "/") "index.html" else path
                            return try {
                                val stream = context.assets.open(assetPath)
                                val mimeType = when {
                                    assetPath.endsWith(".html") -> "text/html"
                                    assetPath.endsWith(".js") -> "application/javascript"
                                    assetPath.endsWith(".css") -> "text/css"
                                    assetPath.endsWith(".png") -> "image/png"
                                    assetPath.endsWith(".jpg") || assetPath.endsWith(".jpeg") -> "image/jpeg"
                                    assetPath.endsWith(".svg") -> "image/svg+xml"
                                    assetPath.endsWith(".webp") -> "image/webp"
                                    assetPath.endsWith(".woff2") -> "font/woff2"
                                    assetPath.endsWith(".woff") -> "font/woff"
                                    assetPath.endsWith(".ttf") -> "font/ttf"
                                    assetPath.endsWith(".json") -> "application/json"
                                    else -> "application/octet-stream"
                                }
                                val response = WebResourceResponse(mimeType, "UTF-8", stream)
                                // Add CORS headers for modules
                                response.responseHeaders = mapOf(
                                    "Access-Control-Allow-Origin" to "*",
                                    "Access-Control-Allow-Methods" to "GET, OPTIONS",
                                    "Access-Control-Allow-Headers" to "*"
                                )
                                response
                            } catch (e: Exception) {
                                null
                            }
                        }
                        return super.shouldInterceptRequest(view, request)
                    }
                }

                // Load local assets via standard HTTPS domain handled by interceptor
                loadUrl("https://sanchay.local/index.html")
                webViewRef = this
            }
        },
        update = { webView ->
            webViewRef = webView
        }
    )
}
