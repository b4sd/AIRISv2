import 'dart:io';
import 'package:firebase_core/firebase_core.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/widgets.dart';
import 'lib/firebase_options.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/foundation.dart';

Future<void> main() async {
  print("Running on: ${Platform.operatingSystem}");
  WidgetsFlutterBinding.ensureInitialized();

  // 🔹 Force Windows configuration for Firebase
  FirebaseOptions options = DefaultFirebaseOptions.windows;
  await Firebase.initializeApp(options: options);

  print("✅ Firebase initialized.");

  // 🔹 Specify the correct PDF file path
  String pdfFilePath = r"D:\study\NLP\proj\AIRISv2\frontend\airis\books\gay-ass.pdf";
  File pdfFile = File(pdfFilePath);

  // 🔹 Check if the file exists
  if (!await pdfFile.exists()) {
    print("❌ Error: PDF file not found at $pdfFilePath");
    return;
  }

  print("📂 PDF file found. Uploading...");

  // 🔹 Add book to Firestore & Storage
  String bookID = await addBook("Test Book", "John Doe", pdfFile);
  print("✅ Book added successfully! ID: $bookID");
}
/// Uploads a book's details and PDF to Firestore and Firebase Storage
Future<String> addBook(String title, String author, File pdfFile) async {
  FirebaseFirestore firestore = FirebaseFirestore.instance;
  FirebaseStorage storage = FirebaseStorage.instance;

  // 🔹 Upload PDF to Firebase Storage
  String fileName = "books/${DateTime.now().millisecondsSinceEpoch}.pdf";
  Reference storageRef = storage.ref().child(fileName);
  await storageRef.putFile(pdfFile);
  String pdfURL = await storageRef.getDownloadURL();

  // 🔹 Add book details to Firestore
  DocumentReference docRef = await firestore.collection('books').add({
    'title': title,
    'author': author,
    'pdf_url': pdfURL,
    'timestamp': FieldValue.serverTimestamp(),
  });

  return docRef.id; // Return the book ID
}