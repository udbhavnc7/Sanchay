package com.ivy.data.db.migration

import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase

class Migration130to131_CreateFinancialRules : Migration(130, 131) {
    override fun migrate(db: SupportSQLiteDatabase) {
        db.execSQL("""
            CREATE TABLE IF NOT EXISTS financial_rules (
                id TEXT NOT NULL PRIMARY KEY,
                name TEXT NOT NULL,
                enabled INTEGER NOT NULL,
                triggerType TEXT NOT NULL,
                conditionOperator TEXT NOT NULL,
                thresholdValue REAL NOT NULL,
                categoryId TEXT,
                accountId TEXT,
                budgetId TEXT,
                goalId TEXT,
                pactId TEXT,
                purchaseId TEXT,
                actionType TEXT NOT NULL,
                createdAt INTEGER NOT NULL,
                updatedAt INTEGER NOT NULL,
                isSynced INTEGER NOT NULL DEFAULT 0,
                isDeleted INTEGER NOT NULL DEFAULT 0
            )
        """.trimIndent())
    }
}