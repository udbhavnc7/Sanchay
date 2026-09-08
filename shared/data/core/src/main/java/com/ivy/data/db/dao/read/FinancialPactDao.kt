package com.ivy.data.db.dao.read

import androidx.room.Dao
import androidx.room.Query
import com.ivy.data.db.entity.FinancialPactEntity
import java.util.*


@Dao
interface FinancialPactDao {
    @Query("SELECT * FROM financial_pacts WHERE isDeleted = 0 ORDER BY updatedAt DESC")
    suspend fun findAll(): List<FinancialPactEntity>

    @Query("SELECT * FROM financial_pacts WHERE isSynced = :synced AND isDeleted = :deleted")
    suspend fun findByIsSyncedAndIsDeleted(synced: Boolean, deleted: Boolean = false): List<FinancialPactEntity>

    @Query("SELECT * FROM financial_pacts WHERE id = :id")
    suspend fun findById(id: UUID): FinancialPactEntity?

    @Query("SELECT * FROM financial_pacts WHERE counterpartyName LIKE :filter")
    suspend fun searchByCounterparty(filter: String): List<FinancialPactEntity>

    @Query("SELECT * FROM financial_pacts WHERE type = :type AND isDeleted = 0")
    suspend fun findByType(type: String): List<FinancialPactEntity>

    @Query("SELECT * FROM financial_pacts WHERE remainingAmount > 0 AND isDeleted = 0")
    suspend fun findOutstanding(): List<FinancialPactEntity>

    @Query("SELECT * FROM financial_pacts WHERE dueDate < :now AND status != 'SETTLED' AND isDeleted = 0")
    suspend fun findOverdue(now: Long): List<FinancialPactEntity>
}