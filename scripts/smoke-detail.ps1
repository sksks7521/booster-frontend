Param(
  [string[]]$Urls = @(
    'http://127.0.0.1:8000/api/v1/items/simple?limit=1',
    'http://127.0.0.1:8000/api/v1/items/?limit=1',
    'http://127.0.0.1:8000/api/v1/auction-completed/?page=1&size=1',
    'http://127.0.0.1:8000/api/v1/real-transactions/?page=1&size=1',
    'http://127.0.0.1:8000/api/v1/real-rents/?page=1&size=1'
  )
)

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

  if ($u -match '/api/v1/([^?]+)') { $name = $Matches[1] } else { $name = $u }
  if ($code -eq 200) {
    Write-Output ("{0}: {1} (OK)" -f $name, $code)
    continue
  }

  Write-Output ("{0}: {1} (collecting details)" -f $name, $code)

  # Use external curl for raw headers + body
  $raw = & curl.exe -s -i $u
  # Keep it concise: take up to first 40 lines
  $lines = $raw -split "`r?`n"
  $head = $lines | Select-Object -First 40
  Write-Output "----- begin raw (truncated) -----"
  $head | ForEach-Object { Write-Output $_ }
  Write-Output "----- end raw (truncated) -----"
}

