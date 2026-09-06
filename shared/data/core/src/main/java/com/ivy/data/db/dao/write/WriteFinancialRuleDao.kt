package com.ivy.data.db.dao.write

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.ivy.data.db.entity.FinancialRuleEntity
import java.util.UUID

@Dao
interface WriteFinancialRuleDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun save(value: FinancialRuleEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveMany(value: List<FinancialRuleEntity>)

    @Query("DELETE FROM financial_rules WHERE id = :id")
    suspend fun deleteById(id: UUID)

    @Query("DELETE FROM financial_rules")
    suspend fun deleteAll()

    @Query("SELECT * FROM financial_rules WHERE id = :id AND isDeleted = 0")
    suspend fun findActiveById(id: UUID): FinancialRuleEntity?

    @Query("UPDATE financial_rules SET enabled = :enabled, updatedAt = :now WHERE id = :id")
    suspend fun updateEnabled(id: UUID, enabled: Boolean, now: Long)

    @Query("UPDATE financial_rules SET name = :name, thresholdValue = :thresholdValue, conditionOperator = :conditionOperator, updatedAt = :now WHERE id = :id")
    suspend fun updateRule(id: UUID, name: String, thresholdValue: Double, conditionOperator: String, now: Long)
}