# tokenmiser demo — records as demo.gif
#
# Requirements:  brew install vhs
# Before running: cd into a real project (not tokenmiser itself — pick something
#                 with 30–100 files so the numbers look good)
# Run with:      vhs /path/to/tokenmiser/demo.tape

Output demo.gif

Set Shell "zsh"
Set FontSize 14
Set FontFamily "JetBrains Mono"
Set Width 960
Set Height 580
Set Theme "Catppuccin Mocha"
Set Padding 24
Set Framerate 24
Set PlaybackSpeed 1.0

# Show file count so viewers know what they're looking at
Type "git ls-files | wc -l"
Sleep 400ms
Enter
Sleep 1200ms

# Run init — let the spinner and output play out naturally
Type "npx tokenmiser init"
Sleep 400ms
Enter
Sleep 10000ms

# Let viewers read the results
Sleep 4000ms

# Peek at the generated index
Type "head -25 CODEBASE_INDEX.md"
Sleep 400ms
Enter
Sleep 3500ms

# Scan to show the token breakdown
Type "npx tokenmiser scan"
Sleep 400ms
Enter
Sleep 5000ms

# Hold on final output
Sleep 5000ms
