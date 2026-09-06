package com.ivy.data.db.migration

import androidx.room.migration.Migration
import com.ivy.data.db.entity.PrivateFinancialProfileEntity
import com.ivy.data.db.entity.FinancialRuleEntity

class Migration131to132_CreatePrivateFinancialProfile : Migration(131, 132) {
    override fun migrate(room: androidx.room.RoomDatabase) {
        room.execSQL("""
            CREATE TABLE IF NOT EXISTS private_financial_profile (
                id TEXT NOT NULL PRIMARY KEY,
                displayName TEXT,
                bio TEXT,
                avatarReference TEXT,
                createdAt INTEGER NOT NULL,
                updatedAt INTEGER NOT NULL,
                visibility INTEGER NOT NULL DEFAULT 0,
                isSynced INTEGER NOT NULL DEFAULT 0,
                isDeleted INTEGER NOT NULL DEFAULT 0
            )
        """.trimIndent())

        room.execSQL("""
            CREATE TABLE IF NOT EXISTS profile_section_config (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                profileId TEXT NOT NULL,
                key TEXT NOT NULL,
                label TEXT,
                visibility TEXT NOT NULL DEFAULT 'PRIVATE',
                order INTEGER NOT NULL DEFAULT 0,
                FOREIGN KEY (profileId) REFERENCES private_financial_profile(id) ON DELETE CASCADE
            )
        """.trimIndent())
    }
}