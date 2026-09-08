package com.ivy.data.db.dao.read

import androidx.room.Dao
import androidx.room.Query
import com.ivy.data.db.entity.PactRepaymentEntity
import java.util.*

@Dao
interface PactRepaymentDao {
    @Query("SELECT * FROM pact_repayments WHERE isDeleted = 0 ORDER BY dateTime DESC")
    suspend fun findAll(): List<PactRepaymentEntity>

    @Query("SELECT * FROM pact_repayments WHERE isSynced = :synced AND isDeleted = :deleted")
    suspend fun findByIsSyncedAndIsDeleted(synced: Boolean, deleted: Boolean = false): List<PactRepaymentEntity>

    @Query("SELECT * FROM pact_repayments WHERE pactId = :pactId ORDER BY dateTime DESC")
    suspend fun findByPactId(pactId: UUID): List<PactRepaymentEntity>

    @Query("SELECT * FROM pact_repayments WHERE id = :id")
    suspend fun findById(id: UUID): PactRepaymentEntity?

    @Query("SELECT * FROM pact_repayments WHERE amount > 0 AND isDeleted = 0")
    suspend fun findPositive(): List<PactRepaymentEntity>

    @Query("SELECT SUM(amount) FROM pact_repayments WHERE pactId = :pactId AND isDeleted = 0")
    suspend fun totalRepaidByPact(pactId: UUID): Double
}