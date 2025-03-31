import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class PageNavigationBar extends StatelessWidget {
  final int currentChapter;
  final int totalChapters;
  final Function(int) onPageChange;

  const PageNavigationBar({
    Key? key,
    required this.currentChapter,
    required this.totalChapters,
    required this.onPageChange,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          'Trang: $currentChapter / $totalChapters',
          style: GoogleFonts.notoSerif(fontSize: 18),
        ),
        Slider(
          value: currentChapter.toDouble(),
          min: 1,
          max: totalChapters.toDouble(),
          divisions: totalChapters - 1,
          label: currentChapter.toString(),
          onChanged: (value) {
            onPageChange(value.toInt());
          },
        ),
      ],
    );
  }
}
