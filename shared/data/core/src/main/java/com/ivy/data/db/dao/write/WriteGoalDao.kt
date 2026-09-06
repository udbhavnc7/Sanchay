package com.ivy.data.db.dao.write

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.ivy.data.db.entity.GoalEntity
import java.util.UUID

@Dao
interface WriteGoalDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun save(value: GoalEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveMany(value: List<GoalEntity>)

    @Query("UPDATE goals SET isDeleted = 1, isSynced = 0 WHERE linkedAccountId = :accountId")
    suspend fun deletedByAccountId(accountId: UUID)

    @Query("DELETE FROM goals WHERE id = :id")
    suspend fun deleteById(id: UUID)

    @Query("DELETE FROM goals")
    suspend fun deleteAll()
}