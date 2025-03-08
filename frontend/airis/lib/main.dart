import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'features/home/presentation/screens/home_screen.dart';
import 'features/home/data/repositories/home_repository.dart';

void main() {
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
      home: HomeScreen(),
    );
  }
}
