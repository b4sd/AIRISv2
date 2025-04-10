import firebase_admin
from firebase_admin import credentials, firestore
import os
import block_preprocess

# Load the Service Account Key
cred = credentials.Certificate("airis-2a337-6f3b8f8d8e64.json")
firebase_admin.initialize_app(cred)

# Get Firestore instance
db = firestore.client()

# Path to books folder
book_folder = "./raw_data/book"

# Read book names (each folder represents a book)
book_names = os.listdir(book_folder)


for book_name in book_names:
    file_path = book_folder + '\\' + book_name + '\\' + book_name + ".pdf"
    book_path = os.path.join(book_folder, book_name)  # Full book path

    if not os.path.isdir(book_path):  # Ensure it's a folder
        continue

    # # Count number of pages (blocks)
    # block_files = sorted([f for f in os.listdir(book_path) if f.startswith("block_") and f.endswith(".txt")])
    # page_count = len(block_files)

    sections, pages = block_preprocess.process_plumber(file_path)
    page_count = len(pages)

    # Create a book document in Firestore

    book_ref = db.collection("book").document()  # Auto-generate bookID
    book_ref.set({
        "title": book_name,
        "author": "",
        "coverUrl": "",
        "page": page_count
    })

    print(f"Uploaded book: {book_name} ({page_count} pages)")

    # Upload pages as subcollection inside the book document
    for i, text in enumerate(pages):
        # block_path = os.path.join(book_path, block_file)

        # with open(block_path, "r", encoding="utf-8") as f:
        #     text = f.read().strip()

        page_ref = book_ref.collection("page").document(str(i + 1))  # PageID starts from 1
        page_ref.set({
            "pageID": i + 1,
            "content": text
        })
        # print("text to upload:", text)
        # print(f"  Uploaded page {i + 1}")

print("Upload completed.")
