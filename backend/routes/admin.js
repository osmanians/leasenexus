// backend/routes/admin.js
// Admin leads management endpoints

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const ExcelJS = require('exceljs');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// Middleware: Verify JWT Token
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'No token provided'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
}

/**
 * GET /api/admin/leads
 * Get all leads with filters
 */
router.get('/leads', verifyToken, async (req, res) => {
  try {
    const supabase = global.supabase;
    
    if (!supabase) {
      return res.status(500).json({
        success: false,
        error: 'Supabase not initialized'
      });
    }

    const { status, type } = req.query;

    let query = supabase.from('leads').select('*');

    if (status) {
      query = query.eq('status', status);
    }

    if (type) {
      query = query.eq('type', type);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    res.json({
      success: true,
      leads: data || []
    });

  } catch (err) {
    console.error('Error fetching leads:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leads'
    });
  }
});

/**
 * PATCH /api/admin/leads/:id/status
 * Update lead status and notes
 */
router.patch('/leads/:id/status', verifyToken, async (req, res) => {
  try {
    const supabase = global.supabase;
    
    if (!supabase) {
      return res.status(500).json({
        success: false,
        error: 'Supabase not initialized'
      });
    }

    const { id } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required'
      });
    }

    const updateData = {
      status: status,
      last_contacted: new Date().toISOString()
    };

    if (notes) {
      updateData.notes = notes;
    }

    const { data, error } = await supabase
      .from('leads')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    res.json({
      success: true,
      lead: data[0]
    });

    console.log(`Lead ${id} status updated to: ${status}`);

  } catch (err) {
    console.error('Error updating lead:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update lead'
    });
  }
});

/**
 * GET /api/admin/export
 * Export all leads to Excel
 */
router.get('/export', verifyToken, async (req, res) => {
  try {
    const supabase = global.supabase;
    
    if (!supabase) {
      return res.status(500).json({
        success: false,
        error: 'Supabase not initialized'
      });
    }

    // Fetch all leads
    const { data: leads, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Leads', {
      pageSetup: {
        paperSize: 9,
        orientation: 'landscape',
        margins: { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75 }
      }
    });

    // Set column widths
    worksheet.columns = [
      { width: 12, alignment: { horizontal: 'center' } },
      { width: 15 },
      { width: 15 },
      { width: 20 },
      { width: 15 },
      { width: 12 },
      { width: 15 },
      { width: 20 },
      { width: 25 },
      { width: 15 }
    ];

    // Define colors
    const primaryColor = 'FF3B82F6';
    const darkColor = 'FF0F172A';
    const lightBg = 'FFF0F4F8';

    // Header
    const headerRow = worksheet.getRow(1);
    headerRow.height = 25;
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Type', 'Status', 'Address', 'Property Type', 'Created Date', 'Last Contacted'];
    
    headers.forEach((header, index) => {
      const cell = worksheet.getCell(1, index + 1);
      cell.value = header;
      cell.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: darkColor } };
      cell.alignment = { horizontal: 'center', vertical: 'center', wrapText: true };
      cell.border = { left: { style: 'thin' }, right: { style: 'thin' }, top: { style: 'thin' }, bottom: { style: 'thin' } };
    });

    // Data rows
    leads.forEach((lead, index) => {
      const row = worksheet.getRow(index + 2);
      row.height = 20;

      const rowData = [
        lead.id,
        `${lead.first_name || ''} ${lead.last_name || ''}`.trim(),
        lead.email || 'N/A',
        lead.phone || 'N/A',
        lead.type === 'landlord' ? 'Landlord' : 'Tenant',
        (lead.status || 'new').charAt(0).toUpperCase() + (lead.status || 'new').slice(1),
        lead.property_address || lead.preferred_area || 'N/A',
        lead.house_type || 'N/A',
        new Date(lead.created_at).toLocaleDateString(),
        lead.last_contacted ? new Date(lead.last_contacted).toLocaleDateString() : 'N/A'
      ];

      rowData.forEach((value, colIndex) => {
        const cell = worksheet.getCell(index + 2, colIndex + 1);
        cell.value = value;
        cell.font = { name: 'Calibri', size: 10 };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: index % 2 === 0 ? lightBg : 'FFFFFFFF' } };
        cell.alignment = { horizontal: colIndex === 0 ? 'center' : 'left', vertical: 'center', wrapText: true };
        cell.border = { left: { style: 'thin' }, right: { style: 'thin' }, top: { style: 'thin' }, bottom: { style: 'thin' } };
      });
    });

    // Freeze header row
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="LeaseNexus_Leads_${new Date().toISOString().split('T')[0]}.xlsx"`);
    res.setHeader('Content-Length', buffer.length);

    res.send(buffer);

    console.log(`Exported ${leads.length} leads to Excel`);

  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to export data'
    });
  }
});

module.exports = router;