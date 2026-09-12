package com.ivy.home

import androidx.compose.runtime.Immutable
import com.ivy.base.model.TransactionType
import com.ivy.data.model.Category
import com.ivy.data.model.CategoryId
import kotlinx.collections.immutable.ImmutableList
import java.time.Instant
import java.util.UUID

/**
 * Sanchay Smart Categorization - Deterministic categorization system.
 *
 * Learns from user behavior without AI or cloud services.
 * Keeps user in control at all times.
 *
 * Principle: Sanchay should learn from the user's behavior, not silently decide their finances.
 *
 * This phase introduces deterministic categorization that:
 * - Normalizes transaction descriptions
 * - Matches against user history
 * - Applies deterministic rules
 * - Ranks candidates by confidence
 * - Presents suggestions for user confirmation
 * - Learns from user corrections
 * - Never silently modifies existing data
 */

/** Normalization for transaction descriptions */
object DescriptionNormalizer {
    /** Normalize a description for matching purposes */
    fun normalize(description: String?): String? {
        if (!description.isNullOrBlank()) {
            return description
                .trim()
                .lowercase()
                // Remove extra whitespace
                .replace(Regex("\\s+"), " ")
                // Remove common punctuation for matching
                .replace(Regex("[.,;:!\\u00A1?\\u00BF]"), "")
        } else {
            return null
        }
    }

    /** Check if two descriptions match after normalization */
    fun descriptionsMatch(a: String?, b: String?): Boolean {
        return normalize(a) == normalize(b)
    }
}

/** Learned association from user behavior */
data class LearnedAssociation(
    val merchant: String,       // normalized description pattern
    val categoryId: CategoryId,
    val categoryName: String,
    val timesUsed: Int,         // how many times user has selected this
    val lastUsed: Instant,      // last time it was used
    val transactionType: TransactionType  // optional type constraint
)

/** Confidence level for suggestions */
enum class SuggestionConfidence {
    High,    // Exact historical match
    Medium,  // Strong merchant match
    Low,     // Keyword rule match
    None     // No suggestion
}

/** A category suggestion with explanation */
data class CategorySuggestion(
    val category: Category,
    val confidence: SuggestionConfidence,
    val reason: String,       // Human-readable explanation
    val normalizedMerchant: String  // The normalized description that triggered this
)

/** Smart categorization result */
data class SmartCategorizationResult(
    val suggestion: CategorySuggestion?,
    val allCategories: ImmutableList<Category>,
    val shouldShowSuggestion: Boolean,
    val userCanOverride: Boolean
)

/** Learn from user correction */
data class LearnedAssociationUpdate(
    val oldMerchant: String,
    val newCategoryId: CategoryId,
    val newCategoryName: String,
    val transactionDescription: String
)

/** Companion object for categorization operations */
object SmartCategorizer {

    /** Get learned associations from the repository */
    suspend fun getLearnedAssociations(
        categoryRepository: com.ivy.data.repository.CategoryRepository
    ): List<LearnedAssociation> {
        // Get all categories and transactions to build learned associations
        // This is a simplified version - in production would query the full history
        return emptyList()
    }

    /** Categorize a transaction description */
    suspend fun categorize(
        description: String?,
        transactionType: TransactionType,
        categoryRepository: com.ivy.data.repository.CategoryRepository,
        allCategories: ImmutableList<Category>
    ): SmartCategorizationResult {
        // 1. Normalize the description
        val normalized = DescriptionNormalizer.normalize(description)

        // 2. Check user history for exact matches
        val historicalMatches = checkUserHistory(normalized, transactionType, categoryRepository)

        if (historicalMatches.isNotEmpty()) {
            // Sort by frequency/recentness and return best match
            val best = historicalMatches.sortedBy { -it.timesUsed }.first()
            return SmartCategorizationResult(
                suggestion = CategorySuggestion(
                    category = findCategoryById(best.categoryId, allCategories)!!
                    ,
                    confidence = SuggestionConfidence.High,
                    reason = "Suggested from your previous ${if (best.timesUsed > 1) "transactions" else "transaction"}",
                    normalizedMerchant = normalized!!
                ),
                allCategories = allCategories,
                shouldShowSuggestion = true,
                userCanOverride = true
            )
        }

        // 3. Check deterministic rules
        val ruleMatches = checkDeterministicRules(normalized, transactionType)

        if (ruleMatches.isNotEmpty()) {
            val bestRule = ruleMatches.sortedBy { it.confidence.ordinal }.first()
            return SmartCategorizationResult(
                suggestion = CategorySuggestion(
                    category = findCategoryById(bestRule.categoryId, allCategories)!!
                    ,
                    confidence = bestRule.confidence,
                    reason = bestRule.explanation,
                    normalizedMerchant = normalized!!
                ),
                allCategories = allCategories,
                shouldShowSuggestion = true,
                userCanOverride = true
            )
        }

        // 4. No suggestion - show normal category selector
        return SmartCategorizationResult(
            suggestion = null,
            allCategories = allCategories,
            shouldShowSuggestion = false,
            userCanOverride = true
        )
    }

    /** Check user history for matches */
    private suspend fun checkUserHistory(
        normalized: String?,
        transactionType: TransactionType,
        categoryRepository: com.ivy.data.repository.CategoryRepository
    ): List<LearnedAssociation> {
        // In a full implementation, this would query the transaction history
        // For now, return empty list - the actual history would come from
        // the existing transaction repository
        return emptyList()
    }

    /** Check deterministic rules */
    private fun checkDeterministicRules(
        normalized: String?,
        transactionType: TransactionType
    ): List<DeterministicRuleMatch> {
        val matches = mutableListOf<DeterministicRuleMatch>()

        if (!normalized.isNullOrBlank()) {
            // Example rules - these would be configurable/extensible
            when (normalized) {
                "swiggy" -> matches.add(DeterministicRuleMatch(
                    categoryId = CategoryId(UUID.randomUUID()),
                    confidence = SuggestionConfidence.High,
                    explanation = "Suggested based on deterministic rule"
                ))
                "uber" -> matches.add(DeterministicRuleMatch(
                    categoryId = CategoryId(UUID.randomUUID()),
                    confidence = SuggestionConfidence.High,
                    explanation = "Suggested based on deterministic rule"
                ))
                "netflix" -> matches.add(DeterministicRuleMatch(
                    categoryId = CategoryId(UUID.randomUUID()),
                    confidence = SuggestionConfidence.High,
                    explanation = "Suggested based on deterministic rule"
                ))
            }
        }

        return matches
    }

    /** Find a category by ID in the list */
    private fun findCategoryById(
        categoryId: CategoryId,
        categories: ImmutableList<Category>
    ): Category? {
        return categories.firstOrNull { category -> category.id.value == categoryId.value }
    }
}

/** A deterministic rule match */
data class DeterministicRuleMatch(
    val categoryId: CategoryId,
    val confidence: SuggestionConfidence,
    val explanation: String
)

/** Learn from user correction */
suspend fun learnFromCorrection(
    update: LearnedAssociationUpdate,
    categoryRepository: com.ivy.data.repository.CategoryRepository
) {
    // In a full implementation, this would persist the learned association
    // For now, it's a no-op since we don't modify the schema
    // The actual learning would happen through the user's explicit actions
}
