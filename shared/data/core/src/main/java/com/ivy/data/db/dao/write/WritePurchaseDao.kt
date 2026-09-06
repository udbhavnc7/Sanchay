package com.ivy.data.db.dao.write

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.ivy.data.db.entity.PurchaseEntity
import java.util.UUID

@Dao
interface WritePurchaseDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun save(value: PurchaseEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveMany(value: List<PurchaseEntity>)

    @Query("DELETE FROM purchases WHERE id = :id")
    suspend fun deleteById(id: UUID)

    @Query("DELETE FROM purchases")
    suspend fun deleteAll()

    @Query("SELECT * FROM purchases WHERE isDeleted = 0 ORDER BY purchaseDate DESC")
    suspend fun findAllActive(): List<PurchaseEntity>

    @Query("SELECT * FROM purchases WHERE isDeleted = 0")
    suspend fun findAllWithoutDeleted(): List<PurchaseEntity>

    @Query("SELECT * FROM purchases WHERE id = :id AND isDeleted = 0")
    suspend fun findActiveById(id: UUID): PurchaseEntity?

    @Query("UPDATE purchases SET returnDeadline = :deadline, warrantyEndDate = :warrantyEndDate, notes = :notes, updatedAt = :now WHERE id = :id")
    suspend fun updateProtectionFields(
        id: UUID,
        deadline: Instant?,
        warrantyEndDate: Instant?,
        notes: String?,
        now: Long
    )
}