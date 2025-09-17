# API Validation Script for SaavnDownloader
# This script validates that the JioSaavn API is working correctly

param(
    [switch]$Quick
)

function Write-ColorText {
    param(
        [string]$Text,
        [string]$Color = "White"
    )
    Write-Host $Text -ForegroundColor $Color
}

function Test-APIEndpoint {
    param(
        [string]$Url,
        [string]$Description
    )
    
    Write-ColorText "🔍 Testing: $Description" "Yellow"
    
    try {
        $response = Invoke-WebRequest -Uri $Url -TimeoutSec 15 -UseBasicParsing
        if ($response.StatusCode -eq 200) {
            Write-ColorText "✅ $Description - OK" "Green"
            return $true
        } else {
            Write-ColorText "❌ $Description - HTTP $($response.StatusCode)" "Red"
            return $false
        }
    }
    catch {
        Write-ColorText "❌ $Description - Error: $($_.Exception.Message)" "Red"
        return $false
    }
}

function Test-SearchAPI {
    Write-ColorText "🔍 Testing Search API..." "Yellow"
    
    try {
        $searchUrl = "https://saavn.dev/api/search/songs?query=bollywood&limit=3"
        $response = Invoke-RestMethod -Uri $searchUrl -Method Get -TimeoutSec 30
        
        if ($response.success -and $response.data.results) {
            Write-ColorText "✅ Search API working - Found $($response.data.results.Count) songs" "Green"
            
            # Test first song details
            if ($response.data.results.Count -gt 0) {
                $firstSong = $response.data.results[0]
                Write-ColorText "📋 Testing song: $($firstSong.name)" "Cyan"
                
                $detailsUrl = "https://saavn.dev/api/songs?ids=$($firstSong.id)"
                $detailsResponse = Invoke-RestMethod -Uri $detailsUrl -Method Get -TimeoutSec 30
                
                if ($detailsResponse.success -and $detailsResponse.data) {
                    $songDetails = $detailsResponse.data[0]
                    Write-ColorText "✅ Song details API working" "Green"
                    
                    if ($songDetails.downloadUrl -and $songDetails.downloadUrl.Count -gt 0) {
                        Write-ColorText "📊 Available qualities: $($songDetails.downloadUrl.Count)" "Cyan"
                        foreach ($quality in $songDetails.downloadUrl) {
                            Write-ColorText "   - $($quality.quality)" "White"
                        }
                        return $true
                    } else {
                        Write-ColorText "❌ No download URLs found" "Red"
                        return $false
                    }
                } else {
                    Write-ColorText "❌ Song details API failed" "Red"
                    return $false
                }
            }
            return $true
        } else {
            Write-ColorText "❌ Search API returned no results" "Red"
            return $false
        }
    }
    catch {
        Write-ColorText "❌ Search API test failed: $($_.Exception.Message)" "Red"
        return $false
    }
}

function Test-DownloadURL {
    param(
        [string]$Url
    )
    
    try {
        $request = [System.Net.WebRequest]::Create($Url)
        $request.Method = "HEAD"
        $request.Timeout = 10000
        $response = $request.GetResponse()
        
        if ($response.StatusCode -eq "OK") {
            $contentLength = $response.Headers["Content-Length"]
            if ($contentLength) {
                $sizeMB = [math]::Round([int]$contentLength / 1MB, 2)
                Write-ColorText "✅ Download URL accessible - Size: $sizeMB MB" "Green"
            } else {
                Write-ColorText "✅ Download URL accessible" "Green"
            }
            $response.Close()
            return $true
        } else {
            Write-ColorText "❌ Download URL returned: $($response.StatusCode)" "Red"
            $response.Close()
            return $false
        }
    }
    catch {
        Write-ColorText "❌ Download URL test failed: $($_.Exception.Message)" "Red"
        return $false
    }
}

function Main {
    Write-ColorText "🧪 SaavnDownloader API Validation" "Cyan"
    Write-ColorText "═══════════════════════════════════════════════════════════════" "Cyan"
    Write-Host ""
    
    $allTestsPassed = $true
    
    # Test 1: Basic connectivity
    Write-ColorText "🌐 Testing basic connectivity..." "Yellow"
    $connectivityTest = Test-APIEndpoint -Url "https://saavn.dev" -Description "JioSaavn API Base"
    if (-not $connectivityTest) { $allTestsPassed = $false }
    Write-Host ""
    
    if ($connectivityTest) {
        # Test 2: Search API
        $searchTest = Test-SearchAPI
        if (-not $searchTest) { $allTestsPassed = $false }
        Write-Host ""
        
        if ($searchTest -and -not $Quick) {
            # Test 3: Download URL accessibility (only if not quick mode)
            Write-ColorText "🔗 Testing download URL accessibility..." "Yellow"
            
            try {
                $searchUrl = "https://saavn.dev/api/search/songs?query=test&limit=1"
                $response = Invoke-RestMethod -Uri $searchUrl -Method Get -TimeoutSec 30
                
                if ($response.success -and $response.data.results.Count -gt 0) {
                    $songId = $response.data.results[0].id
                    $detailsUrl = "https://saavn.dev/api/songs?ids=$songId"
                    $detailsResponse = Invoke-RestMethod -Uri $detailsUrl -Method Get -TimeoutSec 30
                    
                    if ($detailsResponse.success -and $detailsResponse.data[0].downloadUrl) {
                        $downloadUrl = $detailsResponse.data[0].downloadUrl[0].url
                        $downloadTest = Test-DownloadURL -Url $downloadUrl
                        if (-not $downloadTest) { $allTestsPassed = $false }
                    }
                }
            }
            catch {
                Write-ColorText "⚠️  Download URL test skipped due to error" "Yellow"
            }
            Write-Host ""
        }
    }
    
    # Summary
    Write-ColorText "📋 Validation Summary:" "Cyan"
    Write-ColorText "╔══════════════════════════════════════════════════════════════╗" "Cyan"
    Write-ColorText "║ Test Component                    Status                    ║" "Cyan"
    Write-ColorText "╠══════════════════════════════════════════════════════════════╣" "Cyan"
    
    $connectivityStatus = if ($connectivityTest) { "✅ PASS" } else { "❌ FAIL" }
    $searchStatus = if ($searchTest) { "✅ PASS" } else { "❌ FAIL" }
    
    Write-ColorText "║ API Connectivity                  $connectivityStatus                    ║" "Cyan"
    Write-ColorText "║ Search API                        $searchStatus                    ║" "Cyan"
    
    if (-not $Quick) {
        $downloadStatus = if ($downloadTest) { "✅ PASS" } else { "❌ FAIL" }
        Write-ColorText "║ Download URLs                     $downloadStatus                    ║" "Cyan"
    }
    
    Write-ColorText "╚══════════════════════════════════════════════════════════════╝" "Cyan"
    
    if ($allTestsPassed) {
        Write-Host ""
        Write-ColorText "🎉 All API tests passed! SaavnDownloader is ready to use." "Green"
        Write-ColorText "🚀 You can now run: .\run-downloader.bat" "Yellow"
    } else {
        Write-Host ""
        Write-ColorText "❌ Some API tests failed. Please check your internet connection." "Red"
        Write-ColorText "💡 The downloader may still work with limited functionality." "Yellow"
    }
}

# Run validation
Main
