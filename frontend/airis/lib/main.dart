import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'features/home/presentation/screens/home_screen.dart';
import 'features/home/data/repositories/home_repository.dart';
import 'package:firebase_core/firebase_core.dart';
import 'services/firestore_service.dart';
import 'firebase_options.dart';
import 'dart:io';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  runApp(
    MultiProvider(
      providers: [
        Provider(create: (_) => HomeRepository()), // ✅ Use `Provider` instead
      ],
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Book Reader',
      theme: ThemeData(primarySwatch: Colors.blue),
      home: HomeScreen(), // ✅ HomeScreen is the main page now
    );
  }
}

// ✅ Convert HomeScreen into a StatefulWidget
class HomeScreen extends StatefulWidget {
  @override
  _HomeScreenState createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final FirestoreService firestoreService = FirestoreService();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Books')),
      body: Center(
        child: ElevatedButton(
          onPressed: () async {
            String filePath =  r"D:\study\NLP\proj\AIRISv2\frontend\airis\books\test.pdf";
            File pdf = File(filePath);
            String bookID = await firestoreService.addBook('test', 'a', pdf);
            print('New Book ID: $bookID');
          },
          child: Text('Add Book'),
        ),
      ),
    );
  }
}
