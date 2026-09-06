package com.ivy.home

import com.ivy.base.model.TransactionType
import com.ivy.data.model.Category
import com.ivy.data.model.CategoryId
import com.ivy.data.model.IntervalType
import com.ivy.data.model.primitive.NotBlankTrimmedString
import com.ivy.data.model.Transaction
import java.time.DayOfWeek
import java.time.Instant
import java.time.LocalDate
import java.time.YearMonth
import java.time.ZoneOffset
import java.time.temporal.ChronoUnit

object RecurringPatternDetector {

    /** Detect possible recurring commitments from historical transactions.
     *  Deterministic - no AI, no ML, no external services.
     *  Returns candidates that user can confirm or ignore.
     */
    data class DetectionResult(
        val commitment: CommitmentCandidate,
        val confidence: SuggestionConfidence,
        val explanation: String
    )

    /** Represents a suggested commitment based on detected patterns. */
    data class CommitmentCandidate(
        val title: String,
        val amount: Double,
        val transactionType: TransactionType,
        val category: Category?,
        val frequency: IntervalType,
        val intervalN: Int,
        val startDate: Instant,
        val description: String?,
        val signalCount: Int,
        val lastTransactionDate: Instant?
    )

    /** Confidence level for a commitment suggestion. */
    enum class SuggestionConfidence {
        HIGH,      // Strong historical evidence (3+ consistent occurrences)
        MEDIUM,    // Moderate evidence (2-3 occurrences, some variation)
        LOW,       // Weak evidence (2 occurrences or irregular pattern)
        NONE       // Insufficient evidence
    }

    /** Detect recurring patterns from a list of transactions.
     *  @param transactions historical transactions (sorted by date desc recommended)
     *  @return list of detection results, sorted by confidence desc then signal count desc
     */
    suspend fun detectRecurringPatterns(
        transactions: List<Transaction>
    ): List<DetectionResult> {
        val results = mutableListOf<DetectionResult>()

        if (transactions.size < 2) return results

        // Group transactions by normalized description
        val byDescription = groupByNormalizedDescription(transactions)

        // Analyze each group for recurring patterns
        for ((description, group) in byDescription) {
            val analysis = analyzeGroup(group)
            if (analysis.shouldSuggest) {
                results.add(
                    DetectionResult(
                        commitment = CommitmentCandidate(
                            title = analysis.merchantName ?: "Unknown",
                            amount = analysis.typicalAmount,
                            transactionType = analysis.transactionType,
                            category = analysis.dominantCategory,
                            frequency = analysis.detectedFrequency,
                            intervalN = analysis.intervalN,
                            startDate = analysis.firstTransactionDate,
                            description = description,
                            signalCount = analysis.signalCount,
                            lastTransactionDate = analysis.lastTransactionDate
                        ),
                        confidence = analysis.confidence,
                        explanation = analysis.explanation
                    )
                )
            }
        }

        // Also check for same category + similar amount patterns
        val categoryBased = analyzeByCategoryAndAmount(transactions)
        results.addAll(categoryBased)

        // Sort: HIGH confidence first, then by signal count desc
        results.sortWith {
            if (it.confidence.ordinal != it2.confidence.ordinal) {
                it.confidence.ordinal.compareTo(it2.confidence.ordinal)
            } else {
                it2.commitment.signalCount.compareTo(it.commitment.signalCount)
            }
        }

        return results
    }

    /** Group transactions by normalized description for pattern analysis. */
    private suspend fun groupByNormalizedDescription(
        transactions: List<Transaction>
    ): Map<String, List<Transaction>> {
        val groups = mutableMapOf<String, List<Transaction>>()

        for (tx in transactions) {
            val normalized = normalizeDescription(tx.description!!)
            groups.getOrPut(normalized) { listOf(tx) }.apply {
                add(tx)
            }
        }

        return groups
    }

    /** Normalize a transaction description for matching. */
    private fun normalizeDescription(description: String?): String {
        if (description == null) return ""
        return description
            .trim()
            .toLowerCase()
            .replace(Regex("""[^\w\s]"""), "")
            .replace(Regex("\\s+"), " ")
    }

    /** Analyze a group of transactions with the same normalized description. */
    private data class GroupAnalysis(
        val merchantName: String?,
        val transactionType: TransactionType,
        val typicalAmount: Double,
        val dominantCategory: Category?,
        val signalCount: Int,
        val firstTransactionDate: Instant,
        val lastTransactionDate: Instant,
        val dateDifferences: List<Long>,  // differences in days between consecutive transactions
        val confidence: SuggestionConfidence,
        val explanation: String,
        val shouldSuggest: Boolean
    )

    private suspend fun analyzeGroup(
        transactions: List<Transaction>
    ): GroupAnalysis {
        require(transactions.size >= 2)

        // Sort by date ascending
        val sorted = transactions.sortedBy { it.dateTime ?? Instant.EPOCH }

        // Determine transaction type (most common)
        val typeCounts = mutableMapOf<TransactionType, Int>()
        for (tx in sorted) {
            typeCounts[tx.type] = (typeCounts[tx.type] ?: 0) + 1
        }
        val transactionType = typeCounts.entries.maxBy { it.value }?.key ?: TransactionType.EXPENSE

        // Determine dominant category
        val categoryCounts = mutableMapOf<UUID?, Int>()
        for (tx in sorted) {
            categoryCounts[tx.categoryId?.value] = (categoryCounts[tx.categoryId?.value] ?: 0) + 1
        }
        val dominantCategoryId = categoryCounts.entries.maxBy { it.value }?.key
        val dominantCategory = dominantCategoryId?.let {
            // We'll return null; the UI can look up the category
            null
        }

        // Calculate typical amount (median to avoid outliers)
        val amounts = sorted.map { it.amount }
        val typicalAmount = amounts.sorted().getOrDefault(amounts.size / 2, amounts[0])

        // Calculate date differences between consecutive transactions
        val dateDifferences = mutableListOf<Long>()
        var prevDate: Long? = null
        for (tx in sorted) {
            val date = (tx.dateTime?.toEpochMilli() ?: 0L)
            if (prevDate != null) {
                dateDifferences.add(date - prevDate)
            }
            prevDate = date
        }

        // Determine the most common interval
        val intervalCounts = mutableMapOf<Long, Int>()
        for (diff in dateDifferences) {
            intervalCounts[diff] = (intervalCounts[diff] ?: 0) + 1
        }

        val mostCommonDiff = intervalCounts.entries.maxBy { it.value }?.key ?: 0L

        // Detect frequency based on most common difference
        val (frequency, intervalN, detectedFrequency) = determineFrequency(mostCommonDiff, dateDifferences.size)

        // Calculate signal count - number of consistent occurrences
        val signalCount = calculateSignalCount(mostCommonDiff, dateDifferences, intervalCounts)

        // Determine confidence level
        val confidence = determineConfidence(signalCount, intervalCounts.size, dateDifferences.size)

        // Generate explanation
        val explanation = generateExplanation(
            merchantName = transactions.first().description?.take(30) ?: "",
            typicalAmount = typicalAmount,
            frequency = frequency,
            signalCount = signalCount,
            confidence = confidence
        )

        // Determine merchant name from the first transaction
        val merchantName = transactions.first().description
            ?.take(30)
            ?.let { it@ }
            ?: null

        // Should suggest only with sufficient evidence
        val shouldSuggest = signalCount >= 2 && confidence != SuggestionConfidence.NONE

        return GroupAnalysis(
            merchantName = merchantName,
            transactionType = transactionType,
            typicalAmount = typicalAmount,
            dominantCategory = dominantCategory,
            signalCount = signalCount,
            firstTransactionDate = sorted.first().dateTime ?: Instant.EPOCH,
            lastTransactionDate = sorted.last().dateTime ?: Instant.EPOCH,
            dateDifferences = dateDifferences,
            confidence = confidence,
            explanation = explanation,
            shouldSuggest = shouldSuggest
        )
    }

    /** Analyze patterns by category and amount similarity. */
    private suspend fun analyzeByCategoryAndAmount(
        transactions: List<Transaction>
    ): List<DetectionResult> {
        val results = mutableListOf<DetectionResult>()

        // Group by category
        val byCategory = transactions.groupBy { it.categoryId?.value }

        for ((categoryId, group) in byCategory) {
            if (group.size < 2) continue

            // Check if amounts are similar (within 20%)
            val amounts = group.map { it.amount }
            val amountRange = amounts.max() - amounts.min()
            val averageAmount = amounts.average()

            // Check date consistency
            val sorted = group.sortedBy { it.dateTime ?: Instant.EPOCH }
            val dateDiffs = mutableListOf<Long>()
            var prev: Long? = null
            for (tx in sorted) {
                val d = (tx.dateTime?.toEpochMilli() ?: 0L)
                if (prev != null) {
                    dateDiffs.add(d - prev)
                }
                prev = d
            }

            // If we have 3+ transactions with same category and similar amounts + regular intervals
            if (group.size >= 3 && amountRange <= averageAmount * 0.2 && dateDiffs.isNotEmpty()) {
                val mostCommonDiff = dateDiffs.groupBy { it }.maxBy { it.value }.firstKey()
                val (frequency, intervalN, _) = determineFrequency(mostCommonDiff, dateDiffs.size)

                if (frequency != IntervalType.DAY || intervalN >= 7) { // Don't suggest daily unless weekly+
                    val typicalAmount = averageAmount

                    results.add(
                        DetectionResult(
                            commitment = CommitmentCandidate(
                                title = "Recurring payment",
                                amount = typicalAmount,
                                transactionType = TransactionType.EXPENSE,
                                category = CategoryId(categoryId).let {
                                    // Look up category - for now return null, UI handles it
                                    null
                                },
                                frequency = frequency,
                                intervalN = intervalN,
                                startDate = sorted.first().dateTime ?: Instant.EPOCH,
                                description = null,
                                signalCount = group.size,
                                lastTransactionDate = sorted.last().dateTime ?: Instant.EPOCH
                            ),
                            confidence = if (group.size >= 5) SuggestionConfidence.HIGH
                            else if (group.size >= 3) SuggestionConfidence.MEDIUM
                            else SuggestionConfidence.LOW,
                            explanation = "${group.size} transactions in ${categoryId?.take(20) ?: "unknown category"}, similar amounts, about every ${frequency}"
                        )
                    )
                }
            }
        }

        return results
    }

    /** Determine frequency pattern based on date differences. */
    private fun determineFrequency(
        mostCommonDiff: Long,
        transactionCount: Int
    ): (IntervalType, Int, String) {
        // Convert differences to days (approximate)
        val diffInDays = mostCommonDiff / (1000 * 60 * 60 * 24)

        return when {
            diffInDays >= 365 && transactionCount >= 3 -> {
                (IntervalType.YEAR, 1, "Yearly")
            }
            diffInDays >= 180 && transactionCount >= 3 -> {
                (IntervalType.MONTH, 1, "Semi-annual")
            }
            diffInDays >= 90 && transactionCount >= 3 -> {
                (IntervalType.MONTH, 3, "Quarterly")
            }
            diffInDays >= 60 && transactionCount >= 3 -> {
                (IntervalType.MONTH, 2, "Bi-monthly")
            }
            diffInDays >= 31 && transactionCount >= 3 -> {
                (IntervalType.MONTH, 1, "Monthly")
            }
            diffInDays >= 14 && transactionCount >= 3 -> {
                (IntervalType.WEEK, 2, "Every 2 weeks")
            }
            diffInDays >= 7 && transactionCount >= 3 -> {
                (IntervalType.WEEK, 1, "Weekly")
            }
            diffInDays >= 3 && transactionCount >= 3 -> {
                (IntervalType.WEEK, 1, "Weekly")
            }
            else -> (IntervalType.DAY, 1, "Irregular")
        }
    }

    /** Calculate signal count - how many consistent occurrences we have. */
    private fun calculateSignalCount(
        mostCommonDiff: Long,
        dateDifferences: List<Long>,
        intervalCounts: Map<Long, Int>
    ): Int {
        if (dateDifferences.isEmpty()) return 1

        val mostCommonCount = intervalCounts.entries.maxBy { it.value }?.value ?: 1
        // Count how many differences match the most common interval within 20%
        val matching = dateDifferences.count { diff ->
            val mostCommon = mostCommonDiff
            abs(diff - mostCommon) <= mostCommon * 0.2
        }

        return matching
    }

    /** Determine confidence level based on evidence. */
    private fun determineConfidence(
        signalCount: Int,
        totalDifferences: Int,
        totalTransactions: Int
    ): SuggestionConfidence {
        val consistencyRatio = if (totalDifferences > 0) {
            signalCount.toDouble() / totalDifferences
        } else {
            1.0
        }

        return when {
            signalCount >= 5 && consistencyRatio >= 0.8 -> SuggestionConfidence.HIGH
            signalCount >= 3 && consistencyRatio >= 0.5 -> SuggestionConfidence.MEDIUM
            signalCount >= 2 -> SuggestionConfidence.LOW
            else -> SuggestionConfidence.NONE
        }
    }

    /** Generate human-readable explanation for the suggestion. */
    private fun generateExplanation(
        merchantName: String,
        typicalAmount: Double,
        frequency: IntervalType,
        signalCount: Int,
        confidence: SuggestionConfidence
    ): String {
        val freqText = when (frequency) {
            IntervalType.YEAR -> "about once a year"
            IntervalType.MONTH -> "about every month"
            IntervalType.WEEK -> "about every week"
            IntervalType.DAY -> "daily"
            else -> "irregular"
        }

        val signalText = when (confidence) {
            SuggestionConfidence.HIGH -> "strong pattern (3+ consistent occurrences)"
            SuggestionConfidence.MEDIUM -> "moderate pattern (2-3 occurrences)"
            SuggestionConfidence.LOW -> "weak pattern (2 occurrences)"
            else -> "limited evidence"
        }

        return "$merchantName — ₹${typicalAmount.format("%.0f")} $freqText. $signalText"
    }

    /** Create a commitment candidate from a single strong pattern. */
    fun createFromStrongPattern(
        transactions: List<Transaction>,
        typicalAmount: Double,
        typicalType: TransactionType
    ): CommitmentCandidate? {
        if (transactions.size < 3) return null

        val sorted = transactions.sortedBy { it.dateTime ?: Instant.EPOCH }
        val first = sorted.first()
        val last = sorted.last()

        return CommitmentCandidate(
            title = first.description?.take(40) ?: "Recurring payment",
            amount = typicalAmount,
            transactionType = typicalType,
            category = null,
            frequency = IntervalType.MONTH,
            intervalN = 1,
            startDate = first.dateTime ?: Instant.EPOCH,
            description = first.description,
            signalCount = transactions.size,
            lastTransactionDate = last.dateTime ?: Instant.EPOCH
        )
    }
}