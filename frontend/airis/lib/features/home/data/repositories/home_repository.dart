import 'package:cloud_firestore/cloud_firestore.dart';
import '../../../../core/data/models/book_model.dart';

class HomeRepository {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  /// Fetch recommended books (metadata only)
  Future<List<BookModel>> getRecommendations() async {
    try {
      QuerySnapshot snapshot =
          await _firestore.collection('books').limit(10).get();
      return snapshot.docs.map((doc) {
        return BookModel.fromMetadata(
          doc.data() as Map<String, dynamic>,
          doc.id,
        );
      }).toList();
    } catch (e) {
      print("Error fetching recommendations: $e");
      return [];
    }
  }

  /// Search books based on query
  Future<List<BookModel>> searchBooks(String query) async {
    try {
      QuerySnapshot snapshot = await _firestore.collection('books').get();
      final allBooks =
          snapshot.docs.map((doc) {
            return BookModel.fromMetadata(
              doc.data() as Map<String, dynamic>,
              doc.id,
            );
          }).toList();

      return allBooks
          .where(
            (book) => book.title.toLowerCase().contains(query.toLowerCase()),
          )
          .toList();
    } catch (e) {
      print("Error searching books: $e");
      return [];
    }
  }
}
