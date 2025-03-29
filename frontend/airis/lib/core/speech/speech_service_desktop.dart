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

      final audioPath = 'audio.wav';
      await recorder.start(
        path: audioPath,
        encoder: AudioEncoder.wav, // Ensure PCM WAV format
        bitRate: 128000,
        samplingRate: 16000,
      );

      await Future.delayed(Duration(seconds: 5));

      await recorder.stop();
      print('Recording stopped, sending to Google Speech-to-Text.');

      final audioBytes = await File(audioPath).readAsBytes();

      final config = RecognitionConfig(
        encoding: AudioEncoding.LINEAR16,
        sampleRateHertz: 16000,
        languageCode: 'vi-VN', // vi-VN for Vietnamese
      );

	try {
		final response = await _speechToText.recognize(config, audioBytes);
		print('Response: $response');
	} catch (e) {
		print('Error in speech recognition: $e');
		onResult('Error: $e'); 
	}
    }
  }

  @override
  void stop() {
    _isListening = false;
    print('Speech recognition stopped.');
  }
}
