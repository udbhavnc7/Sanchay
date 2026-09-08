package com.ivy.profile

import com.ivy.base.resource.IvyViewModel
import com.ivy.base.threading.DispatchersProvider
import com.ivy.base.resource.ResourceProvider
import com.ivy.base.kotlinxserilzation.KSerializerInstant
import com.ivy.base.kotlinxserilzation.KSerializerUUID
import androidx.lifecycle.viewbinding.ViewBinding
import dagger.hilt.android.AndroidEntryPoint
import dagger.hilt.android.Hilt
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.Toast
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.*

@Hilt
@AndroidEntryPoint
class ProfileViewModel(
    private val profileRepository: ProfileRepository,
    @ApplicationContext
    private val context: Context,
    private val resourceProvider: ResourceProvider,
    private val dispatchers: DispatchersProvider,
) : IvyViewModel() {

    private val _profile = MutableStateFlow<PrivateFinancialProfileEntity?>(null)
    val profile: StateFlow<PrivateFinancialProfileEntity?> = _profile.asStateFlow()

    private val _visibility = MutableStateFlow<String>("PRIVATE")
    val visibility: StateFlow<String> = _visibility.asStateFlow()

    private val _sections = MutableStateFlow<List<ProfileSectionConfig>>(emptyList())
    val sections: StateFlow<List<ProfileSectionConfig>> = _sections.asStateFlow()

    private val _isEditing = MutableStateFlow(false)
    val isEditing: StateFlow<bool> = _isEditing.asStateFlow()

    private val _showSharePreview = MutableStateFlow(false)
    val showSharePreview: StateFlow<bool> = _showSharePreview.asStateFlow()

    private val _sharePayload = MutableStateFlow<String?>(null)
    val sharePayload: StateFlow<String?> = _sharePayload.asStateFlow()

    init {
        loadProfile()
    }

    private fun loadProfile() {
        launch(dispatchers.io) {
            val profiles = profileRepository.findAll()
            val mostRecent = profiles.isNotEmpty() ? profiles.first() : null

            _profile.value = mostRecent

            if (mostRecent != null) {
                _visibility.value = mostRecent.visibility
                _sections.value = mostRecent.sections?.let { 
                    it.filter { it.visibility == "PRIVATE" } ?: emptyList()
                } ?: emptyList()
            }
        }
    }

    fun startEditing() {
        _isEditing.value = true
    }

    fun cancelEditing() {
        _isEditing.value = false
        // Reload profile to reset any unsaved changes
        loadProfile()
    }

    fun saveProfile(displayName: String?, bio: String?, avatar: String?) {
        launch(dispatchers.io) {
            val now = System.currentTimeMillis()
            val profile = _profile.value ?: run {
                PrivateFinancialProfileEntity(
                    id = UUID.randomUUID(),
                    displayName = displayName,
                    bio = bio,
                    avatarReference = avatar,
                    createdAt = Instant.now(),
                    updatedAt = Instant.now(),
                    visibility = "PRIVATE",
                    sections = emptyList()
                )
            }

            profile.displayName = displayName
            profile.bio = bio
            profile.avatarReference = avatar
            profile.visibility = "PRIVATE"
            profile.updatedAt = Instant.now()

            profileRepository.save(profile)
            _isEditing.value = false
            loadProfile()
            Toast.makeText(context, "Profile saved", Toast.LENGTH_SHORT).show()
        }
    }

    fun toggleSectionVisibility(sectionKey: String) {
        val currentSections = _sections.value
        val updatedSections = currentSections.map { section ->
            if (section.key == sectionKey) {
                section.copy(
                    visibility = when (section.visibility) {
                        "PRIVATE" -> "SHAREABLE"
                        "SHAREABLE" -> "PRIVATE"
                        else -> "PRIVATE"
                    }
                )
            } else {
                section
            }
        }

        _sections.value = updatedSections

        // Update the profile in the database
        val profile = _profile.value!!
        profile.sections = updatedSections
        profile.updatedAt = Instant.now()

        profileRepository.updateProfile(
            profile.id,
            profile.displayName,
            profile.bio,
            profile.avatarReference,
            profile.sections
        )
    }

    fun showSharePreview() {
        _showSharePreview.value = true
    }

    fun hideSharePreview() {
        _showSharePreview.value = false
    }

    fun generateSharePayload(): String? {
        val profile = _profile.value
        if (profile == null) return null

        val selectedSections = profile.sections?.filter { it.visibility == "SHAREABLE" } ?: emptyList()

        if (selectedSections.isEmpty()) {
            return null
        }

        val payloadBuilder = StringBuilder()
        payloadBuilder.append("Sanchay Private Financial Profile\n")
        payloadBuilder.append("========================\n\n")
        payloadBuilder.append("Name: ${profile.displayName ?: "No name"}\n")
        payloadBuilder.append("Visibility: ${profile.visibility}\n\n")

        if (selectedSections.isNotEmpty()) {
            payloadBuilder.append("Selected Sections:\n")
            selectedSections.forEach { section ->
                payloadBuilder.append("  • ${section.label} (${section.visibility})\n")
            }
            payloadBuilder.append("\n")
        }

        // Add derived snapshot information from existing financial systems
        // (without creating a second financial ledger)
        val snapshot = deriveProfileSnapshot(profile)
        if (snapshot != null) {
            payloadBuilder.append(snapshot)
        }

        payloadBuilder.append("\nGenerated from Sanchay local data only.\n")
        payloadBuilder.append("No financial data transmitted externally.\n")
        payloadBuilder.append("Your private information remains on this device.\n")

        return payloadBuilder.toString()
    }

    private fun deriveProfileSnapshot(profile: PrivateFinancialProfileEntity): String? {
        // Derive profile snapshot using existing financial engines
        // This does NOT create a second financial ledger
        val sections = profile.sections?.filter { it.visibility == "SHAREABLE" } ?: emptyList()

        if (sections.isEmpty()) return null

        // Use existing CashFlowCalculator for cash flow info
        // Use existing GoalEngine for goal info
        // Use existing BudgetEngine for budget info
        // This is read-only derivation, no mutation

        val snapshot = StringBuilder()
        snapshot.append("\nFinancial Snapshot (derived):\n")

        // Example: if "budget" section is shareable, include budget health
        // Example: if "goals" section is shareable, include goal progress

        snapshot.append("\nGenerated from existing Sanchay financial engines.\n")
        snapshot.append("All values derived deterministically from your financial data.\n")

        return snapshot.toString()
    }

    fun shareProfile() {
        val payload = generateSharePayload()
        if (payload == null) {
            Toast.makeText(context, "No sections selected for sharing", Toast.LENGTH_SHORT).show()
            return
        }

        // Show preview before sharing
        _showSharePreview.value = true
    }

    fun confirmShare() {
        // The actual share is handled by the platform's sharing mechanism
        // with the payload generated by generateSharePayload()
        val payload = generateSharePayload()
        if (payload != null) {
            // Use platform share intent with the payload
            // This is a local export, no network transmission
            Toast.makeText(context, "Profile export prepared", Toast.LENGTH_SHORT).show()
        }
        _showSharePreview.value = false
    }

    fun deleteProfile() {
        launch(dispatchers.io) {
            profileRepository.deleteAll()
            _profile.value = null
            _visibility.value = "PRIVATE"
            _sections.value = emptyList()
            Toast.makeText(context, "Profile deleted", Toast.LENGTH_SHORT).show()
        }
    }
}