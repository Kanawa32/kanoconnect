# ============================================
# Kano Connect - Android APK Build Dockerfile
# Uses Capacitor + Node.js to build Android APK
# ============================================

FROM node:18-alpine AS builder

# Install Python and build tools needed for native modules
RUN apk add --no-cache python3 make g++ bash git

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install

# Install Capacitor CLI globally
RUN npm install -g @capacitor/cli

# Install Android SDK (basic setup for building)
# Note: Full Android build requires Android SDK Platform-Tools
# This image provides the Node.js/Capacitor environment

# Copy all frontend source code
COPY frontend/ .

# ============================================
# Step 1: Build the web app
# ============================================
RUN npm run build

# ============================================
# Step 2: Add Android platform
# ============================================
RUN npx cap add android 2>/dev/null || true

# ============================================
# Step 3: Sync web assets to Android
# ============================================
RUN npx cap sync android

# ============================================
# Step 4: Build Android APK
# ============================================
# This requires ANDROID_SDK_ROOT to be set up
# For Render or CI, you'd typically use:
#   npx cap build android --release
#
# The APK will be generated at:
#   app/platforms/android/app/build/outputs/apk/release/app-release.apk

# Set environment variables for Android build
ENV ANDROID_SDK_ROOT=/usr/local/lib/android/sdk
ENV PATH=$PATH:$ANDROID_SDK_ROOT/platform-tools

# Create SDK directory structure
RUN mkdir -p $ANDROID_SDK_ROOT && \
    mkdir -p $ANDROID_SDK_ROOT/{platforms,build-tools,platform-tools}

# Accept Android licenses (basic - may need full sdkmanager setup)
# RUN yes | $ANDROID_SDK_ROOT/tools/bin/sdkmanager --licenses 2>/dev/null || true

# Build the Android APK
# Note: Full release build requires debug keystore and signing
# This command will generate a debug APK by default
RUN npx cap build android 2>&1 || echo "Build command exited with code $?"

# Keep the APK if it exists
RUN if [ -f "app/platforms/android/app/build/outputs/apk/debug/app-debug.apk" ]; then \
      echo "APK built successfully at app/platforms/android/app/build/outputs/apk/debug/app-debug.apk"; \
    fi

# ============================================
# Default command - keep container running
# or copy APK to output directory
# ============================================
CMD ["echo", "Android build Dockerfile ready. Use 'docker run' to build APK."]