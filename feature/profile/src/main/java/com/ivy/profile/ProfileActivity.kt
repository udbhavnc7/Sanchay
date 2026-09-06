package com.ivy.profile

import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import dagger.hilt.android.AndroidEntryPoint
import dagger.hilt.android.Hilt
import com.ivy.base.resource.IvyViewModel
import com.ivy.base.threading.DispatchersProvider
import kotlinx.android.synthetic.main.activity_profile.*
import kotlinx.coroutines.launch

@Hilt
@AndroidEntryPoint
class ProfileActivity : AppCompatActivity() {

    private var viewModel: ProfileViewModel? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_profile)

        viewModel = ProfileViewModel(
            profileRepository = ProfileRepository(
                privateFinancialProfileDao = /* PrivateFinancialProfileDao */,
                writePrivateFinancialProfileDao = /* WritePrivateFinancialProfileDao */
            ),
            context = this,
            resourceProvider = /* ResourceProvider */,
            dispatchers = /* DispatchersProvider */
        )

        setupProfile()
        observeViewModel()
        setupListeners()
    }

    private fun setupProfile() {
        // Load and display profile info
        val profile = viewModel?.profile.value

        findViewById<TextView>(R.id.profileName).text =
            profile?.displayName ?: "No Profile"

        val bioText = profile?.bio ?: "Start your financial profile"
        findViewById<TextView>(R.id.profileBio).text = bioText

        // Set up section visibility toggles
        setupSectionToggles(profile)
    }

    private fun setupSectionToggles(profile: PrivateFinancialProfileEntity?) {
        val sections = profile?.sections ?: emptyList()

        // Set up each section's visibility
        sections.forEach { section ->
            // Find the corresponding toggle view
            val toggleBtn = findViewById<Button>(getSectionToggleId(section.key))
            toggleBtn.text = when (section.visibility) {
                "PRIVATE" -> "Private"
                "SHAREABLE" -> "Shareable"
                else -> "Private"
            }
        }
    }

    private fun getSectionToggleId(sectionKey: String): Int {
        // Map section key to UI toggle ID
        return when (sectionKey) {
            "financialSnapshot" -> R.id.financialSnapshotToggle
            "goals" -> R.id.goalsToggle
            "budget" -> R.id.budgetToggle
            "commitments" -> R.id.commitmentsToggle
            "habits" -> R.id.habitsToggle
            else -> R.id.generalToggle
        }
    }

    private fun observeViewModel() {
        viewModel?.profile.collect { profile ->
            if (profile != null) {
                // Update UI with profile data
                findViewById<TextView>(R.id.profileName).text = profile.displayName
                findViewById<TextView>(R.id.profileBio).text = profile.bio ?: ""
            }
        }

        viewModel?.visibility.collect { visibility ->
            // Update visibility display
            findViewById<TextView>(R.id.visibilityDisplay).text = visibility
        }

        viewModel?.sections.collect { sections ->
            // Update section visibility UIs
            sections.forEach { section ->
                val toggleBtn = findViewById<Button>(getSectionToggleId(section.key))
                toggleBtn.text = when (section.visibility) {
                    "PRIVATE" -> "Private"
                    "SHAREABLE" -> "Shareable"
                    else -> "Private"
                }
            }
        }
    }

    private fun setupListeners() {
        findViewById<Button>(R.id.editBtn).setOnClickListener {
            viewModel?.startEditing()
        }

        findViewById<Button>(R.id.saveBtn).setOnClickListener {
            val nameEt = findViewById<androidx.appcompat.widget.AppCompatEditText>(R.id.profileNameEt)
            val bioEt = findViewById<androidx.appcompat.widget.AppCompatEditText>(R.id.profileBioEt)
            viewModel?.saveProfile(nameEt.text.toString(), bioEt.text.toString(), null)
        }

        findViewById<Button>(R.id.shareBtn).setOnClickListener {
            viewModel?.shareProfile()
        }

        findViewById<Button>(R.id.cancelBtn).setOnClickListener {
            viewModel?.cancelEditing()
        }

        findViewById<Button>(R.id.deleteBtn).setOnClickListener {
            viewModel?.deleteProfile()
        }

        findViewById<Button>(R.id.sharePreviewConfirmBtn).setOnClickListener {
            viewModel?.confirmShare()
        }

        findViewById<Button>(R.id.sharePreviewCancelBtn).setOnClickListener {
            viewModel?.hideSharePreview()
        }
    }
}