import 'package:flutter/material.dart';
import '../../../../core/data/models/book_model.dart';
import '../../data/repositories/reader_repository.dart';

class ReaderScreen extends StatefulWidget {
  final String bookId;

  const ReaderScreen({Key? key, required this.bookId}) : super(key: key);

  @override
  State<ReaderScreen> createState() => _ReaderScreenState();
}

class _ReaderScreenState extends State<ReaderScreen> {
  late Future<BookModel?> _bookFuture;
  final ReaderRepository _repository = ReaderRepository();
  int _currentChapter = 0;
  double _fontSize = 16.0;

  @override
  void initState() {
    super.initState();
    _bookFuture = _repository.getBookForReader(widget.bookId);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Book Reader')),
      body: FutureBuilder<BookModel?>(
        future: _bookFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          }
          if (!snapshot.hasData ||
              snapshot.data!.content == null ||
              snapshot.data!.content!.isEmpty) {
            return const Center(child: Text('No content available'));
          }

          final book = snapshot.data!;
          return _buildReaderContent(book);
        },
      ),
    );
  }

  Widget _buildReaderContent(BookModel book) {
    return Column(
      children: [
        _buildBookHeader(book),
        Expanded(child: _buildChapterContent(book)),
        _buildControls(book),
      ],
    );
  }

  /// Book details section
  Widget _buildBookHeader(BookModel book) {
    return Container(
      padding: const EdgeInsets.all(16),
      color: Colors.grey[100],
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            book.title,
            style: Theme.of(
              context,
            ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 4),
          Text(
            'by ${book.author}',
            style: Theme.of(
              context,
            ).textTheme.titleMedium?.copyWith(color: Colors.grey[600]),
          ),
          const SizedBox(height: 8),
          Text(
            'Chapter ${_currentChapter + 1} of ${book.totalChapters}',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
        ],
      ),
    );
  }

  /// Chapter content section
  Widget _buildChapterContent(BookModel book) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Text(
        book.content![_currentChapter],
        style: Theme.of(
          context,
        ).textTheme.bodyLarge?.copyWith(fontSize: _fontSize, height: 1.5),
      ),
    );
  }

  /// Bottom navigation controls (Next, Previous, Font Adjustments)
  Widget _buildControls(BookModel book) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      color: Colors.grey[100],
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Previous Chapter
          IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed:
                _currentChapter > 0
                    ? () => setState(() => _currentChapter--)
                    : null,
          ),
          // Font Size Adjustments
          Row(
            children: [
              IconButton(
                icon: const Icon(Icons.text_decrease),
                onPressed:
                    _fontSize > 12
                        ? () => setState(() => _fontSize -= 2)
                        : null,
              ),
              Text('${_fontSize.toInt()}'),
              IconButton(
                icon: const Icon(Icons.text_increase),
                onPressed:
                    _fontSize < 24
                        ? () => setState(() => _fontSize += 2)
                        : null,
              ),
            ],
          ),
          // Next Chapter
          IconButton(
            icon: const Icon(Icons.arrow_forward),
            onPressed:
                _currentChapter < book.totalChapters - 1
                    ? () => setState(() => _currentChapter++)
                    : null,
          ),
        ],
      ),
    );
  }
}
