import Player from '@/components/player';
import Recorder from '@/components/recorder';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export default function HomeScreen() {
  const [isPlaying, setIsPlaying] = React.useState(false);

  return (
    <View style={styles.container}>
      <Player isPlaying={isPlaying} />
      <Recorder setIsPlaying={setIsPlaying} />
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
  }
});
