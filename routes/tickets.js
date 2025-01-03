const express = require('express');
const { google } = require('googleapis');
const router = express.Router();
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();
const fs = require('fs');

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  },
  tls: {
    rejectUnauthorized: false // Only for development! Remove in production
  }
});

// Load the service account key
const keyPath = path.join(__dirname, '../config/service-account.json');

console.log('Current directory:', __dirname);
console.log('Service account path:', keyPath);

const serviceAccountPath = path.join(__dirname, '../config/service-account.json');
console.log('Attempting to read service account from:', serviceAccountPath);

try {
  const serviceAccount = require(serviceAccountPath);
  console.log('Service account loaded successfully');
  console.log('Service account email:', serviceAccount.client_email);
} catch (error) {
  console.error('Error loading service account:', error);
}

async function getSheetsClient() {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: keyPath,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const client = await auth.getClient();
    console.log('Successfully created auth client');
    
    const sheets = google.sheets({ version: 'v4', auth: client });
    return sheets;
  } catch (error) {
    console.error('Error creating sheets client:', error);
    throw error;
  }
}

// Fetch tickets from Google Sheets
router.get('/tickets', async (req, res) => {
  try {
    console.log('Starting tickets fetch...');
    
    // Verify environment variables
    if (!process.env.GOOGLE_SHEET_ID) {
      throw new Error('GOOGLE_SHEET_ID is not set in environment variables');
    }
    
    console.log('Sheet ID:', process.env.GOOGLE_SHEET_ID);
    
    const sheets = await getSheetsClient();
    console.log('Got sheets client');
    
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    // Get sheet names
    const sheetsResponse = await sheets.spreadsheets.get({
      spreadsheetId
    });
    console.log('Available sheets:', sheetsResponse.data.sheets.map(sheet => 
      sheet.properties.title
    ));

    // Get sheet data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Form Responses 1!A:Z',
    });
    
    console.log('Got sheet data');
    console.log('Values:', response.data.values ? 
      `Found ${response.data.values.length} rows` : 
      'No values found');

    if (!response.data.values) {
      return res.json([]);
    }

    const headers = response.data.values[0];
    console.log('Headers:', headers);

    const tickets = response.data.values.slice(1).map((row, index) => {
      // Create a function to add field only if it has a value
      const addIfExists = (value, prefix = '') => value && value.trim() !== '' ? 
        `${prefix}${value}` : null;

      const ticket = {
        timestamp: row[0],
        email: row[1] || 'No email provided',
        type: row[2] || 'Not specified',
        
        // Bug Report Fields
        details: {
          bugType: addIfExists(row[3]),
          device: addIfExists(row[4]),
          occurredTime: addIfExists(row[5]),
          additionalInfo: addIfExists(row[6])
        },

        // Profession/Word Fields
        profession: {
          category: addIfExists(row[7]),
          name: addIfExists(row[8]),
          word: addIfExists(row[9]),
          definition: addIfExists(row[10]),
          origin: addIfExists(row[11]),
          notes: addIfExists(row[12]),
          additionalInfo: addIfExists(row[13]),
          professionName: addIfExists(row[14])
        },

        // General Fields
        topic: addIfExists(row[15]),
        message: addIfExists(row[16]),
        
        // Feature Request Fields
        feature: addIfExists(row[17]),
        suggestions: [
          addIfExists(row[18]),
          addIfExists(row[19]),
          addIfExists(row[20]),
          addIfExists(row[21]),
          addIfExists(row[22]),
          addIfExists(row[23])
        ].filter(Boolean), // Remove empty suggestions

        status: row[25] || 'Pending',
        subject: row[2] || 'General Inquiry',
        date: new Date(row[0]).toISOString()
      };

      // Clean up empty objects
      Object.keys(ticket).forEach(key => {
        if (typeof ticket[key] === 'object' && ticket[key] !== null) {
          // Remove null/undefined values from nested objects
          Object.keys(ticket[key]).forEach(nestedKey => {
            if (!ticket[key][nestedKey]) {
              delete ticket[key][nestedKey];
            }
          });
          // Remove empty objects
          if (Object.keys(ticket[key]).length === 0) {
            delete ticket[key];
          }
        }
      });

      console.log(`Processed ticket ${index + 1}:`, ticket);
      return ticket;
    });

    console.log(`Successfully processed ${tickets.length} tickets`);
    res.json(tickets);
  } catch (error) {
    console.error('Detailed error:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });
    res.status(500).send(`Error fetching tickets: ${error.message}`);
  }
});

// Update ticket status in Google Sheets
async function updateTicketStatus(email, status) {
  try {
    const sheets = await getSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEET_ID;

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Form Responses 1!A:Z',
    });

    const rows = response.data.values;
    // Find the row by email
    const rowIndex = rows.findIndex(row => row[1] === email);

    if (rowIndex !== -1) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `Form Responses 1!Z${rowIndex + 1}`,
        valueInputOption: 'RAW',
        resource: {
          values: [[status]]
        }
      });
    }
  } catch (error) {
    console.error('Error updating ticket status:', error);
    throw error;
  }
}

// Reply to a ticket
router.post('/reply', async (req, res) => {
  const { email, reply, subject } = req.body;

  try {
    console.log('Sending reply to:', email);
    console.log('Reply content:', reply);
    
    // Send email
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: `Re: ${subject || 'Your ProVocis Ticket'}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <p>${reply}</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            This is an automated response from the ProVocis support team.<br>
            Please do not reply to this email. If you need further assistance, 
            please submit a new support ticket.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');

    // Update ticket status
    await updateTicketStatus(email, 'Responded');
    console.log('Ticket status updated');

    res.json({ 
      success: true,
      message: 'Reply sent successfully' 
    });
  } catch (error) {
    console.error('Detailed error:', {
      message: error.message,
      code: error.code,
      command: error.command,
      stack: error.stack
    });
    res.status(500).json({ 
      success: false,
      error: 'Failed to send reply',
      details: error.message
    });
  }
});

router.get('/test-sheet', async (req, res) => {
  try {
    const sheets = await getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'A1:Z1'  // Just get the first row to test
    });
    
    res.json({
      success: true,
      headers: response.data.values[0],
      sheetId: process.env.GOOGLE_SHEET_ID
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

router.get('/auth-test', async (req, res) => {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: path.join(__dirname, '../config/service-account.json'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const client = await auth.getClient();
    const projectId = await auth.getProjectId();

    res.json({
      success: true,
      projectId,
      credentials: client.credentials
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

router.get('/test-connection', async (req, res) => {
  try {
    const sheets = await getSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Form Responses 1!A1:Z1'
    });

    res.json({
      success: true,
      headers: response.data.values[0],
      sheetId: process.env.GOOGLE_SHEET_ID,
      serviceAccount: require(serviceAccountPath).client_email
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

module.exports = router; 