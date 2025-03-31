import 'package:flutter/material.dart';
import 'package:just_audio/just_audio.dart';
import 'package:audio_video_progress_bar/audio_video_progress_bar.dart';

class AudioPlaybar extends StatefulWidget {
  final List<String> audioUrls; // List of system-chosen audio files

  const AudioPlaybar({Key? key, required this.audioUrls}) : super(key: key);

  @override
  _AudioPlaybarState createState() => _AudioPlaybarState();
}

class _AudioPlaybarState extends State<AudioPlaybar> {
  final AudioPlayer _player = AudioPlayer();
  int _currentIndex = 0; // Tracks current audio file index

  @override
  void initState() {
    super.initState();
    _loadAudio();
  }

  /// Load and play the current audio file
  Future<void> _loadAudio() async {
    await _player.setUrl(widget.audioUrls[_currentIndex]);
    _player.play(); // Auto-play when new audio is set
  }

  /// Change to the next audio file in the list
  void _changeAudio() {
    setState(() {
      _currentIndex = (_currentIndex + 1) % widget.audioUrls.length; // Loop through list
    });
    _loadAudio();
  }

  @override
  void dispose() {
    _player.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.grey[900],
        borderRadius: BorderRadius.circular(15),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Progress Bar
          StreamBuilder<Duration>(
            stream: _player.positionStream,
            builder: (context, snapshot) {
              final position = snapshot.data ?? Duration.zero;
              final total = _player.duration ?? Duration.zero;

              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 10),
                child: ProgressBar(
                  progress: position,
                  total: total,
                  onSeek: (duration) => _player.seek(duration),
                  barHeight: 5.0,
                  thumbRadius: 7.0,
                  baseBarColor: Colors.grey,
                  progressBarColor: Colors.blueAccent,
                  thumbColor: Colors.blueAccent,
                ),
              );
            },
          ),

          SizedBox(height: 10),

          // Controls
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              IconButton(
                icon: Icon(Icons.replay_10, color: Colors.white),
                onPressed: () => _player.seek(_player.position - Duration(seconds: 10)),
              ),
              IconButton(
                icon: Icon(Icons.play_arrow, color: Colors.white),
                onPressed: () => _player.play(),
              ),
              IconButton(
                icon: Icon(Icons.pause, color: Colors.white),
                onPressed: () => _player.pause(),
              ),
              IconButton(
                icon: Icon(Icons.stop, color: Colors.white),
                onPressed: () => _player.stop(),
              ),
              IconButton(
                icon: Icon(Icons.forward_10, color: Colors.white),
                onPressed: () => _player.seek(_player.position + Duration(seconds: 10)),
              ),
              IconButton(
                icon: Icon(Icons.skip_next, color: Colors.white),
                onPressed: _changeAudio, // Change audio file
              ),
            ],
          ),
        ],
      ),
    );
  }
}
