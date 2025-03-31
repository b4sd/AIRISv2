import 'package:flutter/material.dart';
import 'package:just_audio/just_audio.dart';
import 'package:audio_video_progress_bar/audio_video_progress_bar.dart';

class PlayAudioBar extends StatefulWidget {
  final String audioUrl;

  const PlayAudioBar({Key? key, required this.audioUrl}) : super(key: key);

  @override
  _PlayAudioBarState createState() => _PlayAudioBarState();
}

class _PlayAudioBarState extends State<PlayAudioBar> {
  final AudioPlayer _player = AudioPlayer();

  @override
  void initState() {
    super.initState();
    _initAudio();
  }

  /// Loads the provided audio file
  Future<void> _initAudio() async {
    if (widget.audioUrl.isNotEmpty) {
      await _player.setUrl(widget.audioUrl);
    }
  }

  @override
  void dispose() {
    _player.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      color: Colors.grey[200],
      child: Column(
        children: [
          // Progress Bar
          StreamBuilder<Duration>(
            stream: _player.positionStream,
            builder: (context, snapshot) {
              final position = snapshot.data ?? Duration.zero;
              final total = _player.duration ?? Duration.zero;

              return ProgressBar(
                progress: position,
                total: total,
                onSeek: (duration) {
                  _player.seek(duration);
                },
              );
            },
          ),

          // Playback Controls
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              IconButton(
                icon: Icon(Icons.replay_10),
                onPressed: () => _player.seek(_player.position - Duration(seconds: 10)),
              ),
              IconButton(
                icon: Icon(Icons.play_arrow),
                onPressed: () => _player.play(),
              ),
              IconButton(
                icon: Icon(Icons.pause),
                onPressed: () => _player.pause(),
              ),
              IconButton(
                icon: Icon(Icons.stop),
                onPressed: () => _player.stop(),
              ),
              IconButton(
                icon: Icon(Icons.forward_10),
                onPressed: () => _player.seek(_player.position + Duration(seconds: 10)),
              ),
            ],
          ),
        ],
      ),
    );
  }
}