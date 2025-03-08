import '../models/book_model.dart';

class HomeRepository {
  Future<List<BookModel>> getRecommendations() async {
    // Simulating an API call
    await Future.delayed(Duration(seconds: 1));
    return [
      BookModel(title: "Book A", author: "Author X"),
      BookModel(title: "Book B", author: "Author Y"),
    ];
  }

  Future<List<BookModel>> searchBooks(String query) async {
    // Simulating an API call
    await Future.delayed(Duration(seconds: 1));
    List<BookModel> allBooks = [
      BookModel(title: "Book A", author: "Author X"),
      BookModel(title: "Book B", author: "Author Y"),
      BookModel(title: "Learn Flutter", author: "Dev Guru"),
    ];
    return allBooks
        .where((book) => book.title.toLowerCase().contains(query.toLowerCase()))
        .toList();
  }
}
