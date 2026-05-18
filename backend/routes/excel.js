// backend/routes/excel.js
// Excel report generation endpoint

const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');

/**
 * POST /api/excel/generate
 * Generates a professional property valuation report in Excel format
 */
router.post('/generate', async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      postal,
      propertyType,
      bedrooms,
      bathrooms,
      sqft,
      parking,
      avgRent,
      minRent,
      maxRent,
      avgPricePerSqft,
      marketArea,
      province
    } = req.body;

    // Validate required fields
    if (!name || !avgRent) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Property Valuation', {
      pageSetup: {
        paperSize: 9,
        orientation: 'portrait',
        margins: { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75 }
      }
    });

    // Set column widths
    worksheet.columns = [
      { width: 35 },
      { width: 45 }
    ];

    // Define colors (Lease Nexus branding)
    const primaryColor = 'FF3B82F6';      // Blue
    const accentColor = 'FF06B6D4';       // Cyan
    const darkColor = 'FF0F172A';         // Dark blue
    const lightBg = 'FFF0F4F8';           // Light background
    const successColor = 'FF10B981';      // Green

    let row = 1;

    // ==================== HEADER ====================
    let logoRow = worksheet.getRow(row);
    logoRow.height = 30;
    worksheet.mergeCells(`A${row}:B${row}`);
    let titleCell = worksheet.getCell(`A${row}`);
    titleCell.value = '🏢 LEASE NEXUS';
    titleCell.font = { name: 'Calibri', size: 24, bold: true, color: { argb: darkColor } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: lightBg } };
    row++;

    // Subtitle
    let subtitleRow = worksheet.getRow(row);
    subtitleRow.height = 20;
    worksheet.mergeCells(`A${row}:B${row}`);
    let subtitleCell = worksheet.getCell(`A${row}`);
    subtitleCell.value = 'PROPERTY VALUATION REPORT';
    subtitleCell.font = { name: 'Calibri', size: 14, color: { argb: primaryColor }, bold: true };
    subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    row++;

    // Tagline
    let taglineRow = worksheet.getRow(row);
    worksheet.mergeCells(`A${row}:B${row}`);
    let taglineCell = worksheet.getCell(`A${row}`);
    taglineCell.value = 'Better Tenants. Stronger Properties. Happier Owners.';
    taglineCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF64748B' } };
    taglineCell.alignment = { horizontal: 'center', vertical: 'middle' };
    row += 2;

    // ==================== CLIENT INFORMATION ====================
    _addSection(worksheet, row, 'CLIENT INFORMATION', primaryColor, darkColor);
    row++;

    _addInfoRow(worksheet, row, 'Name', name || 'N/A');
    row++;
    _addInfoRow(worksheet, row, 'Email', email || 'N/A');
    row++;
    _addInfoRow(worksheet, row, 'Phone', phone || 'N/A');
    row++;
    _addInfoRow(worksheet, row, 'Report Date', new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }));
    row += 2;

    // ==================== PROPERTY DETAILS ====================
    _addSection(worksheet, row, 'PROPERTY DETAILS', accentColor, darkColor);
    row++;

    _addInfoRow(worksheet, row, 'Address', address || 'N/A');
    row++;
    _addInfoRow(worksheet, row, 'Postal Code', postal || 'N/A');
    row++;
    _addInfoRow(worksheet, row, 'Property Type', propertyType || 'N/A');
    row++;
    _addInfoRow(worksheet, row, 'Bedrooms', bedrooms || 'N/A');
    row++;
    _addInfoRow(worksheet, row, 'Bathrooms', bathrooms || 'N/A');
    row++;
    _addInfoRow(worksheet, row, 'Square Footage', `${sqft || 'N/A'} sqft`);
    row++;
    _addInfoRow(worksheet, row, 'Parking Spaces', parking || 'N/A');
    row += 2;

    // ==================== MARKET ANALYSIS ====================
    _addSection(worksheet, row, 'MARKET ANALYSIS', primaryColor, darkColor);
    row++;

    _addInfoRow(worksheet, row, 'Market Area', `${marketArea || 'N/A'}, ${province || 'ON'}`);
    row++;

    // Average Rent (Highlighted)
    let avgRow = worksheet.getRow(row);
    let avgLabel = worksheet.getCell(`A${row}`);
    avgLabel.value = '💰 Average Monthly Rent';
    avgLabel.font = { name: 'Calibri', size: 12, bold: true, color: { argb: darkColor } };
    avgLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: successColor } };
    avgLabel.border = { left: { style: 'medium' }, right: { style: 'medium' }, top: { style: 'medium' }, bottom: { style: 'medium' } };
    avgLabel.alignment = { horizontal: 'left', vertical: 'center' };

    let avgValue = worksheet.getCell(`B${row}`);
    avgValue.value = `$${Number(avgRent).toLocaleString()}`;
    avgValue.font = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
    avgValue.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: successColor } };
    avgValue.border = { left: { style: 'medium' }, right: { style: 'medium' }, top: { style: 'medium' }, bottom: { style: 'medium' } };
    avgValue.alignment = { horizontal: 'right', vertical: 'center' };
    avgRow.height = 26;
    row++;

    _addInfoRow(worksheet, row, 'Minimum Estimate', `$${Number(minRent).toLocaleString()}`);
    row++;
    _addInfoRow(worksheet, row, 'Maximum Estimate', `$${Number(maxRent).toLocaleString()}`);
    row++;
    _addInfoRow(worksheet, row, 'Price Per Sqft', `$${avgPricePerSqft}`);
    row += 2;

    // ==================== ROI SUMMARY ====================
    _addSection(worksheet, row, 'ROI SUMMARY & PROJECTIONS', accentColor, darkColor);
    row++;

    // Annual Income
    const annualRent = avgRent * 12;
    _addInfoRow(worksheet, row, 'Estimated Annual Income', `$${Number(annualRent).toLocaleString()}`);
    row++;

    // 5-Year Projection
    const fiveYearRent = annualRent * 5;
    _addInfoRow(worksheet, row, '5-Year Income Projection', `$${Number(fiveYearRent).toLocaleString()}`);
    row++;

    // Property appreciation (assuming 3% annual)
    const monthlyAppreciation = avgRent * 0.03 / 12;
    const yearOneRent = avgRent + (monthlyAppreciation * 12);
    _addInfoRow(worksheet, row, 'Year 1 Rent (3% Growth)', `$${Number(yearOneRent).toLocaleString()}`);
    row += 2;

    // ==================== MARKET INSIGHTS ====================
    _addSection(worksheet, row, 'MARKET INSIGHTS & ANALYSIS', primaryColor, darkColor);
    row++;

    let insightCell = worksheet.getCell(`A${row}`);
    worksheet.mergeCells(`A${row}:B${row}`);
    const insight = `Based on current market data for ${marketArea}, ${province}, this ${bedrooms}-bedroom, ${bathrooms}-bathroom property in ${propertyType.toLowerCase()} format is estimated to generate approximately $${Number(avgRent).toLocaleString()} per month in rental income. The realistic market range is $${Number(minRent).toLocaleString()} - $${Number(maxRent).toLocaleString()}, with an average price of $${avgPricePerSqft}/sqft. This estimate is based on comparable properties in the area, current market conditions, and the property's specific characteristics. The property shows strong rental potential in the ${marketArea} market, with consistent demand for residential properties. Consider additional factors such as local economic growth, population trends, and property condition when making investment decisions.`;
    insightCell.value = insight;
    insightCell.font = { name: 'Calibri', size: 10, color: { argb: '##334155' } };
    insightCell.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
    worksheet.getRow(row).height = 80;
    row += 4;

    // ==================== NEXT STEPS ====================
    _addSection(worksheet, row, 'NEXT STEPS', primaryColor, darkColor);
    row++;

    let stepsCell = worksheet.getCell(`A${row}`);
    worksheet.mergeCells(`A${row}:B${row}`);
    stepsCell.value = `1. Review this report with our team at 1-800-LEASE-01\n2. Schedule a property assessment visit\n3. Discuss property management services\n4. Sign lease agreement and begin earning income`;
    stepsCell.font = { name: 'Calibri', size: 10 };
    stepsCell.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
    worksheet.getRow(row).height = 60;
    row += 3;

    // ==================== FOOTER ====================
    let contactRow = worksheet.getRow(row);
    worksheet.mergeCells(`A${row}:B${row}`);
    let contactCell = worksheet.getCell(`A${row}`);
    contactCell.value = '📞 1-800-LEASE-01  |  📧 info@leasenexus.com  |  📍 1976 McKay Ave, Windsor, ON';
    contactCell.font = { name: 'Calibri', size: 9, bold: true, color: { argb: darkColor } };
    contactCell.alignment = { horizontal: 'center', vertical: 'center' };
    contactCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: lightBg } };
    row += 2;

    let disclaimerRow = worksheet.getRow(row);
    worksheet.mergeCells(`A${row}:B${row}`);
    let disclaimerCell = worksheet.getCell(`A${row}`);
    disclaimerCell.value = '⚠️ DISCLAIMER: This is an AI-generated estimate based on market data and comparable properties. Actual rental rates may vary based on market conditions, property condition, local regulations, and economic factors. For a professional property appraisal, please consult a certified real estate appraiser.';
    disclaimerCell.font = { name: 'Calibri', size: 8, italic: true, color: { argb: '##7C3AED' } };
    disclaimerCell.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
    worksheet.getRow(row).height = 50;
    row += 3;

    // Footer
    let footerRow = worksheet.getRow(row);
    worksheet.mergeCells(`A${row}:B${row}`);
    let footerCell = worksheet.getCell(`A${row}`);
    footerCell.value = `© 2025 Lease Nexus. All Rights Reserved. | Generated ${new Date().toLocaleString()}`;
    footerCell.font = { name: 'Calibri', size: 8, color: { argb: '##94A3B8' } };
    footerCell.alignment = { horizontal: 'center', vertical: 'center' };

    // Print settings
    worksheet.pageSetup.printArea = `A1:B${row}`;
    worksheet.pageSetup.fitToPage = true;
    worksheet.pageSetup.fitToHeight = 1;
    worksheet.pageSetup.fitToWidth = 1;

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="LeaseNexus_Valuation_${name.replace(/\s+/g, '_')}.xlsx"`);
    res.setHeader('Content-Length', buffer.length);

    res.send(buffer);

    console.log(`✅ Excel report generated for: ${name} (${email})`);

  } catch (err) {
    console.error('Excel generation error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to generate report'
    });
  }
});

/**
 * Helper: Add section header
 */
function _addSection(worksheet, row, title, bgColor, textColor) {
  worksheet.mergeCells(`A${row}:B${row}`);
  let cell = worksheet.getCell(`A${row}`);
  cell.value = title;
  cell.font = { name: 'Calibri', size: 12, bold: true, color: { argb: textColor } };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
  cell.alignment = { horizontal: 'left', vertical: 'center' };
  worksheet.getRow(row).height = 24;
}

/**
 * Helper: Add info row
 */
function _addInfoRow(worksheet, row, label, value) {
  const labelCell = worksheet.getCell(`A${row}`);
  labelCell.value = label;
  labelCell.font = { name: 'Calibri', size: 11, bold: true };
  labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F4F8' } };
  labelCell.border = { left: { style: 'thin' }, right: { style: 'thin' }, top: { style: 'thin' }, bottom: { style: 'thin' } };
  labelCell.alignment = { horizontal: 'left', vertical: 'center' };

  const valueCell = worksheet.getCell(`B${row}`);
  valueCell.value = value;
  valueCell.font = { name: 'Calibri', size: 11 };
  valueCell.border = { left: { style: 'thin' }, right: { style: 'thin' }, top: { style: 'thin' }, bottom: { style: 'thin' } };
  valueCell.alignment = { horizontal: 'right', vertical: 'center' };

  worksheet.getRow(row).height = 20;
}

module.exports = router;