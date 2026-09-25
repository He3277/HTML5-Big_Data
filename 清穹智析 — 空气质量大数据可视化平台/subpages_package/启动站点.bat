@echo off
echo 正在启动本地服务器...
start python -m http.server 8000
timeout /t 2 /nobreak >nul
start http://localhost:8000/index.html
echo 已自动打开主页，如果未成功请手动访问 http://localhost:8000/index.html
pause