import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'services/firestore_service.dart';
import 'firebase_options.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  runApp(BookApp());
}

class BookApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      home: BookScreen(),
    );
  }
}

class BookScreen extends StatefulWidget {
  @override
  _BookScreenState createState() => _BookScreenState();
}

class _BookScreenState extends State<BookScreen> {
  final FirestoreService firestoreService = FirestoreService();
  String? bookID;
  String? title;
  String? author;
  List<String>? pages;

  Future<void> addAndRetrieveBook() async {
    // String newBookID = await firestoreService.addBook(
    //   "Thanh Giong",
    //   "Duy",
    //   "",
    //   [
    //     "Page 1: Introduction...",
    //     "Page 2: Setup...",
    //     "Page 3: Widgets...",
    //   ],
    // );
    List<String> bookids = await firestoreService.getAllBookIDs();
    String newBookID = bookids[0];

    Map<String, dynamic>? fetchedBook = await firestoreService.getBookByID(newBookID);

    if (fetchedBook != null) {
      print("\n🎉 Book Retrieved Successfully!");
      print("Title: ${fetchedBook["title"]}");
      print("Author: ${fetchedBook["author"]}");
      print("Cover URL: ${fetchedBook["coverURL"]}");
      print("Pages:");
      for (var i = 0; i < fetchedBook["pages"].length; i++) {
        print("  📄 Page ${i + 1}: ${fetchedBook["pages"][i]}");
      }
      setState(() {
        bookID = newBookID;
        title = fetchedBook["title"];
        author = fetchedBook["author"];
        pages = List<String>.from(fetchedBook["pages"] ?? []);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text("Book Firestore Demo")),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            ElevatedButton(
              onPressed: addAndRetrieveBook,
              child: Text("Add & Retrieve Book"),
            ),
            if (bookID != null) ...[
              SizedBox(height: 20),
              Text("📖 Book ID: $bookID", style: TextStyle(fontWeight: FontWeight.bold)),
              Text("Title: $title"),
              Text("Author: $author"),
              Text("Pages:"),
              for (var page in pages ?? []) Text("📄 $page"),
            ],
          ],
        ),
      ),
    );
  }
}


// import 'package:flutter/material.dart';
// import 'package:provider/provider.dart';
// import 'features/home/presentation/screens/home_screen.dart';
// import 'features/home/data/repositories/home_repository.dart';
// import 'package:firebase_core/firebase_core.dart';
// import 'services/firestore_service.dart';
// import 'firebase_options.dart';
// import 'dart:io';

// Future<void> main() async {
//   await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
//   print("Firebase Initialized!");

//   // Sample book data
//   String title = "Thanh Giong";
//   String author = "Duy";
//   String coverUrl = "";

//   List<String> pages = [
//     "Page 1: Introduction to Flutter...",
//     "Page 2: Setting up your environment...",
//     "Page 3: Understanding widgets...",
//   ];

//   // Add book to Firestore
//   FirestoreService firestoreService = FirestoreService();
//   String bookID = await firestoreService.addBook(title, author, coverUrl, pages);
//   print("📖 Book added with ID: $bookID");

//   // Retrieve book from Firestore
//   Map<String, dynamic>? fetchedBook = await firestoreService.getBookByID(bookID);
//   if (fetchedBook != null) {
//     print("\n🎉 Book Retrieved Successfully!");
//     print("Title: ${fetchedBook["title"]}");
//     print("Author: ${fetchedBook["author"]}");
//     print("Cover URL: ${fetchedBook["coverURL"]}");
//     print("Pages:");
//     for (var i = 0; i < fetchedBook["pages"].length; i++) {
//       print("  📄 Page ${i + 1}: ${fetchedBook["pages"][i]}");
//     }
//   }
// }


// // class MyApp extends StatelessWidget {
// //   const MyApp({super.key});

// //   @override
// //   Widget build(BuildContext context) {
// //     return MaterialApp(
// //       debugShowCheckedModeBanner: false,
// //       title: 'Book Reader',
// //       theme: ThemeData(primarySwatch: Colors.blue),
// //       home: HomeScreen(), // ✅ HomeScreen is the main page now
// //     );
// //   }
// // }

// // // ✅ Convert HomeScreen into a StatefulWidget
// // class HomeScreen extends StatefulWidget {
// //   @override
// //   _HomeScreenState createState() => _HomeScreenState();
// // }

// // class _HomeScreenState extends State<HomeScreen> {
// //   final FirestoreService firestoreService = FirestoreService();

// //   @override
// //   Widget build(BuildContext context) {
// //     return Scaffold(
// //       appBar: AppBar(title: Text('Books')),
// //       body: Center(
// //         child: ElevatedButton(
// //           onPressed: () async {
// //             String filePath =  r"D:\study\NLP\proj\AIRISv2\frontend\airis\books\test.pdf";
// //             File pdf = File(filePath);
// //             String bookID = await firestoreService.addBook('test', 'a', pdf);
// //             print('New Book ID: $bookID');
// //           },
// //           child: Text('Add Book'),
// //         ),
// //       ),
// //     );
// //   }
// // }
