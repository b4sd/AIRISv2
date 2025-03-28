import 'dart:math';
import '../models/book_page_model.dart';
import '../../../../services/firestore_service.dart';

class ReaderRepository {
  final FirestoreService _firestoreService = FirestoreService();

  /// ✅ Fetches a single page's content for the Reader Screen
  Future<BookPageModel?> getPageContent(String bookId, int chapterIndex) async {
    print(bookId);
    final data = await _firestoreService.getDocument(
      'books/$bookId/pages/page$chapterIndex',
    );
    print('books/$bookId/pages/page$chapterIndex');
    print(data);
    if (data == null) return null;

    return BookPageModel(text: data['text'] ?? '');
  }

  /// ✅ Get a random book page for testing
  Future<BookPageModel?> getRandomBookPage(String bookId) async {
    final pages = await _firestoreService.getCollection('books/$bookId/pages');
    if (pages.isEmpty) return null;

    final randomPage = pages[Random().nextInt(pages.length)];
    return BookPageModel(text: randomPage['text'] ?? '');
  }
}
