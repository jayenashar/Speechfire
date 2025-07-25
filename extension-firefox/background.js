chrome.runtime.onInstalled.addListener(() => {
  console.log("Whisper Live Transcription Extension Installed");
});

// background.js
chrome.commands.onCommand.addListener((command) => {
  console.log(`Command received: ${command}`); // Log command for debugging

  // Toggle global extension settings like icon changes
  if (command === "start_stop_transcription") {
    toggleRecording();
  }

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { command: command });
  });
});

let isRecording = false;

// Paths to your sound files
const startSound = new Audio(browser.runtime.getURL("sounds/start.mp3"));
const stopSound = new Audio(browser.runtime.getURL("sounds/stop.mp3"));

function toggleRecording() {
  if (!isRecording) {
    // Don't change icon here - wait for content script confirmation
    // Just send the command to content script
    isRecording = true;
  } else {
    // The content script will handle stopping and notify us
    isRecording = false;
  }
}

// Variable to store volume level (0 to 1)
let volumeLevel = 1.0;
let selectedLanguage = "English"; // Default language
let serverUrl = "http://127.0.0.1:5000"; // Default server URL

// Load settings from chrome storage when the background script starts
chrome.storage.local.get("volume", (data) => {
  if (data.volume !== undefined) {
    volumeLevel = data.volume;
    console.log("Volume restored:", data.volume);
  } else {
    console.log("No volume stored, using default.");
  }
});

chrome.storage.local.get("language", (data) => {
  if (data.language !== undefined) {
    selectedLanguage = data.language;
    console.log("Language restored:", data.language);
  } else {
    console.log("No language stored, using default.");
  }
});

chrome.storage.local.get("serverUrl", (data) => {
  if (data.serverUrl !== undefined) {
    serverUrl = data.serverUrl;
    console.log("Server URL restored:", data.serverUrl);
  } else {
    console.log("No server URL stored, using default.");
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getLanguage") {
    sendResponse({ language: selectedLanguage });
  } else if (message.action === "getServerUrl") {
    sendResponse({ serverUrl: serverUrl });
  } else if (message.action === "updateVolume") {
    volumeLevel = message.volume;
    console.log(`Volume updated: ${volumeLevel}`);
  } else if (message.action === "updateLanguage") {
    selectedLanguage = message.language;
    console.log(`Language updated: ${selectedLanguage}`);
  } else if (message.action === "updateServerUrl") {
    serverUrl = message.serverUrl;
    console.log(`Server URL updated: ${serverUrl}`);
  } else if (message.action === "recordingStarted") {
    // Recording actually started - change icon and play sound
    startSound.volume = volumeLevel;
    startSound.play();
    browser.browserAction.setIcon({ path: "./icon/icon-red.png" });
    console.log("Recording started - icon changed to red");
  } else if (message.action === "recordingStopped") {
    // Recording stopped - change icon back and play sound
    stopSound.volume = volumeLevel;
    stopSound.play();
    browser.browserAction.setIcon({ path: "./icon/icon-128.png" });
    isRecording = false;
    console.log("Recording stopped - icon changed to normal");
  } else if (message.action === "recordingFailed") {
    // Recording failed - reset state without changing icon
    isRecording = false;
    console.log("Recording failed - state reset");
  }
});
