import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../data/models/book_page_model.dart';
import '../../data/repositories/reader_repository.dart';
import '../widgets/page_navbar.dart';

class ReaderScreen extends StatefulWidget {
  final String bookId;
  final int totalChapters;

  const ReaderScreen({
    Key? key,
    required this.bookId,
    required this.totalChapters,
  }) : super(key: key);

  @override
  State<ReaderScreen> createState() => _ReaderScreenState();
}

class _ReaderScreenState extends State<ReaderScreen> {
  final ReaderRepository _repository = ReaderRepository();
  late Future<BookPageModel?> _pageFuture;
  int _currentChapter = 1;

  @override
  void initState() {
    super.initState();
    _pageFuture = _repository.getPageContent(widget.bookId, _currentChapter);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Book Reader'), elevation: 0),
      body: FutureBuilder<BookPageModel?>(
        future: _pageFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(
              child: Text('Lỗi: ${snapshot.error}'),
            ); // Vietnamese error message
          }
          if (!snapshot.hasData || snapshot.data!.text.isEmpty) {
            return const Center(child: Text('Không có nội dung sẵn có'));
          }

          final page = snapshot.data!;
          return _buildReaderContent(page.text);
        },
      ),
    );
  }

  Widget _buildReaderContent(String content) {
    final ScrollController scrollController = ScrollController();

    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          color: Colors.grey[100],
          child: Text(
            'Trang $_currentChapter / ${widget.totalChapters}',
            style: GoogleFonts.notoSerif(
              fontSize: 20,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        Expanded(
          child: Scrollbar(
            thumbVisibility: false, // Hide the scrollbar thumb
            trackVisibility: false, // Hide the track as well
            controller: scrollController,
            child: SingleChildScrollView(
              controller: scrollController,
              padding: const EdgeInsets.all(16),
              child: Text(
                content,
                style: GoogleFonts.notoSerif(fontSize: 16, height: 1.5),
              ),
            ),
          ),
        ),
        _buildNavigationButtons(),
        PageNavigationBar(
          currentChapter: _currentChapter,
          totalChapters: widget.totalChapters,
          onPageChange: (pageNumber) {
            setState(() {
              _currentChapter = pageNumber;
              _pageFuture = _repository.getPageContent(
                widget.bookId,
                _currentChapter,
              );
            });
          },
        ),
      ],
    );
  }

  // Navigation buttons (previous and next)
  Widget _buildNavigationButtons() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      color: Colors.grey[100],
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          ElevatedButton(
            onPressed:
                _currentChapter > 1
                    ? () {
                      setState(() {
                        _currentChapter--;
                        _pageFuture = _repository.getPageContent(
                          widget.bookId,
                          _currentChapter,
                        );
                      });
                    }
                    : null,
            child: const Text('Trước'),
          ),
          ElevatedButton(
            onPressed:
                _currentChapter < widget.totalChapters
                    ? () {
                      setState(() {
                        _currentChapter++;
                        _pageFuture = _repository.getPageContent(
                          widget.bookId,
                          _currentChapter,
                        );
                      });
                    }
                    : null,
            child: const Text('Tiếp theo'),
          ),
        ],
      ),
    );
  }
}
