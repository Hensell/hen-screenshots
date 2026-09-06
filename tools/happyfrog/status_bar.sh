#!/usr/bin/env bash
# Fixed Android system indicators for the dedicated screenshot emulator.
set -euo pipefail

serial="${1:?Usage: status_bar.sh emulator-SERIAL [reset]}"
mode="${2:-prepare}"
if [[ "$mode" != prepare && "$mode" != reset ]]; then
  echo 'Mode must be prepare or reset.' >&2
  exit 1
fi
avd_name="$(adb -s "$serial" emu avd name | tr -d '\r' | head -n 1)"
if [[ "$avd_name" != HenScreenshots_QA ]]; then
  echo 'This helper only changes the HenScreenshots_QA emulator.' >&2
  exit 1
fi

demo() {
  adb -s "$serial" shell am broadcast -a com.android.systemui.demo "$@"
}

if [[ "$mode" == reset ]]; then
  demo -e command exit
  adb -s "$serial" shell settings put global sysui_demo_allowed 0
  adb -s "$serial" shell dumpsys battery reset
  adb -s "$serial" shell settings put global auto_time 1
  adb -s "$serial" shell settings delete secure icon_blacklist
  adb -s "$serial" shell cmd connectivity airplane-mode disable
  exit 0
fi

adb -s "$serial" shell settings put global sysui_demo_allowed 1
demo -e command exit
adb -s "$serial" shell settings put system show_battery_percent 1
adb -s "$serial" shell settings put system time_12_24 24
# Android 16 can keep real signal widgets active during demo mode.
adb -s "$serial" shell cmd connectivity airplane-mode enable
adb -s "$serial" shell settings put secure icon_blacklist airplane,mobile,wifi,satellite
adb -s "$serial" shell dumpsys battery unplug
adb -s "$serial" shell dumpsys battery set level 100
demo -e command enter
demo -e command clock -e hhmm 0941
demo -e command battery -e level 100 -e plugged false
demo -e command network -e airplane hide -e wifi hide -e mobile hide -e satellite hide
demo -e command notifications -e visible false
