Param(
  [string]$csid,
  [string]$date
)

add-pssnapin Microsoft.TeamFoundation.PowerShell
$user = "domain\user"
$pass = ConvertTo-SecureString "pass" -AsPlainText -Force
$cred = New-Object System.Management.Automation.PSCredential ($user, $pass)
$tfs = Get-TfsServer -Name http://tfs:8080/tfs/DefaultCollection -Credential $cred

if ($csid) {
   $changeset = get-tfschangeset $csid -Server $tfs
   $changeset.OwnerDisplayName
}
else {
   if (!$date) {
      $date = (Get-Date).AddDays(-1) | get-date -Format "yyyy-MM-dd"
      $outfile = "D:\sites\changereport\CurrentSprint\" + $date
   }
   elseif ($date -eq "today") {
      $date = get-date -Format "yyyy-MM-dd"
      $outfile = "D:\sites\changereport\today\today\today"
   }
   else {
      $outfile = "D:\sites\changereport\CurrentSprint\" + $date
   }
   $version = "D" + $date + " 00:00:00~D" + $date + " 23:59:59"
   $csids = Get-TfsItemHistory $/ILE/ -Server $tfs -Version $version -Recurse | Select-Object -ExpandProperty "ChangeSetId"
   $length = $csids.length
   '[' | Out-File $outfile

   for ($i = 0; $i -lt $length; $i++) {
      $changeset = get-tfschangeset $csids[$i] -Server $tfs 
      $Items = $changeset | Select-Object -Expand "Changes" | Select-Object -Expand "Item"
      $WorkItems = $changeset | Select-Object -Expand "WorkItems"
      $wilength = $WorkItems.length
      $ilength = $Items.length
      $ID = $changeset.ChangesetId | ConvertTo-JSON -Compress
      $cidate = get-date -date $Items[0].CheckinDate -format g | ConvertTo-JSON -Compress
      $Comment = $changeset.Comment | ConvertTo-JSON -Compress
      $User = $changeset.OwnerDisplayName | ConvertTo-JSON -Compress
      $str = '{"ChangeSetId":' + $ID + ','
      $str += '"CheckinDate":' + $cidate + ','
      $str += '"OwnerDisplayName":' + $User + ','
      $str += '"Comment":' + $Comment + ','
      $str += '"WorkItems":['
      for ($j = 0; $j -lt $wilength; $j++) {
         $str += $WorkItems[$j].Id | ConvertTo-JSON -Compress
         if ($j -ne $wilength - 1) { $str += ',' }
      }
      $str += '],"ServerItems":['
      $str | Out-File -Append $outfile
      for ($j = 0; $j -lt $ilength; $j++) {
         $str = $Items[$j].ServerItem | ConvertTo-JSON -Compress
         if ($j -ne $ilength - 1) { $str += ',' }
         $str | Out-File -Append $outfile
      }
      ']}' | Out-File -Append $outfile
      if ($i -ne $length - 1) {
         ',' | Out-File -Append $outfile
      }
   }
   ']' | Out-File -Append $outfile
}
