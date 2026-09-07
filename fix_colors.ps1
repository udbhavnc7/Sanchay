$files = Get-ChildItem -Path 'shared/ui/core/src/main/java' -Recurse -Filter '*.kt'
$count = 0
foreach ($f in $files) {
    $content = [IO.File]::ReadAllText($f.FullName)
    $original = $content
    $content = $content -replace 'SanchayColors\.Primary primary', 'SanchayColors.Primary.primary'
    $content = $content -replace 'SanchayColors\.Error primary', 'SanchayColors.Error.primary'
    $content = $content -replace 'SanchayColors\.Error extraLight', 'SanchayColors.Error.extraLight'
    $content = $content -replace 'SanchayColors\.Muted light', 'SanchayColors.Muted.light'
    $content = $content -replace 'SanchayColors\.Muted extraLight', 'SanchayColors.Muted.extraLight'
    $content = $content -replace 'SanchayColors\.Muted primary', 'SanchayColors.Muted.primary'
    $content = $content -replace 'SanchayColors\.Neutral primary', 'SanchayColors.Neutral.primary'
    $content = $content -replace 'SanchayColors\.Neutral extraLight', 'SanchayColors.Neutral.extraLight'
    $content = $content -replace 'SanchayColors\.Warning primary', 'SanchayColors.Warning.primary'
    $content = $content -replace 'SanchayColors\.Income primary', 'SanchayColors.Income.primary'
    $content = $content -replace 'SanchayColors\.Income extraLight', 'SanchayColors.Income.extraLight'
    $content = $content -replace 'SanchayColors\.Expense extraLight', 'SanchayColors.Expense.extraLight'
    if ($content -ne $original) {
        [IO.File]::WriteAllText($f.FullName, $content)
        $count++
        Write-Host "Fixed: $($f.Name)"
    }
}
Write-Host "Total files fixed: $count"
