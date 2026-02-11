/**
 * Google Apps Script — Run this from script.google.com
 *
 * Creates shortcuts in your "Langly Intel" folder for all files
 * modified in the last 2 weeks. Run manually or set a daily trigger.
 */

// ---- CONFIG ----
const TARGET_FOLDER_NAME = "Langly Intel";
const DAYS_BACK = 14;
// ----------------

function syncRecentToLangly() {
  const folder = findOrCreateFolder(TARGET_FOLDER_NAME);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - DAYS_BACK);
  const cutoffStr = cutoff.toISOString();

  // Find all files modified in the last 2 weeks (not in trash, not folders, not shortcuts)
  const query = `modifiedDate > '${cutoffStr}' and trashed = false and mimeType != 'application/vnd.google-apps.folder' and mimeType != 'application/vnd.google-apps.shortcut'`;

  // Get existing shortcuts in the folder to avoid duplicates
  const existingTargets = new Set();
  const existingFiles = folder.getFiles();
  while (existingFiles.hasNext()) {
    const f = existingFiles.next();
    if (f.getMimeType() === 'application/vnd.google-apps.shortcut') {
      try {
        const targetId = f.getTargetId();
        if (targetId) existingTargets.add(targetId);
      } catch (e) {
        // Not a shortcut or no target
      }
    }
  }

  // Remove old shortcuts (files no longer in the 2-week window)
  // We'll rebuild shortcuts each run
  const toRemove = [];
  const existingIter = folder.getFiles();
  while (existingIter.hasNext()) {
    const f = existingIter.next();
    if (f.getMimeType() === 'application/vnd.google-apps.shortcut') {
      toRemove.push(f);
    }
  }
  for (const f of toRemove) {
    f.setTrashed(true);
  }

  // Search for recent files
  const files = DriveApp.searchFiles(query);
  let count = 0;
  const maxFiles = 50;

  while (files.hasNext() && count < maxFiles) {
    const file = files.next();

    // Skip files that are inside the target folder itself
    const parents = file.getParents();
    let inTarget = false;
    while (parents.hasNext()) {
      if (parents.next().getId() === folder.getId()) {
        inTarget = true;
        break;
      }
    }
    if (inTarget) continue;

    // Create shortcut via Drive API v2
    try {
      const shortcut = Drive.Files.insert({
        title: file.getName(),
        mimeType: 'application/vnd.google-apps.shortcut',
        shortcutDetails: {
          targetId: file.getId()
        },
        parents: [{ id: folder.getId() }]
      });
      count++;
    } catch (e) {
      Logger.log('Skip ' + file.getName() + ': ' + e.message);
    }
  }

  Logger.log('Created ' + count + ' shortcuts in ' + TARGET_FOLDER_NAME);
  return count;
}

function findOrCreateFolder(name) {
  const folders = DriveApp.getFoldersByName(name);
  if (folders.hasNext()) {
    return folders.next();
  }
  return DriveApp.createFolder(name);
}

/**
 * Set up a daily trigger to auto-sync.
 * Run this once to schedule it.
 */
function setupDailySync() {
  // Remove existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  for (const t of triggers) {
    if (t.getHandlerFunction() === 'syncRecentToLangly') {
      ScriptApp.deleteTrigger(t);
    }
  }

  // Create daily trigger at 6 AM
  ScriptApp.newTrigger('syncRecentToLangly')
    .timeBased()
    .everyDays(1)
    .atHour(6)
    .create();

  Logger.log('Daily sync trigger created (6 AM)');
}
