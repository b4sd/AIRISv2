import 'package:flutter/material.dart';
import '../widgets/book_card.dart';
import '../widgets/search_bar.dart';
import '../../data/repositories/home_repository.dart';
import '../../data/models/book_model.dart';

class HomeScreen extends StatefulWidget {
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
    _fetchRecommendations();
  }

  void _fetchRecommendations() async {
    final results = await _repository.getRecommendations();
    setState(() => books = results);
  }

  void _onSearch(String query) async {
    if (query.isEmpty) {
      _fetchRecommendations();
      setState(() => isSearching = false);
    } else {
      final results = await _repository.searchBooks(query);
      setState(() {
        books = results;
        isSearching = true;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text("Book App")),
      body: Column(
        children: [
          MySearchBar(onSearch: _onSearch), // 🔍 Search Input Field
          Expanded(
            child:
                books.isEmpty
                    ? Center(child: Text("No books found"))
                    : ListView.builder(
                      itemCount: books.length,
                      itemBuilder: (context, index) {
                        return BookCard(book: books[index]); // 📖 Show books
                      },
                    ),
          ),
        ],
      ),
    );
  }
}
