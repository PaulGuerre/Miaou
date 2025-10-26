import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import mistralLogo from '../assets/images/mistral-ai.png';

export default function Player({ isPlaying }: { isPlaying: boolean }) {
    return (
        <View style={[styles.player, isPlaying ? { outlineColor: '#fa500f' } : { outlineColor: '#333333' }]}>
            <Image
                source={mistralLogo}
                style={{ width: 100, height: 100 }}
                resizeMode="contain"
            />
        </View>
    );
}

const styles = StyleSheet.create({
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
    }
});
