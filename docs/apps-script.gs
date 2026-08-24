function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var expected = PropertiesService.getScriptProperties().getProperty('SHARED_SECRET');
    if (data.secret !== expected) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'unauthorized' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Submissions')
      || SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    sheet.appendRow([new Date().toISOString(), data.name, data.email, data.phone]);
    return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
