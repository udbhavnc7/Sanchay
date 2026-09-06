package com.ivy.data.db.dao.read

import androidx.room.Dao
import androidx.room.Query
import com.ivy.data.db.entity.PurchaseEntity
import java.util.*
import kotlinx.coroutines.flow.Flow

@Dao
interface PurchaseDao {
    @Query("SELECT * FROM purchases WHERE isDeleted = 0 ORDER BY purchaseDate DESC")
    suspend fun findAll(): List<PurchaseEntity>

    @Query("SELECT * FROM purchases WHERE isSynced = :synced AND isDeleted = :deleted")
    suspend fun findByIsSyncedAndIsDeleted(synced: Boolean, deleted: Boolean = false): List<PurchaseEntity>

    @Query("SELECT * FROM purchases WHERE id = :id")
    suspend fun findById(id: UUID): PurchaseEntity?

    @Query("SELECT * FROM purchases WHERE linkedTransactionId = :transactionId")
    suspend fun findByLinkedTransactionId(transactionId: UUID): PurchaseEntity?

    @Query("SELECT * FROM purchases WHERE returnDeadline IS NOT NULL AND returnDeadline < :now AND isDeleted = 0")
    suspend fun findOverdueReturnDeadlines(now: Long): List<PurchaseEntity>

    @Query("SELECT * FROM purchases WHERE warrantyEndDate IS NOT NULL AND warrantyEndDate < :now AND isDeleted = 0")
    suspend fun findExpiredWarranties(now: Long): List<PurchaseEntity>

    @Query("SELECT * FROM purchases WHERE remainingAmountGuard > 0 AND isDeleted = 0")
    suspend fun findOutstanding(): List<PurchaseEntity>
}