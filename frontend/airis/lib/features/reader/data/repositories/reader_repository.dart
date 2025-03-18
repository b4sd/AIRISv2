import 'package:cloud_firestore/cloud_firestore.dart';
import '../../../../core/data/models/book_model.dart';
import 'dart:math';

class ReaderRepository {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  /// Fetch a single book with full content
  Future<BookModel?> getBookForReader(String bookId) async {
    try {
      DocumentSnapshot doc =
          await _firestore.collection('books').doc(bookId).get();

      if (doc.exists) {
        return BookModel.fromFirestore(
          doc.data() as Map<String, dynamic>,
          doc.id,
        );
      }
      return null;
    } catch (e) {
      print("Error fetching book: $e");
      return null;
    }
  }

  /// Fetch list of books with metadata only (for home screen)
  Future<List<BookModel>> getBookList() async {
    try {
      QuerySnapshot snapshot = await _firestore.collection('books').get();
      return snapshot.docs.map((doc) {
        return BookModel.fromMetadata(
          doc.data() as Map<String, dynamic>,
          doc.id,
        );
      }).toList();
    } catch (e) {
      print("Error fetching book list: $e");
      return [];
    }
  }

  /// Fetch a random book
  Future<BookModel?> getRandomBook() async {
    try {
      QuerySnapshot snapshot = await _firestore.collection('books').get();
      if (snapshot.docs.isNotEmpty) {
        final doc = snapshot.docs[Random().nextInt(snapshot.docs.length)];
        return BookModel.fromFirestore(
          doc.data() as Map<String, dynamic>,
          doc.id,
        );
      }
      return null;
    } catch (e) {
      print("Error fetching random book: $e");
      return null;
    }
  }
}
