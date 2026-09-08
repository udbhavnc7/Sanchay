package com.ivy.data.db.dao.write

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.ivy.data.db.entity.PactRepaymentEntity
import java.util.UUID

@Dao
interface WritePactRepaymentDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun save(value: PactRepaymentEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveMany(value: List<PactRepaymentEntity>)

    @Query("DELETE FROM pact_repayments WHERE id = :id")
    suspend fun deleteById(id: UUID)

    @Query("DELETE FROM pact_repayments")
    suspend fun deleteAll()

    @Query("SELECT * FROM pact_repayments WHERE pactId = :pactId ORDER BY dateTime DESC")
    suspend fun findByPactId(pactId: UUID): List<PactRepaymentEntity>

    @Query("SELECT * FROM pact_repayments WHERE id = :id")
    suspend fun findById(id: UUID): PactRepaymentEntity?
}