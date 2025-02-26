#!/bin/bash

# Function to set display sleep time
set_display_sleep_time() {
  # $1: Battery, $2: Power Adapter
  # $3: Screen Saver (0 for Never, 1 for 2 minutes)

  # On battery
  if [[ $1 == "never" ]]; then
    sudo pmset -b displaysleep 0
    echo "Set display sleep on battery power to Never."
  else
    sudo pmset -b displaysleep 2
    echo "Set display sleep on battery power to 2 minutes."
  fi

  # On power adapter
  if [[ $2 == "never" ]]; then
    sudo pmset -c displaysleep 0
    echo "Set display sleep on power adapter to Never."
  else
    sudo pmset -c displaysleep 5
    echo "Set display sleep on power adapter to 5 minutes."
  fi

  # Screen saver settings
  if [[ $3 == 0 ]]; then
    defaults -currentHost write com.apple.screensaver idleTime 0
    echo "Set screen saver to Never."
  else
    defaults -currentHost write com.apple.screensaver idleTime 120
    echo "Set screen saver to 2 minutes."
  fi
}

# Check the current settings
pmset_output=$(pmset -g)
current_displaysleep_setting=$(echo "$pmset_output" | grep 'displaysleep' | awk '{print $2}')
current_screensaver_setting=$(defaults -currentHost read com.apple.screensaver idleTime 2>/dev/null)

# Determine if current settings match "Never"
battery_sleep_state="never"
power_adapter_sleep_state="never"

if [[ $current_displaysleep_setting == "0" ]]; then
  battery_sleep_state="never"
  power_adapter_sleep_state="never"
elif [[ $current_displaysleep_setting == "5" ]]; then
  battery_sleep_state="2"
  power_adapter_sleep_state="5"
fi

# Toggle logic based on current settings
if [[ $current_displaysleep_setting == "5" && $current_screensaver_setting == 120 ]]; then
  echo "Applying new settings: Display sleep on battery: Never, Power adapter: Never, Screen saver: Never"
  set_display_sleep_time "never" "never" 0
else
  echo "Applying new settings: Display sleep on battery: 2 minutes, Power adapter: 5 minutes, Screen saver: 2 minutes"
  set_display_sleep_time "2" "5" 1
fi
