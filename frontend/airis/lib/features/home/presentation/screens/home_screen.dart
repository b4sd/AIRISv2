import 'package:flutter/material.dart';
import '../widgets/book_card.dart';
import '../widgets/search_bar.dart';
import '../../data/repositories/home_repository.dart';
import '../../data/models/book_model.dart';
import '../../../reader/presentation/screen/reader_screen.dart';
import '../../../../core/data/models/book_model.dart';
import '../../../reader/data/repositories/reader_repository.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  _HomeScreenState createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final ReaderRepository _repository = ReaderRepository();
  List<Book> books = [];
  bool isSearching = false;

  @override
  void initState() {
    super.initState();
    _fetchBooks();
  }

  void _fetchBooks() async {
    final results = await _repository.getBookList();
    setState(() => books = results);
  }

  void _onSearch(String query) async {
    if (query.isEmpty) {
      _fetchBooks();
      setState(() => isSearching = false);
    } else {
      // For this example, we'll filter locally since we have dummy data
      // In a real app, you might want to add a search method to the repository
      final allBooks = await _repository.getBookList();
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

  void _openReaderScreen(String bookId) {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => ReaderScreen(bookId: bookId)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Book App")),
      body: Column(
        children: [
          Padding(padding: const EdgeInsets.all(8.0), child: _buildSearchBar()),
          Expanded(
            child:
                books.isEmpty
                    ? const Center(child: Text("No books found"))
                    : ListView.builder(
                      itemCount: books.length,
                      itemBuilder: (context, index) {
                        return _buildBookCard(books[index]);
                      },
                    ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    return TextField(
      onChanged: _onSearch,
      decoration: InputDecoration(
        hintText: 'Search books...',
        prefixIcon: const Icon(Icons.search),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
        filled: true,
        fillColor: Colors.grey[200],
      ),
    );
  }

  Widget _buildBookCard(Book book) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      child: ListTile(
        leading:
            book.coverUrl.isNotEmpty
                ? Image.network(
                  book.coverUrl,
                  width: 50,
                  height: 75,
                  fit: BoxFit.cover,
                  errorBuilder:
                      (context, error, stackTrace) => const Icon(Icons.book),
                )
                : const Icon(Icons.book, size: 50),
        title: Text(
          book.title,
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Text('by ${book.author} • ${book.totalChapters} chapters'),
        onTap: () => _openReaderScreen(book.bookId),
      ),
    );
  }
}
