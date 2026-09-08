package com.ivy.data.db.dao.read

import androidx.room.Dao
import androidx.room.Query
import com.ivy.data.db.entity.GoalEntity
import java.util.*

@Dao
interface GoalDao {
    @Query("SELECT * FROM goals WHERE isDeleted = 0 ORDER BY orderId ASC")
    suspend fun findAll(): List<GoalEntity>

    @Query("SELECT * FROM goals WHERE id = :id AND isDeleted = 0")
    suspend fun findById(id: UUID): GoalEntity?

    @Query("SELECT COUNT(*) FROM goals WHERE isDeleted = 0")
    suspend fun countGoals(): Long
}