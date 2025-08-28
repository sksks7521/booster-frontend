Param(
  [string]$BaseURL = 'http://127.0.0.1:8000',
  [int]$Repeat = 1,
  [string[]]$Urls
)

if (-not $Urls -or $Urls.Count -eq 0) {
  $Urls = @(
    "$BaseURL/api/v1/items/simple?limit=1",
    "$BaseURL/api/v1/items/?limit=1",
    "$BaseURL/api/v1/auction-completed/?page=1&size=1",
    "$BaseURL/api/v1/real-transactions/?page=1&size=1",
    "$BaseURL/api/v1/real-rents/?page=1&size=1"
  )
}

for ($i = 1; $i -le $Repeat; $i++) {
  foreach ($u in $Urls) {
    $code = -1
    try {
      $resp = Invoke-WebRequest -UseBasicParsing -Method GET -Uri $u -ErrorAction Stop
      $code = [int]$resp.StatusCode
    } catch {
      if ($_.Exception -and $_.Exception.Response -and $_.Exception.Response.StatusCode) {
        $code = [int]$_.Exception.Response.StatusCode.value__
      } else {
        $code = 0
      }
    }

    $name = $u
    if ($u -match '/api/v1/([^?]+)') { $name = $Matches[1] }
    Write-Output ("{0}: {1}" -f $name, $code)
  }
  if ($i -lt $Repeat) { Write-Output '---' }
}

