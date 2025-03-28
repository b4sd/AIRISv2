import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/book_metadata_model.dart';

class HomeRepository {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  Future<List<BookMetadataModel>> getRecommendations() async {
    QuerySnapshot snapshot =
        await _firestore.collection('book').get(); // Fetch books

    return snapshot.docs.map((doc) {
      return BookMetadataModel.fromFirestore(
        doc.id,
        doc.data() as Map<String, dynamic>,
      );
    }).toList();
  }

  Future<List<BookMetadataModel>> searchBooks(String query) async {
    QuerySnapshot snapshot =
        await _firestore
            .collection('book')
            .where('title', isGreaterThanOrEqualTo: query)
            .where('title', isLessThanOrEqualTo: '$query\uf8ff')
            .get();

    return snapshot.docs.map((doc) {
      return BookMetadataModel.fromFirestore(
        doc.id,
        doc.data() as Map<String, dynamic>,
      );
    }).toList();
  }
}
