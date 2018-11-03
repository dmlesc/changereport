$CurrentSprint = Get-Item D:\sites\changereport\CurrentSprint
$CurrentSprint.Delete()
$outfile = "D:\scripts\changereport\CurrentSprint.txt"
[int]$sprint = Get-Content $outfile
$sprint++
New-Item -ItemType directory -Path D:\sites\changereport\Sprints\$sprint
cmd /c mklink /J D:\sites\changereport\CurrentSprint D:\sites\changereport\Sprints\$sprint
$sprint | Out-File $outfile