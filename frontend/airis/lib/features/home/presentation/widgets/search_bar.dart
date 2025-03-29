import 'package:flutter/material.dart';

class BookSearchBar extends StatelessWidget {
  final Function(String) onSearch;

  const BookSearchBar({required this.onSearch, super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.all(10.0),
      child: TextField(
        decoration: InputDecoration(
          hintText: "Search for books...",
          border: OutlineInputBorder(),
          prefixIcon: Icon(Icons.search),
        ),
        onChanged: onSearch,
      ),
    );
  }
}
