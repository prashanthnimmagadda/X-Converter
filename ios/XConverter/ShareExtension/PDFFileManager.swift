//
//  PDFFileManager.swift
//  ShareExtension
//
//  Manages PDF file saving and organization
//

import Foundation

class PDFFileManager {

    private let fileManager = FileManager.default

    // MARK: - Directory Management

    private var pdfDirectory: URL {
        get throws {
            // Get shared container directory
            let documentsURL = fileManager.urls(for: .documentDirectory, in: .userDomainMask)[0]

            // Create XConverter directory
            let pdfURL = documentsURL.appendingPathComponent("XConverter", isDirectory: true)

            // Create directory if it doesn't exist
            if !fileManager.fileExists(atPath: pdfURL.path) {
                try fileManager.createDirectory(at: pdfURL, withIntermediateDirectories: true, attributes: nil)
            }

            return pdfURL
        }
    }

    // MARK: - Save PDF

    /**
     Save PDF to Files app
     - Parameter data: PDF data
     - Parameter filename: Filename for the PDF
     */
    func savePDF(data: Data, filename: String) throws {
        let directory = try pdfDirectory

        // Ensure filename is unique
        let finalFilename = uniqueFilename(filename, in: directory)

        let fileURL = directory.appendingPathComponent(finalFilename)

        // Write PDF data
        try data.write(to: fileURL, options: .atomic)

        print("PDF saved to: \(fileURL.path)")
    }

    // MARK: - Helper Methods

    /**
     Generate a unique filename if the file already exists
     - Parameter filename: Original filename
     - Parameter directory: Directory to check
     - Returns: Unique filename
     */
    private func uniqueFilename(_ filename: String, in directory: URL) -> String {
        let fileURL = directory.appendingPathComponent(filename)

        // If file doesn't exist, use original filename
        if !fileManager.fileExists(atPath: fileURL.path) {
            return filename
        }

        // Extract base name and extension
        let baseName = (filename as NSString).deletingPathExtension
        let ext = (filename as NSString).pathExtension

        // Try numbered suffixes
        var counter = 1
        var newFilename = "\(baseName)_\(counter).\(ext)"
        var newFileURL = directory.appendingPathComponent(newFilename)

        while fileManager.fileExists(atPath: newFileURL.path) {
            counter += 1
            newFilename = "\(baseName)_\(counter).\(ext)"
            newFileURL = directory.appendingPathComponent(newFilename)
        }

        return newFilename
    }

    /**
     List all saved PDFs
     - Returns: Array of PDF file URLs
     */
    func listPDFs() throws -> [URL] {
        let directory = try pdfDirectory

        let contents = try fileManager.contentsOfDirectory(
            at: directory,
            includingPropertiesForKeys: [.creationDateKey],
            options: [.skipsHiddenFiles]
        )

        // Filter PDF files
        let pdfFiles = contents.filter { $0.pathExtension.lowercased() == "pdf" }

        // Sort by creation date (newest first)
        return pdfFiles.sorted { url1, url2 in
            guard let date1 = try? url1.resourceValues(forKeys: [.creationDateKey]).creationDate,
                  let date2 = try? url2.resourceValues(forKeys: [.creationDateKey]).creationDate else {
                return false
            }
            return date1 > date2
        }
    }

    /**
     Delete a PDF file
     - Parameter url: URL of the PDF to delete
     */
    func deletePDF(at url: URL) throws {
        try fileManager.removeItem(at: url)
    }

    /**
     Get total size of all saved PDFs
     - Returns: Total size in bytes
     */
    func totalSize() throws -> Int64 {
        let pdfs = try listPDFs()
        var totalSize: Int64 = 0

        for pdf in pdfs {
            let attributes = try fileManager.attributesOfItem(atPath: pdf.path)
            if let size = attributes[.size] as? Int64 {
                totalSize += size
            }
        }

        return totalSize
    }
}
