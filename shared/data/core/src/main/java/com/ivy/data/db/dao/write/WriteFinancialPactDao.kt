package com.ivy.data.db.dao.write

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.ivy.data.db.entity.FinancialPactEntity
import java.util.UUID

@Dao
interface WriteFinancialPactDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun save(value: FinancialPactEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveMany(value: List<FinancialPactEntity>)

    @Query("DELETE FROM financial_pacts WHERE id = :id")
    suspend fun deleteById(id: UUID)

    @Query("DELETE FROM financial_pacts")
    suspend fun deleteAll()

    @Query("SELECT * FROM financial_pacts WHERE isDeleted = 0 ORDER BY updatedAt DESC")
    suspend fun findAllActive(): List<FinancialPactEntity>

    @Query("SELECT * FROM financial_pacts WHERE remainingAmount <= 0 AND isDeleted = 0")
    suspend fun findSettled(): List<FinancialPactEntity>

    @Query("SELECT * FROM financial_pacts WHERE status = 'ACTIVE' AND isDeleted = 0")
    suspend fun findActive(): List<FinancialPactEntity>
}