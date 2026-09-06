package com.ivy.data.db.dao.write

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.ivy.data.db.entity.PrivateFinancialProfileEntity
import java.util.UUID

@Dao
interface WritePrivateFinancialProfileDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun save(value: PrivateFinancialProfileEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveMany(value: List<PrivateFinancialProfileEntity>)

    @Query("DELETE FROM private_financial_profile WHERE id = :id")
    suspend fun deleteById(id: UUID)

    @Query("DELETE FROM private_financial_profile")
    suspend fun deleteAll()
}
