import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/widgets.dart';
import 'dart:io';
import 'dart:async';

class FirestoreService {
  final FirebaseFirestore db = FirebaseFirestore.instance;
  final FirebaseStorage storage = FirebaseStorage.instance;

  // Add book
  Future<String> addBook(String title, String author, String coverUrl, List<String> pages) async {
    DocumentReference bookRef = await db.collection("books").add({
      "title": title,
      "author": author,
      "coverURL": coverUrl,
    });

    for (int i = 0; i < pages.length; i++) {
      await bookRef.collection("pages").doc("page${i + 1}").set({
        "text": pages[i],
      });
    }
    return bookRef.id;
  }

  Future<Map<String, dynamic>?> getBookByID(String bookID) async {
    DocumentSnapshot bookDoc = await db.collection("books").doc(bookID).get();

    if (!bookDoc.exists) return null;

    // ✅ Fetch metadata
    Map<String, dynamic> bookData = bookDoc.data() as Map<String, dynamic>;

    // ✅ Fetch pages from the subcollection
    QuerySnapshot pagesSnapshot = await db.collection("books").doc(bookID).collection("pages").get();

    // Convert pages to a list
    List<String> pages = pagesSnapshot.docs
        .map((doc) => doc.data() as Map<String, dynamic>) // Convert document to map
        .map((data) => data["text"] as String) // Extract "text" field
        .toList();

    // ✅ Return combined data
    bookData["pages"] = pages;
    return bookData;
  }

  Future<List<String>> getAllBookIDs() async {
    QuerySnapshot booksSnapshot = await db.collection("books").get();

    List<String> bookIDs = booksSnapshot.docs.map((doc) => doc.id).toList();
    return bookIDs;
  }
}
