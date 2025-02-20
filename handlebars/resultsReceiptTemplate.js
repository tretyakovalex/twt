const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const hbs = require('handlebars');
const path = require('path');

const express = require('express');
const app = express();

// Set up static file serving for images
app.use(express.static(path.join(__dirname, 'public')));
console.log(path.join(__dirname, 'public'));

// Set cache directory for Puppeteer
process.env.PUPPETEER_CACHE_DIR = path.join(__dirname, '.cache', 'puppeteer');
console.log(path.join(__dirname, '.cache', 'puppeteer'));

// Compile Handlebars template
const compile = async function(data) {
    const filePath = path.join(__dirname, 'views', `resultReceipts.handlebars`);
    const html = await fs.readFile(filePath, 'utf-8');
    return hbs.compile(html)(data);
};

async function generatePdf(templateData, templateName) {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        const content = await compile(templateData);  // Compile Handlebars into html with data
        
        // Compile to HTML file
        const htmlFilePath = path.join(__dirname, `compiled-resultReceipts.html`);
        await fs.writeFile(htmlFilePath, content);

        await page.goto(`file:${htmlFilePath}`, { waitUntil: 'networkidle0' });

        const pdfPath = path.join(__dirname, 'resultReceipts', `${templateName}.pdf`);
        await page.pdf({
            path: pdfPath,
            format: 'A4',
            printBackground: true
        });

        console.log('PDF generated successfully.');
        await browser.close();

        return pdfPath;  // Return the path of the generated PDF
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw error;
    }
}

async function getFilePath(basePath, file_name) {

    const files = await fs.readdir(basePath);
    const matchingFiles = files.filter(file => file.startsWith(file_name) && file.endsWith('.pdf'));

    if(matchingFiles.length === 0){
        return `${file_name}.pdf`;
    } else if (matchingFiles.length > 0){
        let latestVersion = 0;
        let latestFile = `${file_name}.pdf`;

        matchingFiles.forEach(file => {
            const versionMatch = file.match(/_v(\d+)\.pdf$/);
            if (versionMatch) {
                const version = parseInt(versionMatch[1], 10);
                latestVersion = version + 1;

                latestFile = `${file.replace(/_v\d+\.pdf$/, `_v${latestVersion}.pdf`)}`;
            } else if (!file.includes('_v') && latestVersion === 0) {
                // If there is no version and it's the first match
                latestFile = `${file_name}_v1.pdf`;
            }
        });

        return latestFile;
    }
}

(async () => {
    try {
        console.log(generatePdf());
    } catch (error) {
        console.error('Error: ', error);
    }
})

module.exports.generatePdf = generatePdf;