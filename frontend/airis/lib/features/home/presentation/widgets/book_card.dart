import 'package:flutter/material.dart';
import '../../data/models/book_model.dart';

class BookCard extends StatelessWidget {
  final BookModel book;

  BookCard({required this.book});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      title: Text(book.title, style: TextStyle(fontWeight: FontWeight.bold)),
      subtitle: Text(book.author),
      leading: Icon(Icons.book),
    );
  }
}
