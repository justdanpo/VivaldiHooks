@set installhooks_args=%*& set installhooks_self=%~f0& powershell -c "(gc \"%~f0\") -replace '@set installhooks_args.*','#' | Write-Host" | powershell -c -& goto :eof

$srcdir = split-path $env:installhooks_self

if ($env:installhooks_args) {
  $vivargs = iex "echo $env:installhooks_args"
  $nowait = $vivargs | Where-Object { $_ -eq '-nowait' }
  $vivpath = $vivargs | Where-Object { $_ -ne '-nowait' }
}

if (-Not $vivpath) {
  Try {
    $vivpath = Split-Path ((Get-ItemProperty -ErrorAction SilentlyContinue 'Registry::HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\App Paths\vivaldi.exe').'(default)')
  }
  Catch {
  }
}

if (-Not $vivpath) {
  Try {
    $ftypestring = ( (cmd /c ftype) | Where-Object { $_ -contains 'Vivaldi' } ).split('=')[1]
    $vivpath = Split-Path ([management.automation.psparser]::Tokenize($ftypestring, [ref]$null)[0].content)
  }
  Catch {
  }
}

if (-Not $vivpath) {
  write-warning "Can't find Vivaldi installation path"
}
else {
  Try {
    $dstdir = split-path ((Get-ChildItem -path $vivpath -r background-bundle.js | Sort-Object -property CreationTime -descending | Select-Object -first 1).FullName)
    write-host "Destination directory: $dstdir"

    $encoding = (New-Object System.Text.UTF8Encoding($False))
    write-host "Updating browser.html"
    $html = Get-Content (join-path $dstdir "browser.html") -encoding UTF8
    $outhtml = @()
    $html | ForEach-Object {
      $line = $_
      if ($line.tolower().contains('<script src="jdhooks.js"></script>')) {
        return
      }
      elseif ($line.tolower().contains('<script src="bundle.js"></script>')) {
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

if (-Not $nowait) {
  Write-Host -NoNewLine "Press any key to continue..."
  $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

Try {
  #last try is not executed :-\
}
Catch {
}
