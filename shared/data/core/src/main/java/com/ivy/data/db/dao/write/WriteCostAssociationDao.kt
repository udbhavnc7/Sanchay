package com.ivy.data.db.dao.write

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.ivy.data.db.entity.CostAssociationEntity
import java.util.UUID

@Dao
interface WriteCostAssociationDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun save(value: CostAssociationEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveMany(value: List<CostAssociationEntity>)

    @Query("DELETE FROM cost_associations WHERE id = :id")
    suspend fun deleteById(id: UUID)

    @Query("DELETE FROM cost_associations")
    suspend fun deleteAll()
}
