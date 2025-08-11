Param(
  [string[]]$Urls = @(
    'http://127.0.0.1:8000/api/v1/items/simple?limit=1',
    'http://127.0.0.1:8000/api/v1/items/?limit=1',
    'http://127.0.0.1:8000/api/v1/auction-completed/?limit=1',
    'http://127.0.0.1:8000/api/v1/real-transactions/?limit=1',
    'http://127.0.0.1:8000/api/v1/real-rents/?limit=1'
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

  $name = $u
  if ($u -match '/api/v1/([^?]+)') {
    $name = $Matches[1]
  }
  Write-Output ("{0}: {1}" -f $name, $code)
}

