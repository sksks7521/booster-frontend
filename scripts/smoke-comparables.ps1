Param(
  [string]$BaseURL = 'http://127.0.0.1:8000',
  [int[]]$Ids = @(101,102,103,104,105)
)

foreach ($id in $Ids) {
  $endpoints = @(
    "$BaseURL/api/v1/items/$id",
    "$BaseURL/api/v1/items/$id/comparables"
  )
  foreach ($u in $endpoints) {
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
    Write-Output ("{0} -> {1}" -f $u, $code)
  }
  Write-Output '---'
}

