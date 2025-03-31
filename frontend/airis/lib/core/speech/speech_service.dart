abstract class SpeechService {
  /// Initialize the speech service.
  Future<bool> initialize();

  /// Start listening. The [onResult] callback returns the recognized text.
  void listen({required Function(String result) onResult});

  /// Stop listening.
  void stop();
}
