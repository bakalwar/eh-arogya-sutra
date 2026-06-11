const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Load the mapping data
const kb = JSON.parse(fs.readFileSync('./backend/data/medicine_knowledge_base.json', 'utf8'));

// Create a new PDF document
const doc = new PDFDocument({ margin: 50 });
const outputPath = './book_mapping_report.pdf';
const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

// Try to find a Hindi font on Windows
let fontPath = 'Helvetica'; // Fallback
const possibleFonts = [
    'C:/Windows/Fonts/nirmala.ttf',
    'C:/Windows/Fonts/mangal.ttf',
    'C:/Windows/Fonts/arial.ttf'
];

for (const f of possibleFonts) {
    if (fs.existsSync(f)) {
        fontPath = f;
        break;
    }
}

// Title
doc.font(fontPath).fontSize(20).text('E.H. Arogya Sutra - Book Mapping Report', { align: 'center' });
doc.moveDown();
doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
doc.text(`Total Medicines Mapped: ${kb.medicine_count}`, { align: 'center' });
doc.moveDown();
doc.path('M 50 120 L 550 120').stroke();
doc.moveDown();

// Loop through medicines
Object.entries(kb.medicines).forEach(([code, med], index) => {
    // Check for page break
    if (doc.y > 650) doc.addPage();

    doc.font(fontPath).fontSize(16).fillColor('blue').text(`${index + 1}. ${code}: ${med.medicine_name}`, { underline: true });
    doc.fontSize(12).fillColor('black');
    
    if (med.hindi_name) {
        doc.text(`Hindi Name: ${med.hindi_name}`);
    }
    
    doc.text(`Group: ${med.group}`);
    doc.text(`Temperament: ${Array.isArray(med.temperament) ? med.temperament.join(', ') : med.temperament}`);
    
    if (med.properties && med.properties.primary_action) {
        doc.text(`Primary Action: ${med.properties.primary_action}`, { width: 500 });
    }

    if (med.properties && med.properties.anatomical_affinity && med.properties.anatomical_affinity.length > 0) {
        doc.text(`Anatomical Affinity: ${med.properties.anatomical_affinity.join(', ')}`, { width: 500 });
    }

    doc.moveDown(0.5);
    doc.fontSize(10).text('Mapping Rules:', { oblique: true });
    
    (med.mapping_rules || []).forEach((rule, rIndex) => {
        if (doc.y > 700) doc.addPage();
        doc.fontSize(9).text(`  Rule ${rIndex + 1}: ${rule.condition || 'General'}`);
        if (rule.symptoms && rule.symptoms.length > 0) {
            doc.text(`    Symptoms: ${rule.symptoms.join(', ')}`);
        }
        if (rule.dosage_protocol) {
            const dp = rule.dosage_protocol;
            doc.text(`    Protocol: Potency=${dp.potency}, Dilution=${dp.dilution}, Frequency=${dp.frequency}, Electricity=${dp.electricity || 'None'}`);
        }
        doc.moveDown(0.2);
    });

    doc.moveDown();
    doc.path(`M 50 ${doc.y} L 550 ${doc.y}`).strokeColor('#cccccc').stroke();
    doc.moveDown();
});

// Finalize the PDF
doc.end();

stream.on('finish', () => {
    console.log('PDF generated successfully at ' + outputPath);
});
