import axios from 'axios';
import { Buffer } from 'buffer';
import { Audio } from 'expo-av';
import * as File from 'expo-file-system/legacy';
import React, { useState } from 'react';
import { Alert, Image, StyleSheet, View } from 'react-native';
import mistralLogoBlackAndWhite from '../assets/images/mistral-ai-black-and-white.png';
import mistralLogo from '../assets/images/mistral-ai.png';
import radioWaves from '../assets/images/radio-waves.png';

export default function HomeScreen() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const startRecording = async () => {
    try {
      setIsRecording(true);

      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
    } catch (error) {
      console.error('Failed to start recording', error);
      Alert.alert('Error', 'Failed to start recording');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    setIsRecording(false);

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      if (uri) {
        const audioFile = await File.readAsStringAsync(uri, { encoding: File.EncodingType.Base64 });

        const response = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/ios-upload`, {
          audio: audioFile,
          filename: 'recording.m4a',
          mimetype: 'audio/m4a'
        }, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000,
          responseType: 'arraybuffer'
        });

        const base64String = Buffer.from(response.data, 'binary').toString('base64');
        const dataUri = `data:audio/mpeg;base64,${base64String}`;

        setIsPlaying(true);

        const { sound } = await Audio.Sound.createAsync(
          { uri: dataUri },
          {
            volume: 1.0,
            isLooping: false
          }
        );

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        });

        await sound.playAsync();

        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish) {
            setIsPlaying(false);
          }
        });
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to process audio');
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.player, isPlaying ? { outlineColor: '#fa500f' } : { outlineColor: '#333333' }]}>
        <Image
          source={isPlaying ? mistralLogo : mistralLogoBlackAndWhite}
          style={{ width: 100, height: 100 }}
          resizeMode="contain"
        />
      </View>

      <View style={[styles.recorder, isRecording ? { backgroundColor: '#fa500f' } : { backgroundColor: '#e0e0e0' }]} onTouchStart={startRecording} onTouchEnd={stopRecording}>
        <Image
          source={radioWaves}
          style={{ width: 50, height: 50 }}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-around',
    height: '100%',
    padding: 20,
  },
  player: {
    backgroundColor: '#e0e0e0',
    borderRadius: 100,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    width: 200,
    height: 200,
    outlineWidth: 4,
    outlineOffset: 10,
  },
  recorder: {
    backgroundColor: '#f0f0f0',
    borderRadius: 100,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
  },
});
