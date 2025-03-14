import '../../../../core/data/models/book_model.dart';

// List of dummy book titles and authors
final List<Map<String, String>> _bookMetadata = [
  {
    'title': 'Whispers of the Forest',
    'author': 'Elara Stone',
    'language': 'English',
    'coverUrl': 'https://example.com/covers/forest.jpg',
  },
  {
    'title': 'Shadows of Time',
    'author': 'Kael Draven',
    'language': 'English',
    'coverUrl': 'https://example.com/covers/shadows.jpg',
  },
  {
    'title': 'The Lost Kingdom',
    'author': 'Mira Vale',
    'language': 'English',
    'coverUrl': 'https://example.com/covers/kingdom.jpg',
  },
];

class HomeRepository {
  Future<List<BookModel>> getRecommendations() async {
    // Simulating an API call
    await Future.delayed(Duration(seconds: 1));
    return _bookMetadata.map((metadata) {
      return BookModel.fromMetadata({
        'book_id': 'book_${metadata['title']!.hashCode}',
        'title': metadata['title']!,
        'author': metadata['author']!,
        'language': metadata['language']!,
        'cover_url': metadata['coverUrl']!,
        'total_chapters': 10,
      });
    }).toList();
  }

  Future<List<BookModel>> searchBooks(String query) async {
    // Simulating an API call
    await Future.delayed(Duration(seconds: 1));
    final allBooks = await getRecommendations();
    return allBooks
        .where((book) => book.title.toLowerCase().contains(query.toLowerCase()))
        .toList();
  }
}
