const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const hbs = require('handlebars');
const path = require('path');
const WebSocket = require('ws');

const express = require('express');
const app = express();

let purchaseArray = [];

// WebSocket server setup
const wss = new WebSocket.Server({ port: 8080 });

// Set up static file serving for images
app.use(express.static(path.join(__dirname, 'public')));
console.log(path.join(__dirname, 'public'));

// Set cache directory for Puppeteer
process.env.PUPPETEER_CACHE_DIR = path.join(__dirname, '.cache', 'puppeteer');
console.log(path.join(__dirname, '.cache', 'puppeteer'));

// Compile Handlebars template
const compile = async function(templateName, data) {
    const filePath = path.join(__dirname, 'views', `${templateName}.handlebars`);
    const html = await fs.readFile(filePath, 'utf-8');
    return hbs.compile(html)(data);
};

function transformPurchaseData(purchase) {
    // return new Promise((resolve) => {
    //     let material_name;

        // if (purchase.material === "TA") {
        //     material_name = "Tantalum";
        // } else if (purchase.material === "NB") {
        //     material_name = "Niobium";
        // } else if (purchase.material === "SN") {
        //     material_name = "Tin";
        // } else {
        //     material_name = "Unknown Material"; // Default value if the material_type doesn't match any known types
        // }

        const transformed = {
            purchase_number: purchase.purchase_id,
            // material_type: purchase.material,
            material_type: "TA",
            material_name: "material_name",
            purchase_mass: purchase.mass,
            company_name: purchase.company_name,
            tin: purchase.tin,
            price_usd_per_kg: purchase.price_per_kg,
            total_amount_usd: purchase.total_amount,
            date: new Date(purchase.purchase_date).toLocaleDateString('en-GB'),
            exchange_rate_rwf_usd: purchase.exchange_rate_frw_to_usd,
            rma_payment_rwf_per_kg: purchase.rma_fees_frw_per_kg,
            rma_payment_total_rwf: purchase.rma_frw,
            rma_payment_three_percent_usd: (purchase.total_amount * 0.03).toFixed(2),
            rma_payment_three_percent_rwf: (purchase.rma_frw * 0.03).toFixed(1).replace(/\B(?=(\d{3})+(?!\d))/g, " "),
            client_net_payment: purchase.total_minus_rma_usd,
            number_of_bags: purchase.number_of_bags
        };

        purchaseArray.push(transformed);
        return transformed;
    //     resolve(transformed);
    // });
}


// Function to retrieve purchase information and generate the PDF
async function generatePdf(purchase) {
    try {
        const formattedPurchase = await transformPurchaseData(purchase);
        const purchase_number = formattedPurchase.purchase_number;
        const material_type = formattedPurchase.material_type;

        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        const content = await compile('purchaseCertificateTemplate', formattedPurchase);  // Pass the transformed purchase data
        
        // Compile to HTML file
        const htmlFilePath = path.join(__dirname, 'compiled-template.html');
        await fs.writeFile(htmlFilePath, content);

        await page.goto(`file:${htmlFilePath}`, { waitUntil: 'networkidle0' });

        const pdfPath = path.join(__dirname, `purchase_${purchase_number}-${material_type}.pdf`);
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

async function getPDF(purchase_id, material) {
    try {
        const pdfBaseName = `purchase_${purchase_id}-${material}`;
        const directoryPath = __dirname;

        const files = await fs.readdir(directoryPath);
        const matchingFiles = files.filter(file => file.startsWith(pdfBaseName) && file.endsWith('.pdf'));

        if (matchingFiles.length === 0) {
            throw new Error(`No PDF found for purchase ID ${purchase_id} and material ${material}`);
        }

        let latestVersion = 0;
        let latestFile = `${pdfBaseName}.pdf`;

        matchingFiles.forEach(file => {
            const versionMatch = file.match(/_v(\d+)\.pdf$/);
            if (versionMatch) {
                const version = parseInt(versionMatch[1], 10);
                if (version > latestVersion) {
                    latestVersion = version;
                    latestFile = file;
                }
            } else if (!file.includes('_v') && latestVersion === 0) {
                // If there is no version and it's the first match
                latestFile = file;
            }
        });

        const pdfFilePath = path.join(directoryPath, latestFile);
        return pdfFilePath;
    } catch (error) {
        console.error('Error getting PDF:', error);
        throw error;
    }
}

// === OLD getPDF ===
// async function getPDF(purchase_id, material){
//     try {
//         const pdfFileName = `purchase_${purchase_id}-${material}.pdf`;
//         const pdfFilePath = path.join(__dirname, pdfFileName);

//         console.log(pdfFilePath);
//         return pdfFilePath;
//     } catch (error) {
//         console.error('Error generating PDF:', error);
//         throw error;
//     }
// }

// === Helper function for reGeneratePDF ===
// =========================================
async function getVersionedFilePath(basePath, purchase_number, material_type) {
    let version = 1;
    let filePath;
    do {
        filePath = path.join(basePath, `purchase_${purchase_number}-${material_type}_v${version}.pdf`);
        version++;
    } while (await fileExists(filePath));
    return filePath;
}

async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch (error) {
        if (error.code === 'ENOENT') {
            return false;
        }
        throw error;
    }
}
// =========================================

async function reGeneratePDF(purchase) {
    try {
        const formattedPurchase = await transformPurchaseData(purchase);
        const purchase_number = formattedPurchase.purchase_number;
        const material_type = formattedPurchase.material_type;

        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        const content = await compile('purchaseCertificateTemplate', formattedPurchase);  // Pass the transformed purchase data
        
        // Compile to HTML file
        const htmlFilePath = path.join(__dirname, 'compiled-template.html');
        await fs.writeFile(htmlFilePath, content);

        await page.goto(`file:${htmlFilePath}`, { waitUntil: 'networkidle0' });

        const pdfPath = await getVersionedFilePath(__dirname, purchase_number, material_type);
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

// Handle WebSocket connections
wss.on('connection', (ws) => {
    console.log('Client connected');

    // Listen for messages from the client
    ws.on('message', async (message) => {
        const data = JSON.parse(message);

        // Generate the PDF
        const pdfPath = await generatePdf(data);

        // Read the PDF file
        const pdfData = await fs.promises.readFile(pdfPath);

        // Send the PDF file to the client
        ws.send(pdfData, { binary: true }, (err) => {
            if (err) console.error('Error sending PDF:', err);
        });
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

// (async () => {
//     try {
//         const purchase = purchaseArray;
//         console.log("printing purchase inside async: ", purchase);

//         const pdfPath = await generatePdf(purchase);
//         console.log(`PDF is generated at: ${pdfPath}`);
//     } catch (error) {
//         console.error('Error:', error);
//     }
// })();

module.exports.generatePdf = generatePdf;
module.exports.getPDF = getPDF;
module.exports.reGeneratePDF = reGeneratePDF;



// const puppeteer = require('puppeteer');
// const fs = require('fs-extra');
// const hbs = require('handlebars');
// const path = require('path');
// // const data = require('./data.json');
// // const moment = require('moment');
// const express = require('express');
// const app = express();

// // Set up static file serving for images
// app.use(express.static(path.join(__dirname, 'public')));
// console.log(path.join(__dirname, 'public'));

// // Set cache directory for Puppeteer
// process.env.PUPPETEER_CACHE_DIR = path.join(__dirname, '.cache', 'puppeteer');
// console.log(path.join(__dirname, '.cache', 'puppeteer'));

// const compile = async function(templateName, data) {
//     const filePath = path.join(__dirname, 'views', `${templateName}.handlebars`);  

//     const html = await fs.readFile(filePath, 'utf-8');
//     return hbs.compile(html)(data);
// };

// // Function to read JSON file and extract attribute
// const readJsonAttribute = async function(jsonPath, attribute) {
//     const jsonData = await fs.readFile(jsonPath, 'utf-8');
//     const parsedData = JSON.parse(jsonData);
//     return parsedData[attribute];
// };

// // Function to transform the data into the required format
// function transformPurchaseData(purchase) {
//     return {
//         purchase_number: purchase.purchase_id,
//         // material_type: purchase.material,  // Assuming material_type is static or retrieved from somewhere else
//         material_type: purchase.material_type,  // Assuming material_type is static or retrieved from somewhere else
//         material_name: "material_name",  // Assuming material_name is static or retrieved from somewhere else
//         purchase_mass: purchase.mass,
//         company_name: purchase.company_name,
//         tin: purchase.tin,
//         price_usd_per_kg: purchase.price_per_kg,
//         total_amount_usd: purchase.total_amount,
//         date: new Date(purchase.purchase_date).toLocaleDateString('en-GB'),  // Format date as dd.mm.yyyy
//         exchange_rate_rwf_usd: purchase.exchange_rate_frw_to_usd,
//         rma_payment_rwf_per_kg: purchase.rma_fees_frw_per_kg,
//         rma_payment_total_rwf: purchase.rma_frw,
//         rma_payment_three_percent_usd: (purchase.total_amount * 0.03).toFixed(2),
//         rma_payment_three_percent_rwf: (purchase.rma_frw * 0.03).toFixed(1).replace(/\B(?=(\d{3})+(?!\d))/g, " "),
//         client_net_payment: purchase.total_minus_rma_usd,
//         // number_of_bags: purchase.number_of_bags  // Assuming number_of_bags is static or retrieved from somewhere else
//         number_of_bags: purchase.number_of_bags // Assuming number_of_bags is static or retrieved from somewhere else
//     };
// }

// function getPurchaseInfo(purchase){
//     const formattedPurchase = transformPurchaseData(purchase);
 
//     return formattedPurchase;
// }

// (async () => {
//     try {
//         // const jsonFilePath = path.join(__dirname, 'data.json');
//         const jsonFilePath = getPurchaseInfo;
//         // const purchase_number = await readJsonAttribute(jsonFilePath, 'purchase_number');
//         const purchase_number = formattedPurchase.purchase_number;
//         // const material_type = await readJsonAttribute(jsonFilePath, 'material_type');
//         const material_type = formattedPurchase.material_type;

//         const browser = await puppeteer.launch();
//         const page = await browser.newPage();
//         const content = await compile('purchaseCertificateTemplate', data);
        
//         // compile to html file
//         const htmlFilePath = path.join(__dirname, 'compiled-template.html');
//         await fs.writeFile(htmlFilePath, content);

//         // await page.setContent(content);
//         await page.goto(`file:${htmlFilePath}`, { waitUntil: 'networkidle0' });
        
//         // await page.emulateMediaType('screen');
//         await page.pdf({
//             path: `purchase ${purchase_number}-${material_type}.pdf`,
//             format: 'A4',
//             printBackground: true
//         });

//         console.log('PDF generated successfully.');
//         await browser.close();

//     } catch (error) {
//         console.log(error);
//     }
// })();



// // (async () => {
// //     try {
// //         const browser = await puppeteer.launch({
// //             headless: true,
// //             args: ['--no-sandbox', '--disable-setuid-sandbox']
// //         });
// //         const page = await browser.newPage();

// //         const compiledContent = await compile('purchaseCertificateTemplate', data);
// //         const htmlFilePath = path.join(__dirname, 'compiled-purchaseCertificateTemplate.html');

// //         // Save the compiled content as an HTML file
// //         await fs.writeFile(htmlFilePath, compiledContent);

// //         // Load the HTML file and generate a PDF
// //         await page.goto(`file:${htmlFilePath}`, { waitUntil: 'networkidle0' });
// //         await page.pdf({
// //             path: 'test.pdf',
// //             format: 'A4',
// //             printBackground: true
// //         });

// //         console.log('PDF generated successfully.');
// //         await browser.close();

// //     } catch (error) {
// //         console.error('Error:', error);
// //     }
// // })();

// module.exports.getPurchaseInfo = getPurchaseInfo;