import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'dart:async';

class FirestoreService {
  final FirebaseFirestore db = FirebaseFirestore.instance;
  final FirebaseStorage storage = FirebaseStorage.instance;

  /// ✅ **Add a document to any collection**
  Future<String> addDocument(String collectionPath, Map<String, dynamic> data) async {
    DocumentReference docRef = await db.collection(collectionPath).add(data);
    return docRef.id;
  }

  /// ✅ **Set or update a document**
  Future<void> setDocument(String path, Map<String, dynamic> data) async {
    await db.doc(path).set(data, SetOptions(merge: true));
  }

  /// ✅ **Get a document from any collection**
  Future<Map<String, dynamic>?> getDocument(String path) async {
    DocumentSnapshot doc = await db.doc(path).get();
    return doc.exists ? doc.data() as Map<String, dynamic> : null;
  }

  /// ✅ **Get all documents from a collection**
  Future<List<Map<String, dynamic>>> getCollection(String collectionPath) async {
    QuerySnapshot snapshot = await db.collection(collectionPath).get();
    return snapshot.docs.map((doc) => doc.data() as Map<String, dynamic>).toList();
  }

  /// ✅ **Get subcollection dynamically (supports nested paths)**
  Future<List<Map<String, dynamic>>> getSubcollection(String path) async {
    QuerySnapshot snapshot = await db.collection(path).get();
    return snapshot.docs.map((doc) => doc.data() as Map<String, dynamic>).toList();
  }

  /// ✅ **Delete a document**
  Future<void> deleteDocument(String path) async {
    await db.doc(path).delete();
  }
}
