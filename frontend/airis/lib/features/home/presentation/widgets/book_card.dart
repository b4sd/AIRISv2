import 'package:flutter/material.dart';
import '../../data/models/book_metadata_model.dart';

class BookCard extends StatelessWidget {
  final BookMetadataModel book;
  final VoidCallback onTap; // ✅ Accept onTap callback

  const BookCard({Key? key, required this.book, required this.onTap})
    : super(key: key);

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap, // ✅ Use the passed onTap function
      child: Card(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(book.title, style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 4),
              Text(
                "by ${book.author}",
                style: Theme.of(
                  context,
                ).textTheme.bodyMedium?.copyWith(color: Colors.grey[600]),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
