const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

router.get('/getPurchasingCertificateInfos', (req, res) => {
  const directoryPath = path.join(__dirname, '..', '..', 'handlebars', 'purchasingCertificates'); // Adjust the directory path accordingly

  // Retrieve PDF files info
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      return res.status(500).json({ error: `Error reading directory: ${err}` });
    }

    const pdfFilesInfo = [];
    let pdfCount = 0; // Counter to track how many PDF files we have processed

    files.forEach(file => {
      // Check if the file has a '.pdf' extension
      if (path.extname(file).toLowerCase() === '.pdf') {
        const filePath = path.join(directoryPath, file);

        // Retrieve file stats to get the creation date
        fs.stat(filePath, (err, stats) => {
          if (err) {
            console.error(`Error retrieving stats for file: ${file}`, err);
          } else {
            // Push the file name and creation date/time to the array
            const fileInfo = {
              name: file,
              createdAt: stats.birthtime // Birthtime is the creation time
            };
            pdfFilesInfo.push(fileInfo);
          }

          // If all files are processed, send the response
          pdfCount++;
          if (pdfCount === files.filter(f => path.extname(f).toLowerCase() === '.pdf').length) {
            return res.status(200).json(pdfFilesInfo);
          }
        });
      } else {
        pdfCount++;
      }
    });

    // If no PDFs are found, return an empty array
    if (files.filter(f => path.extname(f).toLowerCase() === '.pdf').length === 0) {
      return res.status(200).json([]);
    }
  });
});

router.get('/getPurchasingCertificateByName', async (req, res) => {
    try {
        const name = req.query.name;
        if (!name) {
            return res.status(400).json({ error: 'Certificate name is required' });
        }
    
        // Set the directory where certificates are stored locally
        const certificatesDir = path.join(__dirname, '..', '..', 'handlebars', 'purchasingCertificates'); // Adjust the directory path accordingly

        // Construct the full file path to the certificate PDF
        console.log("directory: ", certificatesDir, "certificate name: ", name);
        const certificatePath = path.join(certificatesDir, `${name}`);
        console.log("certificatePath: ", certificatePath);
        // Check if the certificate file exists
        fs.access(certificatePath, fs.constants.F_OK, (err) => {
            if (err) {
                return res.status(404).json({ error: 'Certificate not found' });
            }

            // Return the certificate data in the response
            return res.download(certificatePath);
        });
    
    } catch (error) {
        console.error('Error retrieving certificate by name:', error);
        return res.status(500).json({ error: 'Server error' });
    }
})

module.exports = router;
