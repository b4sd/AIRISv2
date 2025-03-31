import 'package:flutter/material.dart';
import '../../../../core/speech/speech_service.dart';
import '../../../../core/speech/speech_service_impl.dart';

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

  void _startListening() async {
    if (!_isListening) {
      bool available = await _speechService.initialize();
      if (available) {
        setState(() => _isListening = true);
        _speechService.listen(onResult: (result) {
          setState(() => _recognizedText = result);
          widget.onResult?.call(result);
        });
      }
    }
  }

  void _stopListening() {
    if (_isListening) {
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
        GestureDetector(
          onTapDown: (_) => _startListening(),
          onTapUp: (_) => _stopListening(),
          onTapCancel: () => _stopListening(),
          child: FloatingActionButton(
            onPressed: null, // Disable default tap
            child: Icon(_isListening ? Icons.mic : Icons.mic_none),
          ),
        ),
      ],
    );
  }
}