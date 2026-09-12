package com.ivy.home

import com.ivy.base.legacy.Transaction
import com.ivy.base.model.TransactionType
import com.ivy.data.model.Category
import com.ivy.data.model.CategoryId
import com.ivy.data.model.IntervalType
import java.time.Instant
import java.util.UUID
import kotlin.math.abs

object RecurringPatternDetector {

    data class DetectionResult(
        val commitment: CommitmentCandidate,
        val confidence: SuggestionConfidence,
        val explanation: String
    )

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

    enum class SuggestionConfidence {
        HIGH,
        MEDIUM,
        LOW,
        NONE
    }

    suspend fun detectRecurringPatterns(
        transactions: List<Transaction>
    ): List<DetectionResult> {
        val results = mutableListOf<DetectionResult>()
        if (transactions.size < 2) return results

        val byDescription = groupByNormalizedDescription(transactions)

        for ((description, group) in byDescription) {
            val analysis = analyzeGroup(group)
            if (analysis.shouldSuggest) {
                results.add(
                    DetectionResult(
                        commitment = CommitmentCandidate(
                            title = analysis.merchantName ?: "Unknown",
                            amount = analysis.typicalAmount,
                            transactionType = analysis.transactionType,
                            category = null,
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

        val categoryBased = analyzeByCategoryAndAmount(transactions)
        results.addAll(categoryBased)

        results.sortWith { a, b ->
            if (a.confidence.ordinal != b.confidence.ordinal) {
                a.confidence.ordinal.compareTo(b.confidence.ordinal)
            } else {
                b.commitment.signalCount.compareTo(a.commitment.signalCount)
            }
        }

        return results
    }

    private fun groupByNormalizedDescription(
        transactions: List<Transaction>
    ): Map<String, List<Transaction>> {
        val groups = mutableMapOf<String, MutableList<Transaction>>()
        for (tx in transactions) {
            val normalized = normalizeDescription(tx.description)
            groups.getOrPut(normalized) { mutableListOf() }.add(tx)
        }
        return groups
    }

    private fun normalizeDescription(description: String?): String {
        if (description == null) return ""
        return description
            .trim()
            .lowercase()
            .replace(Regex("""[^\w\s]"""), "")
            .replace(Regex("\\s+"), " ")
    }

    private data class GroupAnalysis(
        val merchantName: String?,
        val transactionType: TransactionType,
        val typicalAmount: Double,
        val dominantCategory: Category?,
        val signalCount: Int,
        val firstTransactionDate: Instant,
        val lastTransactionDate: Instant,
        val dateDifferences: List<Long>,
        val confidence: SuggestionConfidence,
        val explanation: String,
        val shouldSuggest: Boolean,
        val detectedFrequency: IntervalType,
        val intervalN: Int
    )

    private fun analyzeGroup(
        transactions: List<Transaction>
    ): GroupAnalysis {
        require(transactions.size >= 2)

        val sorted = transactions.sortedBy { it.dateTime ?: Instant.EPOCH }

        val typeCounts = mutableMapOf<TransactionType, Int>()
        for (tx in sorted) {
            typeCounts[tx.type] = (typeCounts[tx.type] ?: 0) + 1
        }
        val transactionType = typeCounts.entries.maxByOrNull { it.value }?.key ?: TransactionType.EXPENSE

        val categoryCounts = mutableMapOf<UUID?, Int>()
        for (tx in sorted) {
            val catId: UUID? = tx.categoryId
            categoryCounts[catId] = (categoryCounts[catId] ?: 0) + 1
        }
        val dominantCategoryId = categoryCounts.entries.maxByOrNull { it.value }?.key

        val amounts = sorted.map { it.amount.toDouble() }
        val sortedAmounts = amounts.sorted()
        val typicalAmount = sortedAmounts.getOrElse(sortedAmounts.size / 2) { sortedAmounts[0] }

        val dateDifferences = mutableListOf<Long>()
        var prevDate: Long? = null
        for (tx in sorted) {
            val date = (tx.dateTime?.toEpochMilli() ?: 0L)
            if (prevDate != null) {
                dateDifferences.add(date - prevDate)
            }
            prevDate = date
        }

        val intervalCounts = mutableMapOf<Long, Int>()
        for (diff in dateDifferences) {
            intervalCounts[diff] = (intervalCounts[diff] ?: 0) + 1
        }

        val mostCommonDiff = intervalCounts.entries.maxByOrNull { it.value }?.key ?: 0L

        val (frequency, intervalN) = determineFrequency(mostCommonDiff, dateDifferences.size)

        val signalCount = calculateSignalCount(mostCommonDiff, dateDifferences, intervalCounts)
        val confidence = determineConfidence(signalCount, intervalCounts.size, dateDifferences.size)

        val explanation = generateExplanation(
            merchantName = transactions.first().description?.take(30) ?: "",
            typicalAmount = typicalAmount,
            frequency = frequency,
            signalCount = signalCount,
            confidence = confidence
        )

        val merchantName = transactions.first().description?.take(30)?.trim()

        val shouldSuggest = signalCount >= 2 && confidence != SuggestionConfidence.NONE

        return GroupAnalysis(
            merchantName = merchantName,
            transactionType = transactionType,
            typicalAmount = typicalAmount,
            dominantCategory = null,
            signalCount = signalCount,
            firstTransactionDate = sorted.first().dateTime ?: Instant.EPOCH,
            lastTransactionDate = sorted.last().dateTime ?: Instant.EPOCH,
            dateDifferences = dateDifferences,
            confidence = confidence,
            explanation = explanation,
            shouldSuggest = shouldSuggest,
            detectedFrequency = frequency,
            intervalN = intervalN
        )
    }

    private fun analyzeByCategoryAndAmount(
        transactions: List<Transaction>
    ): List<DetectionResult> {
        val results = mutableListOf<DetectionResult>()

        val byCategory = transactions.groupBy { it.categoryId }

        for ((categoryId, group) in byCategory) {
            if (group.size < 2) continue

            val amounts = group.map { it.amount.toDouble() }
            val amountRange = amounts.max() - amounts.min()
            val averageAmount = amounts.average()

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

            if (group.size >= 3 && dateDiffs.isNotEmpty()) {
                val mostCommonDiff = dateDiffs.groupBy { it }.maxByOrNull { it.value.size }?.key ?: continue
                val (frequency, intervalN) = determineFrequency(mostCommonDiff, dateDiffs.size)

                if (frequency != IntervalType.DAY || intervalN >= 7) {
                    results.add(
                        DetectionResult(
                            commitment = CommitmentCandidate(
                                title = "Recurring payment",
                                amount = averageAmount,
                                transactionType = TransactionType.EXPENSE,
                                category = null,
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
                            explanation = "${group.size} transactions, similar amounts, about every ${frequency.name}"
                        )
                    )
                }
            }
        }

        return results
    }

    private fun determineFrequency(
        mostCommonDiff: Long,
        transactionCount: Int
    ): Pair<IntervalType, Int> {
        val diffInDays = mostCommonDiff / (1000 * 60 * 60 * 24)

        return when {
            diffInDays >= 365 && transactionCount >= 3 -> Pair(IntervalType.YEAR, 1)
            diffInDays >= 180 && transactionCount >= 3 -> Pair(IntervalType.MONTH, 6)
            diffInDays >= 90 && transactionCount >= 3 -> Pair(IntervalType.MONTH, 3)
            diffInDays >= 60 && transactionCount >= 3 -> Pair(IntervalType.MONTH, 2)
            diffInDays >= 31 && transactionCount >= 3 -> Pair(IntervalType.MONTH, 1)
            diffInDays >= 14 && transactionCount >= 3 -> Pair(IntervalType.WEEK, 2)
            diffInDays >= 7 && transactionCount >= 3 -> Pair(IntervalType.WEEK, 1)
            diffInDays >= 3 && transactionCount >= 3 -> Pair(IntervalType.WEEK, 1)
            else -> Pair(IntervalType.DAY, 1)
        }
    }

    private fun calculateSignalCount(
        mostCommonDiff: Long,
        dateDifferences: List<Long>,
        intervalCounts: Map<Long, Int>
    ): Int {
        if (dateDifferences.isEmpty()) return 1
        return dateDifferences.count { diff ->
            abs(diff - mostCommonDiff) <= mostCommonDiff * 0.2
        }
    }

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
        }

        val signalText = when (confidence) {
            SuggestionConfidence.HIGH -> "strong pattern (3+ consistent occurrences)"
            SuggestionConfidence.MEDIUM -> "moderate pattern (2-3 occurrences)"
            SuggestionConfidence.LOW -> "weak pattern (2 occurrences)"
            else -> "limited evidence"
        }

        return "$merchantName \u2014 \u20B9${String.format("%.0f", typicalAmount)} $freqText. $signalText"
    }

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
