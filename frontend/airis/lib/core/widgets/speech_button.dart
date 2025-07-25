import 'package:flutter/material.dart';
import '../speech/speech_service_impl.dart';
import '../speech/speech_service.dart';

class SpeechButton extends StatefulWidget {
  final Function(String)? onResult;
  const SpeechButton({Key? key, this.onResult}) : super(key: key);

  @override
  _SpeechButtonState createState() => _SpeechButtonState();
}

class _SpeechButtonState extends State<SpeechButton> {
  late final SpeechService _speechService;
  bool _isListening = false;
  String _recognizedText = '';

  @override
  void initState() {
    super.initState();
    _speechService = getSpeechService();
  }

  void _toggleListening() async {
    if (!_isListening) {
      bool available = await _speechService.initialize();
      if (available) {
        setState(() => _isListening = true);
        _speechService.listen(onResult: (result) {
          setState(() {
            _recognizedText = result;
          });
          if (widget.onResult != null) {
            widget.onResult!(result);
          }
        });
      }
    } else {
      setState(() => _isListening = false);
      _speechService.stop();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          _recognizedText.isEmpty ? 'No speech recognized yet.' : _recognizedText,
          style: const TextStyle(fontSize: 16.0),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 10),
        FloatingActionButton(
          onPressed: _toggleListening,
          child: Icon(_isListening ? Icons.mic : Icons.mic_none),
        ),
      ],
    );
  }
}
