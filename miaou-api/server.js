import express from 'express';
import multer from 'multer';
import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import cors from 'cors';
import { getTextFromFile, synthesizeSpeech } from './azure.js';
import { getMistralResponse } from './mistral.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const convertToWav = (inputBuffer) => {
  return new Promise((resolve, reject) => {
    const inputPath = join(tmpdir(), `input_${Date.now()}.m4a`);
    const outputPath = join(tmpdir(), `output_${Date.now()}.wav`);

    fs.writeFileSync(inputPath, inputBuffer);

    ffmpeg(inputPath)
      .toFormat('wav')
      .audioFrequency(16000)
      .audioChannels(1)
      .audioBitrate('16k')
      .on('error', (err) => {
        console.error('Error converting audio:', err);
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        reject(err);
      })
      .on('end', () => {
        const wavBuffer = fs.readFileSync(outputPath);
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);
        resolve(wavBuffer);
      })
      .save(outputPath);
  });
};

const generateResponse = (buffer) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log('Converting audio to WAV format...');
      const wavBuffer = await convertToWav(buffer);
      console.log('WAV conversion complete.');


      console.log('Starting transcription...');
      const transcription = await getTextFromFile(wavBuffer);
      console.log('Transcription acquired :', transcription);

      console.log('Starting Mistral response generation...');
      const mistralResponse = await getMistralResponse(transcription);

      console.log('Mistral Response generated :', mistralResponse);

      console.log('Starting speech synthesis...');
      const mp3FilePath = await synthesizeSpeech(mistralResponse);

      resolve(mp3FilePath);
    } catch (error) {
      reject(error);
    }
  });
}

app.post('/generate-response', upload.single('audio'), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).send('No file uploaded.');
    }

    console.log('File received:', file.originalname, ', Size:', file.size, 'bytes');

    const audioBuffer = await generateResponse(file.buffer);
    
    console.log('Sending response audio file...');

    res.sendFile(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `attachment; filename="response.mp3"`,
      }
    }, (err) => {
      if (fs.existsSync(mp3FilePath)) {
        fs.unlinkSync(mp3FilePath);
      }
      if (err) {
        console.error('Error sending file:', err);
      }
    });
  } catch (error) {
    console.error('Error processing file:', error);
    return res.status(500).send('Internal Server Error');
  }
});

app.post('/ios-upload', express.json({ limit: '50mb' }), async (req, res) => {
  try {
    console.log('iOS request received');
    const { audio, filename, mimetype } = req.body;

    if (!audio) {
      return res.status(400).json({ error: 'No audio data received' });
    }

    console.log('Received base64 audio, length:', audio.length);

    const buffer = Buffer.from(audio, 'base64');
    if (buffer.length === 0) {
      return res.status(400).json({ error: 'Empty audio buffer' });
    }

    const audioBuffer = await generateResponse(buffer);
    
    console.log('Sending response audio file...');

    res.sendFile(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': `attachment; filename="response.mp3"`,
      }
    }, (err) => {
      if (fs.existsSync(audioBuffer)) {
        fs.unlinkSync(audioBuffer);
      }
      if (err) {
        console.error('Error sending file:', err);
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
