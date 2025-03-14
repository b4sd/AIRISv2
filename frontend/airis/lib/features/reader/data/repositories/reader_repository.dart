import 'dart:math';
import '../../../../core/data/models/book_model.dart';

class ReaderRepository {
  // Sample dummy content for testing
  final List<String> _dummyChapters = [
    '''Chapter 1 - The Beginning
The sun rose over the misty hills, casting golden rays across the sleepy village. Anna woke to the sound of birds chirping outside her window, their melodies weaving through the crisp morning air. Today was no ordinary day—it was the start of her journey.''',

    '''Chapter 2 - The Encounter
As Anna ventured into the forest, the trees whispered secrets of old. Suddenly, a figure emerged from the shadows—a mysterious traveler with eyes that held stories of distant lands. "You're not from here," he said, his voice low and curious.''',

    '''Chapter 3 - The Decision
The path split into two: one led to the safety of the village, the other into the unknown. Anna’s heart raced as she weighed her choices. The traveler watched silently, his presence both comforting and unsettling.''',
  ];

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

  /// Get a single book with full content for reader screen
  Future<BookModel> getBookForReader(String bookId) async {
    // Simulate network delay
    await Future.delayed(Duration(milliseconds: 500));

    final random = Random();
    final metadata = _bookMetadata[random.nextInt(_bookMetadata.length)];

    return BookModel(
      bookId: bookId,
      title: metadata['title']!,
      author: metadata['author']!,
      language: metadata['language']!,
      coverUrl: metadata['coverUrl']!,
      totalChapters: _dummyChapters.length,
      content: _dummyChapters, // Include full content for reader
    );
  }

  /// Get list of books with metadata only (for home screen)
  Future<List<BookModel>> getBookList() async {
    // Simulate network delay
    await Future.delayed(Duration(milliseconds: 300));

    return _bookMetadata.map((metadata) {
      return BookModel.fromMetadata({
        'book_id': 'book_${metadata['title']!.hashCode}',
        'title': metadata['title']!,
        'author': metadata['author']!,
        'language': metadata['language']!,
        'cover_url': metadata['coverUrl']!,
        'total_chapters': _dummyChapters.length,
      });
    }).toList();
  }

  /// Get a random book with content for testing
  Future<BookModel> getRandomBook() async {
    final random = Random();
    final metadata = _bookMetadata[random.nextInt(_bookMetadata.length)];

    return BookModel(
      bookId: 'book_${metadata['title']!.hashCode}',
      title: metadata['title']!,
      author: metadata['author']!,
      language: metadata['language']!,
      coverUrl: metadata['coverUrl']!,
      totalChapters: _dummyChapters.length,
      content: _dummyChapters,
    );
  }
}

// Example usage:
/*
void main() async {
  final repository = ReaderRepository();
  
  // Get a single book for reading
  final book = await repository.getBookForReader("book_123");
  print("Reading: ${book.title}");
  print("Chapter 1: ${book.content?[0].substring(0, 50)}...");

  // Get list of books for home screen
  final bookList = await repository.getBookList();
  print("Available books:");
  bookList.forEach((book) => print("- ${book.title} by ${book.author}"));
  
  // Get random book
  final randomBook = await repository.getRandomBook();
  print("Random pick: ${randomBook.title}");
}
*/
