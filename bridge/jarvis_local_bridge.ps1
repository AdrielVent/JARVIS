$ErrorActionPreference = "Stop"

$HostAddress = "127.0.0.1"
$Port = 8787
$AllowedOrigins = @(
  "null",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  "http://localhost:8787",
  "http://127.0.0.1:8787",
  "https://adrielvent.github.io",
  "https://adrielvent.github.io/JARVIS/"
)

function Convert-BytesToGbLabel {
  param([Nullable[Int64]]$Bytes)
  if ($null -eq $Bytes -or $Bytes -le 0) {
    return "Unknown"
  }
  return ("{0} GB" -f [Math]::Round($Bytes / 1GB))
}

function Get-JarvisSystemInfo {
  $computer = Get-CimInstance -ClassName Win32_ComputerSystem -ErrorAction SilentlyContinue
  $os = Get-CimInstance -ClassName Win32_OperatingSystem -ErrorAction SilentlyContinue
  $cpu = Get-CimInstance -ClassName Win32_Processor -ErrorAction SilentlyContinue | Select-Object -First 1
  $battery = Get-CimInstance -ClassName Win32_Battery -ErrorAction SilentlyContinue | Select-Object -First 1

  $batteryText = "Unknown"
  if ($battery -and $null -ne $battery.EstimatedChargeRemaining) {
    $batteryText = "$($battery.EstimatedChargeRemaining)%"
  }

  $deviceName = $env:COMPUTERNAME
  if ([string]::IsNullOrWhiteSpace($deviceName)) {
    $deviceName = "Operator"
  }

  $osLabel = "Windows"
  if ($os -and -not [string]::IsNullOrWhiteSpace($os.Caption)) {
    $osLabel = $os.Caption
  }

  $cpuLabel = "Unknown"
  if ($cpu -and -not [string]::IsNullOrWhiteSpace($cpu.Name)) {
    $cpuLabel = $cpu.Name.Trim()
  }

  [ordered]@{
    deviceName = $deviceName
    os = $osLabel
    cpu = $cpuLabel
    memory = Convert-BytesToGbLabel $computer.TotalPhysicalMemory
    battery = $batteryText
    localTime = (Get-Date).ToString("h:mm tt")
    status = "online"
  }
}

function Get-CorsHeaders {
  param([string]$Origin)
  $headers = [ordered]@{
    "Access-Control-Allow-Methods" = "GET, OPTIONS"
    "Access-Control-Allow-Headers" = "Accept, Content-Type"
    "Cross-Origin-Resource-Policy" = "cross-origin"
    "Connection" = "close"
  }
  if ($AllowedOrigins -contains $Origin) {
    $headers["Access-Control-Allow-Origin"] = $Origin
    $headers["Vary"] = "Origin"
  }
  return $headers
}

function Write-HttpJson {
  param(
    [System.Net.Sockets.NetworkStream]$Stream,
    [int]$StatusCode,
    [string]$StatusText,
    [hashtable]$Headers,
    [object]$Payload
  )

  if ($null -eq $Payload) {
    $body = ""
  } else {
    $body = $Payload | ConvertTo-Json -Depth 8
  }

  $bodyBytes = [System.Text.Encoding]::UTF8.GetBytes($body)
  $headerLines = New-Object System.Collections.Generic.List[string]
  $headerLines.Add("HTTP/1.1 $StatusCode $StatusText")
  $headerLines.Add("Content-Type: application/json; charset=utf-8")
  $headerLines.Add("Content-Length: $($bodyBytes.Length)")
  foreach ($key in $Headers.Keys) {
    $headerLines.Add("$key`: $($Headers[$key])")
  }
  $headerLines.Add("")
  $headerLines.Add("")

  $headerBytes = [System.Text.Encoding]::ASCII.GetBytes(($headerLines -join "`r`n"))
  $Stream.Write($headerBytes, 0, $headerBytes.Length)
  if ($bodyBytes.Length -gt 0) {
    $Stream.Write($bodyBytes, 0, $bodyBytes.Length)
  }
}

function Read-HttpRequest {
  param([System.IO.StreamReader]$Reader)

  $requestLine = $Reader.ReadLine()
  if ([string]::IsNullOrWhiteSpace($requestLine)) {
    return $null
  }

  $headers = @{}
  while ($true) {
    $line = $Reader.ReadLine()
    if ($null -eq $line -or $line.Length -eq 0) {
      break
    }
    $separator = $line.IndexOf(":")
    if ($separator -gt 0) {
      $name = $line.Substring(0, $separator).Trim()
      $value = $line.Substring($separator + 1).Trim()
      $headers[$name] = $value
    }
  }

  $parts = $requestLine.Split(" ")
  if ($parts.Length -lt 2) {
    return $null
  }

  [ordered]@{
    Method = $parts[0].ToUpperInvariant()
    RawPath = $parts[1]
    Headers = $headers
  }
}

$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Parse($HostAddress), $Port)
$listener.Start()

Write-Host "Project J.A.R.V.I.S. PowerShell Local Bridge running at http://$HostAddress`:$Port"
Write-Host "Use that Local Bridge URL in the J.A.R.V.I.S. web app. Press Ctrl+C to stop."

try {
  while ($true) {
    $client = $listener.AcceptTcpClient()
    try {
      $stream = $client.GetStream()
      $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 1024, $true)
      $request = Read-HttpRequest $reader

      if ($null -eq $request) {
        continue
      }

      $origin = $request.Headers["Origin"]
      $headers = Get-CorsHeaders $origin
      $path = ([System.Uri]::new("http://127.0.0.1$($request.RawPath)")).AbsolutePath

      if ($request.Method -eq "OPTIONS") {
        Write-HttpJson $stream 204 "No Content" $headers $null
      } elseif ($request.Method -eq "GET" -and $path -eq "/status") {
        Write-HttpJson $stream 200 "OK" $headers ([ordered]@{ status = "online" })
      } elseif ($request.Method -eq "GET" -and $path -eq "/system-info") {
        Write-HttpJson $stream 200 "OK" $headers (Get-JarvisSystemInfo)
      } elseif ($request.Method -eq "GET" -and $path -eq "/") {
        Write-HttpJson $stream 200 "OK" $headers ([ordered]@{
          status = "online"
          name = "Project J.A.R.V.I.S. PowerShell Local Bridge"
          bridgeUrl = "http://127.0.0.1:8787"
          message = "Return to the J.A.R.V.I.S. website and connect to this local bridge."
        })
      } else {
        Write-HttpJson $stream 404 "Not Found" $headers ([ordered]@{ ok = $false; error = "unknown endpoint" })
      }
    } catch {
      Write-Host "Bridge request error: $($_.Exception.Message)"
    } finally {
      $client.Close()
    }
  }
} finally {
  $listener.Stop()
}
