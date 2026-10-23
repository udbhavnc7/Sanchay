package com.ivy.wallet.ui

import android.content.ContentValues
import android.content.Context
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import android.webkit.JavascriptInterface
import androidx.annotation.RequiresApi
import androidx.core.content.ContextCompat
import java.io.File

internal class SanchayFileBridge(private val context: Context) {
    @JavascriptInterface
    fun saveFile(fileName: String, mimeType: String, content: String): String? {
        if (content.length > MAX_CONTENT_CHARS) return null

        val safeName = sanitizeFileName(fileName)
        val safeMimeType = sanitizeMimeType(mimeType)
        val bytes = content.toByteArray(Charsets.UTF_8)

        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            saveWithMediaStore(safeName, safeMimeType, bytes)
        } else {
            saveToLegacyDownloads(safeName, bytes)
        }
    }

    @RequiresApi(Build.VERSION_CODES.Q)
    private fun saveWithMediaStore(fileName: String, mimeType: String, bytes: ByteArray): String? {
        val resolver = context.contentResolver
        val values = ContentValues().apply {
            put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
            put(MediaStore.MediaColumns.MIME_TYPE, mimeType)
            put(
                MediaStore.MediaColumns.RELATIVE_PATH,
                "${Environment.DIRECTORY_DOWNLOADS}${File.separator}Sanchay"
            )
            put(MediaStore.MediaColumns.IS_PENDING, 1)
        }

        var uri: Uri? = null
        return try {
            uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values) ?: return null
            val stream = resolver.openOutputStream(uri)
                ?: throw IllegalStateException("Could not open backup destination")
            stream.use { it.write(bytes) }

            values.clear()
            values.put(MediaStore.MediaColumns.IS_PENDING, 0)
            resolver.update(uri, values, null, null)
            "${Environment.DIRECTORY_DOWNLOADS}/Sanchay/$fileName"
        } catch (error: Exception) {
            uri?.let { resolver.delete(it, null, null) }
            null
        }
    }

    private fun saveToLegacyDownloads(fileName: String, bytes: ByteArray): String? {
        val hasLegacyPermission = ContextCompat.checkSelfPermission(
            context,
            android.Manifest.permission.WRITE_EXTERNAL_STORAGE
        ) == PackageManager.PERMISSION_GRANTED

        if (hasLegacyPermission) {
            try {
                val folder = File(
                    Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS),
                    "Sanchay"
                )
                if (folder.exists() || folder.mkdirs()) {
                    File(folder, fileName).writeBytes(bytes)
                    return "${Environment.DIRECTORY_DOWNLOADS}/Sanchay/$fileName"
                }
            } catch (_: Exception) {
                // Fall through to app-scoped storage.
            }
        }

        return try {
            val downloads = context.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS)
                ?: return null
            val folder = File(downloads, "Sanchay")
            if (!folder.exists() && !folder.mkdirs()) return null
            File(folder, fileName).writeBytes(bytes)
            "app storage/Sanchay/$fileName"
        } catch (_: Exception) {
            null
        }
    }

    private fun sanitizeFileName(rawName: String): String {
        val baseName = rawName
            .substringAfterLast('/')
            .substringAfterLast('\\')
            .trim()
        val cleaned = baseName
            .replace(Regex("[^A-Za-z0-9._-]"), "_")
            .trimStart('.')
            .take(96)

        val withFallback = cleaned.ifBlank { "sanchay-export" }
        return if (withFallback.contains('.')) withFallback else "$withFallback.txt"
    }

    private fun sanitizeMimeType(rawMimeType: String): String {
        val mimeType = rawMimeType.trim().lowercase()
        return if (MIME_PATTERN.matches(mimeType)) mimeType else "application/octet-stream"
    }

    private companion object {
        const val MAX_CONTENT_CHARS = 20 * 1024 * 1024
        val MIME_PATTERN = Regex("[a-z0-9.+-]+/[a-z0-9.+-]+")
    }
}
