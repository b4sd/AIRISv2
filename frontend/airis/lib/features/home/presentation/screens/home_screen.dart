import 'package:flutter/material.dart';
import '../widgets/book_card.dart';
import '../widgets/search_bar.dart';
import '../../data/repositories/home_repository.dart';
import '../../../../core/data/models/book_model.dart';
import '../../../reader/presentation/screen/reader_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  _HomeScreenState createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final HomeRepository _repository = HomeRepository();
  List<BookModel> books = [];
  bool isSearching = false;

  @override
  void initState() {
    super.initState();
    _fetchBooks();
  }

  void _fetchBooks() async {
    final results = await _repository.getRecommendations();
    setState(() => books = results);
  }

  void _onSearch(String query) async {
    if (query.isEmpty) {
      _fetchBooks();
      setState(() => isSearching = false);
    } else {
      final allBooks = await _repository.getRecommendations();
      final results =
          allBooks
              .where(
                (book) =>
                    book.title.toLowerCase().contains(query.toLowerCase()) ||
                    book.author.toLowerCase().contains(query.toLowerCase()),
              )
              .toList();
      setState(() {
        books = results;
        isSearching = true;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Book App")),
      body: Column(
        children: [
          BookSearchBar(onSearch: _onSearch),
          Expanded(
            child:
                books.isEmpty
                    ? const Center(child: Text("No books found"))
                    : ListView.builder(
                      itemCount: books.length,
                      itemBuilder: (context, index) {
                        return BookCard(
                          book: books[index],
                          onTap: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(
                                builder:
                                    (context) => ReaderScreen(
                                      bookId: books[index].bookId,
                                    ),
                              ),
                            );
                          },
                        );
                      },
                    ),
          ),
        ],
      ),
    );
  }
}
