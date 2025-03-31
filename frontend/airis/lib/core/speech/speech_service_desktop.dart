import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/services.dart';
import 'package:google_speech/google_speech.dart';
import 'package:record/record.dart';
import 'speech_service.dart';

class SpeechServiceDesktop implements SpeechService {
  bool _isListening = false;
  late SpeechToText _speechToText;
  final recorder = Record(); // using the record package
  Completer<void>? _recordingCompleter;

  SpeechServiceDesktop() {
    _initializeGoogleSpeech();
  }

  Future<void> _initializeGoogleSpeech() async {
    try {
      // Load the credentials from the JSON file in assets
      final String credentialsJson = await rootBundle.loadString(
        'assets/credentials.json',
      );
      final Map<String, dynamic> credentialsMap = jsonDecode(credentialsJson);

      // Convert the credentials map back into a JSON string
      final serviceAccount = ServiceAccount.fromString(
        jsonEncode(credentialsMap),
      );

      _speechToText = SpeechToText.viaServiceAccount(serviceAccount);
      print('Google Speech API initialized successfully.');
    } catch (e) {
      print('Error loading Google credentials: $e');
    }
  }

  @override
  Future<bool> initialize() async {
    // Check for microphone permission
    if (await recorder.hasPermission()) {
      print('Microphone permission granted.');
      return true;
    } else {
      print('Microphone permission denied.');
      return false;
    }
  }

  @override
  void listen({required Function(String result) onResult}) async {
    if (!_isListening) {
      _isListening = true;
      print('Listening...');

      final audioPath = 'audio_${DateTime.now().millisecondsSinceEpoch}.wav';
      await recorder.start(
        path: audioPath,
        encoder: AudioEncoder.wav,
        samplingRate: 16000,
        numChannels: 1,
      );

      _recordingCompleter = Completer<void>();
      await _recordingCompleter!.future;

      final convertedBytes = await _convertAudio(File(audioPath));
      
      final config = RecognitionConfig(
        encoding: AudioEncoding.LINEAR16,
        sampleRateHertz: 16000,
        languageCode: 'vi-VN',
        audioChannelCount: 1,
        enableAutomaticPunctuation: true,
      );

      try {
        final response = await _speechToText.recognize(config, convertedBytes);
        final transcript = response.results
            .map((result) => result.alternatives.first.transcript)
            .join('\n');
        onResult(transcript);
      } catch (e) {
        print('Error in speech recognition: $e');
        onResult('Error: $e');
      } finally {
        _isListening = false;
        await File(audioPath).delete(); // Cleanup
      }
    }
  }

  @override
  Future<void> stop() async {
    if (_isListening) {
      await recorder.stop();
      _recordingCompleter?.complete();
    }
  }
}

Future<Uint8List> _convertAudio(File inputFile) async {
  final tempDir = await Directory.systemTemp.createTemp();
  final outputPath = '${tempDir.path}/converted.wav';
  
  // Use FFmpeg for conversion (ensure FFmpeg is available in PATH)
  final process = await Process.run('ffmpeg', [
    '-i', inputFile.path,
    '-ar', '16000',
    '-ac', '1',
    '-acodec', 'pcm_s16le',
    '-y',
    outputPath
  ]);

  if (process.exitCode != 0) {
    throw Exception('FFmpeg conversion failed: ${process.stderr}');
  }

  final convertedFile = File(outputPath);
  final bytes = await convertedFile.readAsBytes();
  
  // Cleanup
  await convertedFile.delete();
  await tempDir.delete();
  
  return bytes;
}