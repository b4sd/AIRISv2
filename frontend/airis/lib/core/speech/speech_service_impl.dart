import 'dart:io';
import 'speech_service.dart';
import 'package:flutter/foundation.dart';
import 'speech_service_mobile.dart';
import 'speech_service_desktop.dart';

SpeechService getSpeechService() {
  // For simplicity, we assume Windows as the only desktop target.
  if (Platform.isWindows) {
    // output for debugging
    debugPrint("Using Windows Speech Service");
    return SpeechServiceDesktop();
  } else {
    debugPrint("Using Mobile Speech Service");
    return SpeechServiceMobile();
  }
}
