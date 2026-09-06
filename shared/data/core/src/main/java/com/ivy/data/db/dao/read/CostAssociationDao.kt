package com.ivy.data.db.dao.read

import androidx.room.Dao
import androidx.room.Query
import com.ivy.data.db.entity.CostAssociationEntity
import java.util.*

@Dao
interface CostAssociationDao {
    @Query("SELECT * FROM cost_associations WHERE isDeleted = 0 ORDER BY createdAt DESC")
    suspend fun findAll(): List<CostAssociationEntity>

    @Query("SELECT * FROM cost_associations WHERE id = :id")
    suspend fun findById(id: UUID): CostAssociationEntity?

    @Query("SELECT * FROM cost_associations WHERE purchaseId = :purchaseId AND isDeleted = 0")
    suspend fun findByPurchaseId(purchaseId: UUID): List<CostAssociationEntity>

    @Query("SELECT * FROM cost_associations WHERE linkedTransactionId = :transactionId AND isDeleted = 0")
    suspend fun findByLinkedTransactionId(transactionId: UUID): List<CostAssociationEntity>

    @Query("SELECT * FROM cost_associations WHERE isSynced = :synced AND isDeleted = :deleted")
    suspend fun findByIsSyncedAndIsDeleted(synced: Boolean, deleted: Boolean = false): List<CostAssociationEntity>
}
