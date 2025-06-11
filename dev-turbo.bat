@echo off
echo Starting Next.js with Turbopack...
echo.
echo This will provide 10-20x faster compilation times!
echo.
echo Disabling Web3 features for Turbo compatibility...
set NEXT_PUBLIC_ENABLE_WEB3=false
echo.
npx next dev --turbo 