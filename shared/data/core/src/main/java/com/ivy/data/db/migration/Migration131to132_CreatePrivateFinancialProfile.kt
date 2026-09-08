package com.ivy.data.db.migration

import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase

class Migration131to132_CreatePrivateFinancialProfile : Migration(131, 132) {
    override fun migrate(db: SupportSQLiteDatabase) {
        db.execSQL("""
            CREATE TABLE IF NOT EXISTS private_financial_profile (
                id TEXT NOT NULL PRIMARY KEY,
                displayName TEXT,
                bio TEXT,
                avatarReference TEXT,
                createdAt INTEGER NOT NULL,
                updatedAt INTEGER NOT NULL,
                visibility TEXT NOT NULL DEFAULT 'PRIVATE',
                isSynced INTEGER NOT NULL DEFAULT 0,
                isDeleted INTEGER NOT NULL DEFAULT 0
            )
        """.trimIndent())
    }
}