import 'package:flutter/material.dart';
import '../../../../core/data/models/book_model.dart';
import '../../data/repositories/reader_repository.dart';

// Reader Screen Widget
class ReaderScreen extends StatefulWidget {
  final String bookId;

  const ReaderScreen({Key? key, required this.bookId}) : super(key: key);

  @override
  State<ReaderScreen> createState() => _ReaderScreenState();
}

class _ReaderScreenState extends State<ReaderScreen> {
  late Future<Book> _bookFuture;
  final ReaderRepository _repository = ReaderRepository();
  int _currentChapter = 0;

  @override
  void initState() {
    super.initState();
    _bookFuture = _repository.getBookForReader(widget.bookId);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Book Reader'), elevation: 0),
      body: FutureBuilder<Book>(
        future: _bookFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          }
          if (!snapshot.hasData || snapshot.data!.content == null) {
            return const Center(child: Text('No content available'));
          }

          final book = snapshot.data!;
          return _buildReaderContent(book);
        },
      ),
    );
  }

  Widget _buildReaderContent(Book book) {
    return Column(
      children: [
        // Book Header
        Container(
          padding: const EdgeInsets.all(16),
          color: Colors.grey[100],
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                book.title,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
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
        ),
        // Chapter Content
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Text(
              book.content![_currentChapter],
              style: Theme.of(
                context,
              ).textTheme.bodyLarge?.copyWith(height: 1.5),
            ),
          ),
        ),
        // Navigation Buttons
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          color: Colors.grey[100],
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              ElevatedButton(
                onPressed:
                    _currentChapter > 0
                        ? () => setState(() => _currentChapter--)
                        : null,
                child: const Text('Previous'),
              ),
              ElevatedButton(
                onPressed:
                    _currentChapter < book.totalChapters - 1
                        ? () => setState(() => _currentChapter++)
                        : null,
                child: const Text('Next'),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
