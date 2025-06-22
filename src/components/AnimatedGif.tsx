import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';

interface AnimatedGifProps {
  source: { uri: string };
  style: ViewStyle;
  resizeMode?: 'cover' | 'contain' | 'stretch';
}

const AnimatedGif: React.FC<AnimatedGifProps> = ({ source, style, resizeMode = 'cover' }) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background-color: #F5F5F5;
            overflow: hidden;
          }
          img {
            max-width: 100%;
            max-height: 100%;
            object-fit: ${resizeMode};
            border-radius: 12px;
            background-color: #F5F5F5;
          }
        </style>
      </head>
      <body>
        <img src="${source.uri}" alt="Exercise GIF" />
      </body>
    </html>
  `;

  return (
    <View style={[styles.container, style]}>
      <WebView
        source={{ html: htmlContent }}
        style={styles.webview}
        scrollEnabled={false}
        bounces={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        scalesPageToFit={true}
        startInLoadingState={false}
        javaScriptEnabled={false}
        domStorageEnabled={false}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  webview: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
});

export default AnimatedGif;
