@set installhooks_args=%~1& set installhooks_self=%~f0& powershell -c "(gc \"%~f0\") -replace '@set installhooks_args.*','#' | Write-Host" | powershell -c -& goto :eof

$srcdir = split-path $env:installhooks_self

$vivpath = $env:installhooks_args

if($vivpath -eq $null) {
  Try {
    $vivpath = Split-Path ((Get-ItemProperty -ErrorAction SilentlyContinue 'Registry::HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\App Paths\vivaldi.exe').'(default)')
  }
  Catch {
  }
}

if($vivpath -eq $null) {
  Try {
    $ftypestring=( (cmd /c ftype) | where { $_.contains('Vivaldi') } ).split('=')[1]
    $vivpath = Split-Path ([management.automation.psparser]::Tokenize($ftypestring, [ref]$null)[0].content)
  }
  Catch {
  }
}

if($vivpath -eq $null) {
  write-warning "Can't find Vivaldi installation path"
} else {
  Try {
    $dstdir = split-path ((ls -path $vivpath -r localeSettings-bundle.js | sort -property CreationTime -descending | select -first 1).FullName)
    write-host "Destination directory: $dstdir"

    $encoding = (New-Object System.Text.UTF8Encoding($False))
    write-host "Updating browser.html"
    $html = gc (join-path $dstdir "browser.html") -encoding UTF8
    $outhtml = @()
    $html |% {
      $line = $_
      if($line.tolower().contains('<script src="jdhooks.js"></script>')) {
        return
      } elseif($line.tolower().contains('<script src="bundle.js"></script>')) {
        $outhtml += '    <script src="jdhooks.js"></script>'
      } 
      $outhtml += $_
    }  
    [System.IO.File]::WriteAllLines( (join-path $srcdir "vivaldi" | join-path -childpath "browser.html" ), $outhtml, $encoding)

    write-host "Copying files"
    copy-item (join-path $srcdir "vivaldi" | join-path -childpath "*") $dstdir -recurse -force

    write-host "Done"
  }
  Catch {
    write-host "Error: " $_
  }
}


Try {
#last try is ot executed :-\
}
Catch {
}

Write-Host -NoNewLine "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
