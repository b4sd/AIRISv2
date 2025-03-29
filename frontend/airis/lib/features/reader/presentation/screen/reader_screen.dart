import 'package:flutter/material.dart';
import '../../data/models/book_page_model.dart';
import '../../data/repositories/reader_repository.dart';

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

    _pageFuture = _repository.getPageContent(
      widget.bookId,
      _currentChapter,
    ); // ✅ Initialize immediately
  }

  void _loadChapter() {
    if (_currentChapter <= 1 || _currentChapter > widget.totalChapters) return;

    setState(() {
      _pageFuture = _repository.getPageContent(widget.bookId, _currentChapter);
    });
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
            return Center(child: Text('Error: ${snapshot.error}'));
          }
          if (!snapshot.hasData || snapshot.data!.text.isEmpty) {
            return const Center(child: Text('No content available'));
          }

          final page = snapshot.data!;
          return _buildReaderContent(page.text);
        },
      ),
    );
  }

  Widget _buildReaderContent(String content) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          color: Colors.grey[100],
          child: Text(
            'Chapter ${_currentChapter} of ${widget.totalChapters}',
            style: Theme.of(context).textTheme.titleMedium,
          ),
        ),
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Text(
              content,
              style: Theme.of(
                context,
              ).textTheme.bodyLarge?.copyWith(height: 1.5),
            ),
          ),
        ),
        _buildNavigationButtons(),
      ],
    );
  }

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
                        ); // ✅ Update correctly
                      });
                    }
                    : null,
            child: const Text('Previous'),
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
                        ); // ✅ Update correctly
                      });
                    }
                    : null,
            child: const Text('Next'),
          ),
        ],
      ),
    );
  }
}
