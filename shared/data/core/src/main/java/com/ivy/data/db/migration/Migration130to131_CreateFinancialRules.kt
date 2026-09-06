package com.ivy.data.db.migration

import androidx.room.AutoMigrationSpec
import androidx.room.migration.Migration
import com.ivy.data.db.entity.FinancialRuleEntity
import kotlin.coroutines.Continuation
import kotlin.coroutines.jvm.internal.ContinuationImpl
import kotlin.coroutines.jvm.internal.DebugMetadata

class Migration130to131_CreateFinancialRules : Migration(130, 131) {
    override fun migrate(room: androidx.room.RoomDatabase) {
        room.execSQL("""
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