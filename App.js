import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

export default function App() {
  const [selectedMedia, setSelectedMedia] = useState(null);

  // Gallery madhun media (Image / Video) nivdnyasathi function
  const pickMedia = async (mediaType) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: mediaType === 'video' 
        ? ImagePicker.MediaTypeOptions.Videos 
        : ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedMedia(result.assets[0].uri);
      Alert.alert("Success", `${mediaType === 'video' ? 'Video' : 'Image'} successfully select zali ahe!`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Wallpaper Setter</Text>
      <Text style={styles.subtitle}>Select an option below to set your wallpaper</Text>

      {/* 1. Set Image Wallpaper Button */}
      <TouchableOpacity style={styles.button} onPress={() => pickMedia('image')}>
        <Text style={styles.buttonText}>Set Image Wallpaper</Text>
      </TouchableOpacity>

      {/* 2. Set Video Wallpaper Button */}
      <TouchableOpacity style={[styles.button, styles.videoButton]} onPress={() => pickMedia('video')}>
        <Text style={styles.buttonText}>Set Video Wallpaper</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#aaaaaa',
    marginBottom: 40,
    textAlign: 'center',
  },
  button: {
    width: '100%',
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  videoButton: {
    backgroundColor: '#2196F3',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
