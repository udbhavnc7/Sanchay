package com.ivy.data.db.dao.read

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import com.ivy.data.db.entity.GoalEntity
import java.util.*
import javax.inject.Inject

@Dao
interface GoalDao {
    @Query("SELECT * FROM goals WHERE isDeleted = 0 ORDER BY orderId ASC")
    suspend fun findAll(): List<GoalEntity>

    @Query("SELECT * FROM goals WHERE id = :id AND isDeleted = 0")
    suspend fun findById(id: UUID): GoalEntity?

    @Insert
    suspend fun save(value: GoalEntity)

    @Insert
    suspend fun saveMany(value: List<GoalEntity>)

    @Query("UPDATE goals SET isDeleted = 1, isSynced = 0 WHERE accountId = :accountId")
    suspend fun deletedByAccountId(accountId: UUID)

    @Query("DELETE FROM goals WHERE id = :id")
    suspend fun deleteById(id: UUID)

    @Query("DELETE FROM goals")
    suspend fun deleteAll()

    @Query("SELECT COUNT(*) FROM goals WHERE isDeleted = 0 ")
    suspend fun countGoals(): Long
}