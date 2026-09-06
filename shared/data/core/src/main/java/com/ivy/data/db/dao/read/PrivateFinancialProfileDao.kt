package com.ivy.data.db.dao.read

import androidx.room.Dao
import androidx.room.Query
import com.ivy.data.db.entity.PrivateFinancialProfileEntity
import com.ivy.data.model.primitive.UUID
import java.util.*

@Dao
interface PrivateFinancialProfileDao {
    @Query("SELECT * FROM private_financial_profile WHERE isDeleted = 0")
    suspend fun findAll(): List<PrivateFinancialProfileEntity>

    @Query("SELECT * FROM private_financial_profile WHERE id = :id AND isDeleted = 0")
    suspend fun findById(id: UUID): PrivateFinancialProfileEntity?

    @Query("SELECT * FROM private_financial_profile WHERE isDeleted = 0 ORDER BY updatedAt DESC")
    suspend fun findMostRecent(): PrivateFinancialProfileEntity?

    @Query("UPDATE private_financial_profile SET visibility = :visibility, updatedAt = :now WHERE id = :id")
    suspend fun updateVisibility(id: UUID, visibility: String, now: Long)

    @Query("UPDATE private_financial_profile SET displayName = :name, bio = :bio, avatarReference = :avatar, updatedAt = :now WHERE id = :id")
    suspend fun updateProfile(id: UUID, name: String?, bio: String?, avatar: String?, now: Long)

    @Query("DELETE FROM private_financial_profile WHERE id = :id")
    suspend fun deleteById(id: UUID)

    @Query("DELETE FROM private_financial_profile")
    suspend fun deleteAll()
}