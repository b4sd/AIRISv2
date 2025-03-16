import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/widgets.dart';
import 'dart:io';
import 'dart:async';

class FirestoreService {
  final FirebaseFirestore _db = FirebaseFirestore.instance;
  final FirebaseStorage _storage = FirebaseStorage.instance;

  // 📚 Add a book (Now supports PDF upload)
  Future<String> addBook(String title, String author, File pdfFile) async {
    try {
      return await Future.microtask(() async {
        String fileName = "books/${DateTime.now().millisecondsSinceEpoch}.pdf";
        Reference ref = _storage.ref().child(fileName);

        // UploadTask uploadTask = ref.putFile(pdfFile);
        // TaskSnapshot snapshot = await uploadTask;
        // String downloadUrl = await snapshot.ref.getDownloadURL();

        DocumentReference docRef = await _db.collection("books").add({
          "title": title,
          "author": author,
          // "pdfUrl": downloadUrl,
          "timestamp": FieldValue.serverTimestamp(),
        });

        return docRef.id; // ✅ Return the new book ID
      });
    } catch (e) {
      print("Error adding book: $e");
      return "";
    }
  }

  // 📂 Upload PDF to Firebase Storage
  Future<void> uploadFile(File pdfFile) async {
    try {
      FirebaseStorage storage = FirebaseStorage.instance;
      Reference ref = storage.ref().child("books/${DateTime.now().millisecondsSinceEpoch}.pdf");
      
      await ref.putFile(pdfFile);
      String downloadURL = await ref.getDownloadURL();
      
      print("Upload successful: $downloadURL");
    } catch (e) {
      print("Upload failed: $e");
    }
  }


  // 📖 Add a chapter to a book
  Future<void> addChapter(String bookID, String chapterTitle, String content) async {
    await _db.collection('books').doc(bookID).collection('chapters').add({
      'title': chapterTitle,
      'content': content,
    });
  }

  // 📚 Get all books
  Future<List<Map<String, dynamic>>> getBooks() async {
    QuerySnapshot snapshot = await _db.collection('books').get();
    return snapshot.docs.map((doc) => {'id': doc.id, ...doc.data() as Map<String, dynamic>}).toList();
  }

  // 📖 Get all chapters of a book
  Future<List<Map<String, dynamic>>> getChapters(String bookID) async {
    QuerySnapshot snapshot = await _db.collection('books').doc(bookID).collection('chapters').get();
    return snapshot.docs.map((doc) => {'id': doc.id, ...doc.data() as Map<String, dynamic>}).toList();
  }

  // // 📁 Pick a PDF file from local storage
  // Future<File?> pickPDF() async {
  //   FilePickerResult? result = await FilePicker.platform.pickFiles(
  //     type: FileType.custom,
  //     allowedExtensions: ['pdf'],
  //   );

  //   if (result != null && result.files.single.path != null) {
  //     return File(result.files.single.path!);
  //   }
  //   return null;
  // }
}
