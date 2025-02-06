#!/bin/bash

# 버전 정보를 manifest.json에서 추출
VERSION=$(grep -o '"version": "[^"]*"' manifest.json | cut -d'"' -f4)
echo "📦 Building extension version $VERSION..."

# 기존 zip 파일이 있다면 제거
rm -f extension-v${VERSION}.zip 2>/dev/null

# 직접 필요한 파일들을 zip으로 압축
echo "🗜️  Creating ZIP file..."
zip -r extension-v${VERSION}.zip \
    manifest.json \
    sidebar.html \
    background.js \
    assets/* \
    css/* \
    js/* \
    -x ".*" \
    -x "__MACOSX" \
    2>/dev/null

# 빌드 완료 메시지
echo "✅ Build completed successfully!"
echo "📎 Created: extension-v${VERSION}.zip"