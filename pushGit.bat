@echo off
REM Script untuk melakukan Add, Commit, dan Push
REM Pastikan Anda berada di direktori root repositori Git

echo [INFO] Menambahkan semua perubahan ke staging area...
git add .

echo [INFO] Melakukan commit dengan pesan "auto push"...
git commit -m "auto push"

REM Perintah 'git push' akan mendorong ke branch yang sedang aktif
echo [INFO] Mendorong perubahan ke remote repository...
git push

echo.
echo [SELESAI] Operasi Git selesai.
pause