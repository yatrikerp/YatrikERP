@echo off
echo ========================================
echo Getting SHA-1 Fingerprint for Google Sign-In
echo ========================================
echo.

cd flutter\android

echo Running Gradle signing report...
echo.

call gradlew.bat signingReport

echo.
echo ========================================
echo Look for "Variant: debug" section above
echo Copy the SHA1 value
echo.
echo Example:
echo SHA1: AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD
echo ========================================
echo.
echo Next Steps:
echo 1. Copy the SHA-1 fingerprint from above
echo 2. Go to: https://console.cloud.google.com/
echo 3. Select project: yatrikerp
echo 4. Go to: APIs ^& Services -^> Credentials
echo 5. Create OAuth client ID -^> Android
echo 6. Package name: com.yatrik.erp.yatrik_mobile
echo 7. Paste the SHA-1 fingerprint
echo 8. Click CREATE
echo.
pause
