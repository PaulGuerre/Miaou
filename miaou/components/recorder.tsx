import { getMistralResponse } from '@/hooks/useAPI';
import { Buffer } from 'buffer';
import { Audio } from 'expo-av';
import * as File from 'expo-file-system/legacy';
import React, { useState } from 'react';
import { Alert, Image, StyleSheet, View } from 'react-native';
import radioWaves from '../assets/images/radio-waves.png';

export default function Recorder({ setIsPlaying }: { setIsPlaying: (isPlaying: boolean) => void }) {
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [isRecording, setIsRecording] = useState(false);

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
            console.error('Erreur lors du démarrage de l\'enregistrement', error);
            Alert.alert('Error', 'Erreur lors du démarrage de l\'enregistrement');
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

                const response = await getMistralResponse(audioFile);

                const base64String = Buffer.from(response, 'binary').toString('base64');
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
            console.error('Erreur lors du traitement de l\'audio :', error);
            Alert.alert('Error', 'Erreur lors du traitement de l\'audio');
        }
    };

    return (
        <View style={[styles.recorder, isRecording ? { backgroundColor: '#fa500f' } : { backgroundColor: '#e0e0e0' }]} onTouchStart={startRecording} onTouchEnd={stopRecording}>
            <Image
                source={radioWaves}
                style={{ width: 50, height: 50 }}
                resizeMode="contain"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    recorder: {
        backgroundColor: '#f0f0f0',
        borderRadius: 100,
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        width: 100,
        height: 100,
    }
});