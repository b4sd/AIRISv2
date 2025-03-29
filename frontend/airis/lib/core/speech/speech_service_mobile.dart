import 'package:speech_to_text/speech_to_text.dart' as stt;
import 'speech_service.dart';

class SpeechServiceMobile implements SpeechService {
  late stt.SpeechToText _speech;
  bool _isInitialized = false;

  SpeechServiceMobile() {
    _speech = stt.SpeechToText();
  }

  @override
  Future<bool> initialize() async {
    _isInitialized = await _speech.initialize(
      onStatus: (status) => print('Mobile speech status: $status'),
      onError: (error) => print('Mobile speech error: $error'),
    );
    return _isInitialized;
  }

  @override
  void listen({required Function(String result) onResult}) {
    if (_isInitialized) {
      _speech.listen(
        localeId: 'vi_VN', // Vietnamese locale
        onResult: (result) {
          onResult(result.recognizedWords);
        },
      );
    }
  }

  @override
  void stop() {
    _speech.stop();
  }
}
