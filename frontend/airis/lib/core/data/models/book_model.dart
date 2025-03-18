import 'dart:convert';

class BookModel {
  final String bookId;
  final String title;
  final String author;
  final String language;
  final String coverUrl;
  final int totalChapters;
  final List<String>? content; // Optional, only loaded in reader

  BookModel({
    required this.bookId,
    required this.title,
    required this.author,
    required this.language,
    required this.coverUrl,
    required this.totalChapters,
    this.content, // Nullable because home doesn't need it
  });

  /// Convert Firestore document to BookModel
  factory BookModel.fromFirestore(Map<String, dynamic> json, String docId) {
    return BookModel(
      bookId: docId, // Firestore document ID as bookId
      title: json['title'] as String,
      author: json['author'] as String,
      language: json['language'] as String,
      coverUrl: json['cover_url'] as String,
      totalChapters: json['total_chapters'] as int,
      content: (json['content'] as List?)?.map((e) => e as String).toList(),
    );
  }

  /// Convert Firestore document to metadata only (used in Home)
  factory BookModel.fromMetadata(Map<String, dynamic> json, String docId) {
    return BookModel(
      bookId: docId,
      title: json['title'] as String,
      author: json['author'] as String,
      language: json['language'] as String,
      coverUrl: json['cover_url'] as String,
      totalChapters: json['total_chapters'] as int,
      content: null, // Metadata doesn't need content
    );
  }

  /// Convert BookModel to Firestore JSON format
  Map<String, dynamic> toFirestore() {
    return {
      'title': title,
      'author': author,
      'language': language,
      'cover_url': coverUrl,
      'total_chapters': totalChapters,
      'content': content,
    };
  }

  /// Convert to JSON String (for local storage if needed)
  String toJsonString() => json.encode(toFirestore());
}
