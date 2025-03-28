import '../models/book_model.dart';
import '../../../../services/firestore_service.dart';

class HomeRepository {
  final FirestoreService _firestoreService = FirestoreService();

  Future<List<BookModel>> getRecommendations() async {
    List<Map<String, dynamic>> booksData = await _firestoreService
        .getCollection("books");

    return booksData
        .map(
          (data) => BookModel(
            title: data["title"] ?? "Unknown Title",
            author: data["author"] ?? "Unknown Author",
          ),
        )
        .toList();
  }

  Future<List<BookModel>> searchBooks(String query) async {
    List<Map<String, dynamic>> booksData = await _firestoreService
        .getCollection("books");

    return booksData
        .where(
          (data) =>
              data["title"] != null &&
              data["title"].toLowerCase().contains(query.toLowerCase()),
        )
        .map(
          (data) => BookModel(
            title: data["title"] ?? "Unknown Title",
            author: data["author"] ?? "Unknown Author",
          ),
        )
        .toList();
  }
}
