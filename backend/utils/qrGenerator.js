// backend/utils/qrGenerator.js
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');

/**
 * Generate a QR code as a base64 PNG data URL
 * @param {string} text - Text to encode in QR code
 * @returns {Promise<string>} Base64 PNG data URL
 */
async function generateQRDataURL (text) {
    return QRCode.toDataURL(text, {
        errorCorrectionLevel: 'M',
        margin: 2,
        width: 300,
        color: {
            dark: '#000000',
            light: '#FFFFFF',
        },
    });
}

/**
 * Generate a batch PDF with QR codes for all cards
 * @param {Array} users - Array of user objects
 * @param {Array} cards - Array of card objects (matched to users)
 * @param {string} orgName - Organization name for the header
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generateQRBatchPDF (users, cards, orgName) {
    return new Promise(async (resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margin: 40,
                info: {
                    Title: `${ orgName } — QR Codes Batch`,
                    Author: 'CampuSync',
                },
            });

            const buffers = [];
            doc.on('data', (chunk) => buffers.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(buffers)));

            // Header
            doc.fontSize(18).font('Helvetica-Bold').text(orgName, { align: 'center' });
            doc.fontSize(10).font('Helvetica').text('QR Code Batch — Print Ready', { align: 'center' });
            doc.moveDown(1);

            // Grid layout: 3 columns x N rows
            const qrSize = 140;
            const colWidth = (doc.page.width - 80) / 3;
            const rowHeight = qrSize + 60;
            let col = 0;
            let row = 0;
            const startY = doc.y;

            for(let i = 0;i < cards.length;i++) {
                const card = cards[ i ];
                const user = users.find((u) => u.id === card.user_id) || {};

                // Check if we need a new page
                const currentY = startY + row * rowHeight;
                if(currentY + rowHeight > doc.page.height - 60) {
                    doc.addPage();
                    row = 0;
                    col = 0;
                }

                const x = 40 + col * colWidth;
                const y = (row === 0 && doc.page.number > 1 ? 40 : startY) + row * rowHeight;

                // Generate QR code
                const baseUrl = process.env.APP_BASE_URL || 'http://localhost:5173';
                const qrUrl = `${ baseUrl }/portal?qr=${ card.qr_hash }`;
                const qrDataUrl = await generateQRDataURL(qrUrl);

                // Convert data URL to buffer for PDFKit
                const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, '');
                const qrBuffer = Buffer.from(base64Data, 'base64');

                // Draw QR code
                doc.image(qrBuffer, x + (colWidth - qrSize) / 2, y, { width: qrSize, height: qrSize });

                // Draw student name and roll number
                doc.fontSize(8).font('Helvetica-Bold')
                    .text(user.name || 'Unknown', x, y + qrSize + 4, { width: colWidth, align: 'center' });
                doc.fontSize(7).font('Helvetica')
                    .text(user.roll_number || '', x, y + qrSize + 16, { width: colWidth, align: 'center' });

                col++;
                if(col >= 3) {
                    col = 0;
                    row++;
                }
            }

            // Footer on last page
            doc.fontSize(8).font('Helvetica')
                .text(`Generated on ${ new Date().toLocaleDateString() } — ${ cards.length } cards`, 40, doc.page.height - 30, {
                    align: 'center',
                    width: doc.page.width - 80,
                });

            doc.end();
        } catch(err) {
            reject(err);
        }
    });
}

module.exports = { generateQRDataURL, generateQRBatchPDF };
