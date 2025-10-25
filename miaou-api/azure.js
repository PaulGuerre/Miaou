import { SpeechConfig, AudioConfig, ConversationTranscriber, SpeechSynthesizer, ResultReason } from "microsoft-cognitiveservices-speech-sdk";
import fs from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

export function getTextFromFile(fileBuffer) {
  return new Promise((resolve, reject) => {
    try {
      const text = [];

      if (!process.env.SPEECH_KEY || !process.env.ENDPOINT) {
        throw new Error('Missing SPEECH_KEY or ENDPOINT in environment variables');
      }
      const speechConfig = SpeechConfig.fromEndpoint(new URL(process.env.ENDPOINT), process.env.SPEECH_KEY);
      speechConfig.speechRecognitionLanguage = "fr-FR";
      const audioConfig = AudioConfig.fromWavFileInput(fileBuffer);
      const conversationTranscriber = new ConversationTranscriber(speechConfig, audioConfig);

      conversationTranscriber.sessionStopped = function (s, e) { resolve(text.join(' ')); };

      conversationTranscriber.canceled = function (s, e) { resolve(text.join(' ')); };

      conversationTranscriber.transcribed = function (s, e) { text.push(e.result.text); };

      conversationTranscriber.startTranscribingAsync(
        () => { },
        (err) => { reject(new Error(`Error starting transcription: ${err}`)); }
      );
    } catch (error) {
      reject(error);
    }
  });
}

export const synthesizeSpeech = (text) => {
  return new Promise((resolve, reject) => {
    try {
      if (!process.env.ENDPOINT || !process.env.SPEECH_KEY) {
        throw new Error('Missing ENDPOINT or SPEECH_KEY in environment variables');
      }

      const tempFilePath = join(tmpdir(), `speech_${Date.now()}.mp3`);

      const speechConfig = SpeechConfig.fromEndpoint(
        new URL(process.env.ENDPOINT),
        process.env.SPEECH_KEY
      );

      speechConfig.speechSynthesisVoiceName = "fr-FR-HenriNeural";

      const audioConfig = AudioConfig.fromAudioFileOutput(tempFilePath);

      const synthesizer = new SpeechSynthesizer(speechConfig, audioConfig);

      synthesizer.speakTextAsync(
        text,
        (result) => {
          synthesizer.close();

          if (result.reason === ResultReason.SynthesizingAudioCompleted) {
            console.log('Speech synthesis completed successfully.');
            resolve(tempFilePath);
          } else {
            console.error('Speech synthesis failed:', result.errorDetails);
            if (fs.existsSync(tempFilePath)) {
              fs.unlinkSync(tempFilePath);
            }
            reject(new Error(`Speech synthesis canceled: ${result.errorDetails}`));
          }
        },
        (err) => {
          synthesizer.close();
          if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
          }
          reject(new Error(`Error during synthesis: ${err}`));
        }
      );
    } catch (error) {
      reject(error);
    }
  });
};