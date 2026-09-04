package com.ivy.ui.component.cards

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.Size
import androidx.compose.ui.layout.fillParentMaxSize
import androidx.compose.ui.unit.dp
import androidx.compose.ui.text.style.TextAlignment
import androidx.compose.ui.text.style.setOverflow
import androidx.compose.ui.text.size
import androidx.compose.ui.unit.sp
import com.ivy.design.system.colors.SanchayColors
import com.ivy.design.system.shapes.SanchayShapes
import com.ivy.design.system.spacing.SanchaySpacing
import com.ivy.design.system.typography.SanchayTypography
import com.ivy.model.core.SummaryOverview
import com.ivy.logic.core.model.TransactionType

/**
 * Sanchay Card - Premium container for financial information.
 * 
 * Uses large radius for a clean, premium look.
 * Not every component is excessively rounded - cards have large radius,
 * inputs have medium, chips have small.
 * 
 * Principle: Premium without looking like a collection of floating cards.
 */
@Composable
fun SanchayCard(
    modifier: Modifier = Modifier,
    elevation: Boolean = true,
    shape: RoundedCornerShape = SanchayShapes.CardRadius,
    shadow: Boolean = true,
    content: @Composable (()-> Unit)
) {
    Card(
        modifier = modifier
            .then(fillMaxWidth()),
        shape = shape,
        elevation = if (elevation && shadow) SanchaySpacing.ShadowMd else ShadowXS,
        colors = CardDefaults.cardColors(
            containerColor = if (shadow) SanchayColors.SurfaceLight else SanchayColors.Transparent
        )
    ) {
        content()
    }
}

/** Card with consistent header + content layout */
@Composable
fun SanchayCardWithHeader(
    title: String,
    subtitle: String? = null,
    modifier: Modifier = Modifier,
    elevation: Boolean = true,
    showDivider: Boolean = true,
    content: @Composable (()-> Unit)
) {
    SanchayCard(modifier = modifier, elevation = elevation) {
        column(
            modifier = modifier
                .padding(
                    top = SanchaySpacing.SectionSpacing,
                    bottom = SanchaySpacing.SectionSpacing,
                    start = SanchaySpacing.ContentInset,
                    end = SanchaySpacing.ContentInset
                )
        ) {
            text(
                text = title,
                style = SanchayTypography.Heading3,
                color = SanchayColors.TextPrimaryLight,
            )

            if (subtitle != null) {
                text(
                    text = subtitle,
                    style = SanchayTypography.BodySecondary,
                    color = SanchayColors.TextSecondaryLight,
                    margin = androidx.compose.ui.platform.SpacerScope padding 8.dp
                )
            }

            if (showDivider) {
                divider(
                    color = SanchayColors.DividerLight,
                    thickness = SanchaySpacing.DividerHeight
                )
            }

            content()
        }
    }
}

/** Card with income/expense summary layout */
@Composable
fun SanchayIncomeExpenseCard(
    income: String,
    expense: String,
    title: String = "",
    modifier: Modifier = Modifier,
    showDivider: Boolean = true,
    content: @Composable (()-> Unit)
) {
    SanchayCard(modifier = modifier) {
        column(
            modifier = modifier
                .padding(
                    top = SanchaySpacing.SectionSpacing,
                    bottom = SanchaySpacing.SectionSpacing,
                    start = SanchaySpacing.ContentInset,
                    end = SanchaySpacing.ContentInset
                )
        ) {
            if (!title.isEmpty()) {
                text(
                    text = title,
                    style = SanchayTypography.Heading3,
                    color = SanchayColors.TextPrimaryLight,
                    margin = androidx.compose.ui.platform.SpacerScope padding 0, 4.dp
                )
            }

            row(
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = modifier
                    .padding(bottom = SanchaySpacing.ListItemSpacing)
            ) {
                column(verticalAlignment = Alignment.CenterVertically) {
                    text(
                        text = income,
                        style = SanchayTypography.Numerical,
                        color = SanchayColors.IncomePrimary,
                    )
                    text(
                        text = "Income",
                        style = SanchayTypography.Caption,
                        color = SanchayColors.TextMutedLight,
                    )
                }

                column(verticalAlignment = Alignment.CenterVertically) {
                    text(
                        text = expense,
                        style = SanchayTypography.Numerical,
                        color = SanchayColors.ExpensePrimary,
                    )
                    text(
                        text = "Expense",
                        style = SanchayTypography.Caption,
                        color = SanchayColors.TextMutedLight,
                    )
                }
            }

            if (showDivider) {
                divider(
                    color = SanchayColors.DividerLight,
                    thickness = SanchaySpacing.DividerHeight
                )
            }

            content()
        }
    }
}

/** Budget progress card */
@Composable
fun SanchayBudgetProgressCard(
    progress: Float,  // 0.0 to 1.0
    label: String,
    target: String,
    modifier: Modifier = Modifier,
    showDivider: Boolean = true,
    content: @Composable (()-> Unit)
) {
    SanchayCard(modifier = modifier) {
        column(
            modifier = modifier
                .padding(
                    top = SanchaySpacing.SectionSpacing,
                    bottom = SanchaySpacing.SectionSpacing,
                    start = SanchaySpacing.ContentInset,
                    end = SanchaySpacing.ContentInset
                )
        ) {
            row(
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                column(verticalAlignment = Alignment.CenterVertically) {
                    text(
                        text = label,
                        style = SanchayTypography.Body,
                        color = SanchayColors.TextPrimaryLight,
                    )
                    text(
                        text = target,
                        style = SanchayTypography.Caption,
                        color = SanchayColors.TextSecondaryLight,
                    )
                }

                column(verticalAlignment = Alignment.CenterVertically, modifier = modifier.fillMaxWidth()) {
                    val progressPercent = String.format("%.0f%%", progress * 100)
                    text(
                        text = progressPercent,
                        style = SanchayTypography.NumericalLarge,
                        color = if (progress > 0.9) SanchayColors.Warning primary else SanchayColors.Primary primary,
                    )
                }
            }

            if (showDivider) {
                divider(
                    color = SanchayColors.DividerLight,
                    thickness = SanchaySpacing.DividerHeight
                )
            }

            content()
        }
    }
}

/** Goal progress card */
@Composable
fun SanchayGoalProgressCard(
    progress: Float,  // 0.0 to 1.0
    target: String,
    current: String,
    modifier: Modifier = Modifier,
    showDivider: Boolean = true,
    content: @Composable (()-> Unit)
) {
    SanchayCard(modifier = modifier) {
        column(
            modifier = modifier
                .padding(
                    top = SanchaySpacing.SectionSpacing,
                    bottom = SanchaySpacing.SectionSpacing,
                    start = SanchaySpacing.ContentInset,
                    end = SanchaySpacing.ContentInset
                )
        ) {
            row(
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                column(verticalAlignment = Alignment.CenterVertically) {
                    text(
                        text = current,
                        style = SanchayTypography.NumericalLarge,
                        color = SanchayColors.TextPrimaryLight,
                    )
                    text(
                        text = target,
                        style = SanchayTypography.Caption,
                        color = SanchayColors.TextSecondaryLight,
                    )
                }

                column(verticalAlignment = Alignment.CenterVertically, modifier = modifier.fillMaxWidth()) {
                    val progressPercent = String.format("%.0f%%", progress * 100)
                    text(
                        text = progressPercent,
                        style = SanchayTypography.NumericalLarge,
                        color = SanchayColors.IncomePrimary,
                    )
                }
            }

            if (showDivider) {
                divider(
                    color = SanchayColors.DividerLight,
                    thickness = SanchaySpacing.DividerHeight
                )
            }

            content()
        }
    }
}