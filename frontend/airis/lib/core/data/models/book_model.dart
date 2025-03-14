import 'dart:convert';

class Book {
  final String bookId;
  final String title;
  final String author;
  final String language;
  final String coverUrl;
  final int totalChapters;
  final List<String>? content; // Optional, only loaded in reader

  Book({
    required this.bookId,
    required this.title,
    required this.author,
    required this.language,
    required this.coverUrl,
    required this.totalChapters,
    this.content, // Nullable because home doesn't need it
  });

  /// Convert Firestore JSON to Book object
  factory Book.fromJson(Map<String, dynamic> json) {
    return Book(
      bookId: json['book_id'] as String,
      title: json['title'] as String,
      author: json['author'] as String,
      language: json['language'] as String,
      coverUrl: json['cover_url'] as String,
      totalChapters: json['total_chapters'] as int,
      content: (json['content'] as List?)?.map((e) => e as String).toList(),
    );
  }

  /// Convert Firestore JSON to only metadata (used in Home)
  factory Book.fromMetadata(Map<String, dynamic> json) {
    return Book(
      bookId: json['book_id'] as String,
      title: json['title'] as String,
      author: json['author'] as String,
      language: json['language'] as String,
      coverUrl: json['cover_url'] as String,
      totalChapters: json['total_chapters'] as int,
      content: null, // Metadata doesn't need content
    );
  }

  /// Convert Book object to JSON (for saving to Firestore)
  Map<String, dynamic> toJson() {
    return {
      'book_id': bookId,
      'title': title,
      'author': author,
      'language': language,
      'cover_url': coverUrl,
      'total_chapters': totalChapters,
      'content': content,
    };
  }

  /// Convert to JSON String (for local storage if needed)
  String toJsonString() => json.encode(toJson());
}
