#!/bin/bash

# Set Android SDK environment variables
export ANDROID_HOME=~/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator

# Start the Android emulator in the background
echo "Starting Android emulator..."
emulator -avd Medium_Phone_API_36.1 &

# Wait for emulator to boot
echo "Waiting for emulator to boot..."
sleep 30

# Check if emulator is ready
echo "Checking emulator status..."
adb devices

# Start Expo
echo "Starting Expo..."
npx expo start -c
