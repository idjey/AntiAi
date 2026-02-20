
@echo off
echo Backing up assets...
if not exist "apps\temp_assets" mkdir "apps\temp_assets"
if exist "apps\extension\assets" (
    xcopy /s /y "apps\extension\assets\*" "apps\temp_assets\"
)

echo Cleaning up old directories...
if exist "apps\extension" rmdir /s /q "apps\extension"
if exist "apps\extension_temp" rmdir /s /q "apps\extension_temp"

echo Initializing Plasmo project...
call npx -y create-plasmo --yes apps/extension --with-tailwindcss

echo Restoring assets...
if not exist "apps\extension\assets" mkdir "apps\extension\assets"
if exist "apps\temp_assets" (
    xcopy /s /y "apps\temp_assets\*" "apps\extension\assets\"
    rmdir /s /q "apps\temp_assets"
)

echo Done.
