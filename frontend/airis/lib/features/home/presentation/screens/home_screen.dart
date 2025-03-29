import 'package:flutter/material.dart';
import '../widgets/book_card.dart';
import '../widgets/search_bar.dart';
import '../../data/repositories/home_repository.dart';
import '../../data/models/book_metadata_model.dart';
import '../../../reader/presentation/screens/reader_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  _HomeScreenState createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final HomeRepository _repository = HomeRepository();
  late Future<List<BookMetadataModel>> _booksFuture;
  bool isSearching = false;

  @override
  void initState() {
    super.initState();
    _booksFuture = _fetchRecommendations();
  }

  Future<List<BookMetadataModel>> _fetchRecommendations() async {
    return await _repository.getRecommendations();
  }

  void _onSearch(String query) async {
    if (query.isEmpty) {
      setState(() {
        isSearching = false;
        _booksFuture = _fetchRecommendations();
      });
    } else {
      setState(() {
        isSearching = true;
        _booksFuture = _repository.searchBooks(query);
      });
    }
  }

  void _navigateToReader(BookMetadataModel book) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder:
            (context) => ReaderScreen(
              bookId: book.id,
              totalChapters: book.totalChapters,
            ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Book App")),
      body: Column(
        children: [
          MySearchBar(onSearch: _onSearch),
          Expanded(
            child: FutureBuilder<List<BookMetadataModel>>(
              future: _booksFuture,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return Center(
                    child: CircularProgressIndicator(),
                  ); // Loading state
                } else if (snapshot.hasError) {
                  return Center(child: Text("Error: ${snapshot.error}"));
                } else if (!snapshot.hasData || snapshot.data!.isEmpty) {
                  return Center(child: Text("No books found"));
                }

                final books = snapshot.data!;
                return ListView.builder(
                  itemCount: books.length,
                  itemBuilder: (context, index) {
                    return BookCard(
                      book: books[index],
                      onTap: () => _navigateToReader(books[index]),
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
