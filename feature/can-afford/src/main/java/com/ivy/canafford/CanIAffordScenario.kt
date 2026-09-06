package com.ivy.canafford

import com.ivy.base.model.TransactionType
import com.ivy.data.model.primitive.UUID
import java.time.Instant

/** A pure in-memory scenario for Can-I-Afford simulation.
 *  This class exists only in memory and is never persisted in V1.
 *  It models a hypothetical purchase and its potential impact.
 */
@Immutable
data class CanIAffordScenario(
    val amount: Double,
    val transactionType: TransactionType,
    val accountId: UUID?,
    val categoryId: UUID?,
    val description: String?,
    val purchaseDate: Instant,
    val isRecurring: Boolean = false,
    val frequency: String? = null,
    val recurringAmount: Double? = null,
    val hypotheticalId: UUID = UUID.randomUUID()
)