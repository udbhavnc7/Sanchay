package com.ivy.data.db.dao.read

import androidx.room.Dao
import androidx.room.Query
import com.ivy.data.db.entity.FinancialRuleEntity
import java.util.*

@Dao
interface FinancialRuleDao {
    @Query("SELECT * FROM financial_rules WHERE isDeleted = 0 ORDER BY createdAt DESC")
    suspend fun findAll(): List<FinancialRuleEntity>

    @Query("SELECT * FROM financial_rules WHERE isSynced = :synced AND isDeleted = :deleted")
    suspend fun findByIsSyncedAndIsDeleted(synced: Boolean, deleted: Boolean = false): List<FinancialRuleEntity>

    @Query("SELECT * FROM financial_rules WHERE id = :id")
    suspend fun findById(id: UUID): FinancialRuleEntity?

    @Query("SELECT * FROM financial_rules WHERE categoryId = :categoryId AND isDeleted = 0")
    suspend fun findByCategoryId(categoryId: UUID): List<FinancialRuleEntity>

    @Query("SELECT * FROM financial_rules WHERE accountId = :accountId AND isDeleted = 0")
    suspend fun findByAccountId(accountId: UUID): List<FinancialRuleEntity>

    @Query("SELECT * FROM financial_rules WHERE budgetId = :budgetId AND isDeleted = 0")
    suspend fun findByBudgetId(budgetId: UUID): List<FinancialRuleEntity>

    @Query("SELECT * FROM financial_rules WHERE goalId = :goalId AND isDeleted = 0")
    suspend fun findByGoalId(goalId: UUID): List<FinancialRuleEntity>

    @Query("SELECT * FROM financial_rules WHERE pactId = :pactId AND isDeleted = 0")
    suspend fun findByPactId(pactId: UUID): List<FinancialRuleEntity>

    @Query("SELECT * FROM financial_rules WHERE purchaseId = :purchaseId AND isDeleted = 0")
    suspend fun findByPurchaseId(purchaseId: UUID): List<FinancialRuleEntity>

    @Query("SELECT * FROM financial_rules WHERE enabled = :enabled AND isDeleted = 0")
    suspend fun findEnabled(): List<FinancialRuleEntity>

    @Query("SELECT * FROM financial_rules WHERE isDeleted = 0")
    suspend fun findAllActive(): List<FinancialRuleEntity>

    @Query("SELECT * FROM financial_rules WHERE triggerType = :type AND isDeleted = 0")
    suspend fun findByTriggerType(type: String): List<FinancialRuleEntity>
}