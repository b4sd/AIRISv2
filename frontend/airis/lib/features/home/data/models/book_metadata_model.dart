class BookMetadataModel {
  final String id; // ✅ Firestore document ID
  final String title;
  final String author;
  final int totalChapters;

  BookMetadataModel({
    required this.id,
    required this.title,
    required this.author,
    required this.totalChapters,
  });

  factory BookMetadataModel.fromFirestore(
    String docId,
    Map<String, dynamic> data,
  ) {
    return BookMetadataModel(
      id: docId, // ✅ Store Firestore document ID
      title: data['title'] ?? '',
      author: data['author'] ?? '',
      totalChapters: data['page'] ?? 0,
    );
  }
}
