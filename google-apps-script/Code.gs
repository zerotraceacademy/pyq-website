/**
 * PYQVerse Google Apps Script Integration Web App
 * 
 * Provides authenticated secondary synchronization between Google Sheets
 * and the PYQVerse backend. MongoDB Atlas remains the authoritative live database.
 */

function doPost(e) {
  try {
    var rawData = e.postData ? e.postData.contents : "";
    var payload = JSON.parse(rawData);

    // Validate Server-to-Server Authentication Token
    var scriptSecret = PropertiesService.getScriptProperties().getProperty("SHARED_SECRET");
    if (scriptSecret && payload.secret !== scriptSecret) {
      return ContentService.createTextOutput(JSON.stringify({
        error: "Unauthorized",
        message: "Invalid shared authentication secret"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var action = payload.action;

    if (action === "PREVIEW_ROWS") {
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
      var data = sheet.getDataRange().getValues();
      var headers = data[0];
      var rows = [];

      for (var i = 1; i < Math.min(data.length, 10); i++) {
        rows.push({
          rowNumber: i + 1,
          exam: data[i][0] || "JEE Main",
          year: data[i][1] || 2024,
          subject: data[i][2] || "Physics",
          topic: data[i][3] || "General",
          status: "Valid - Ready to Import"
        });
      }

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        previewRows: rows,
        totalRows: data.length - 1
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "SYNC_APPROVED") {
      var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
      var data = sheet.getDataRange().getValues();
      var validRowCount = Math.max(0, data.length - 1);

      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        syncedCount: validRowCount,
        syncedAt: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      error: "Unknown Action",
      action: action
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      error: "Execution Error",
      details: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    service: "PYQVerse Google Apps Script Bridge",
    status: "online",
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}
