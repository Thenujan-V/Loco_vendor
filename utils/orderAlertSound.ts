import { Audio } from 'expo-av';

let soundInstance: Audio.Sound | null = null;
let audioReady = false;

const bellSoundAsset = require('../assets/sounds/bell.wav');

const ensureSoundLoaded = async () => {
  if (!audioReady) {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
    audioReady = true;
  }

  if (!soundInstance) {
    const { sound } = await Audio.Sound.createAsync(bellSoundAsset, {
      shouldPlay: false,
      volume: 1,
      progressUpdateIntervalMillis: 250,
    });

    soundInstance = sound;
  }

  return soundInstance;
};

export const playOrderAlertSound = async () => {
  try {
    const sound = await ensureSoundLoaded();
    await sound.setPositionAsync(0);
    await sound.playAsync();
  } catch (error) {
    console.log('[pending-orders] bell sound failed', error);
  }
};

export const unloadOrderAlertSound = async () => {
  if (!soundInstance) {
    return;
  }

  try {
    await soundInstance.unloadAsync();
  } finally {
    soundInstance = null;
    audioReady = false;
  }
};
