import 'package:flutter/material.dart';
import '../../../../core/data/models/book_model.dart';

class BookCard extends StatelessWidget {
  final BookModel book;
  final VoidCallback onTap;

  const BookCard({required this.book, required this.onTap, Key? key})
    : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      child: ListTile(
        leading:
            book.coverUrl.isNotEmpty
                ? Image.network(
                  book.coverUrl,
                  width: 50,
                  height: 75,
                  fit: BoxFit.cover,
                  errorBuilder:
                      (context, error, stackTrace) => const Icon(Icons.book),
                )
                : const Icon(Icons.book, size: 50),
        title: Text(
          book.title,
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Text('by ${book.author} • ${book.totalChapters} chapters'),
        onTap: onTap,
      ),
    );
  }
}
